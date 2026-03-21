import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin for Backend Logic (Bypasses Security Rules)
admin.initializeApp({
  projectId: firebaseConfig.projectId,
});

// Use the correct database ID directly in the firestore() call
const db = admin.firestore(firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)" 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined
);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Socket.io for real-time updates (Time Engine)
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    socket.on("join-room", (userId) => {
      socket.join(userId);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // CORE LOGIC: Carry-Forward Engine (Using Admin SDK)
  const processCarryForward = async () => {
    console.log("🚀 Running Carry-Forward Engine (Strict Logic Mode)...");
    const now = new Date();
    const nowIso = now.toISOString();
    
    try {
      // 1. Find all active topics that have expired across all courses
      const topicsRef = db.collection("topics");
      console.log("[CARRY-FORWARD] Fetching expired topics...");
      const expiredSnapshot = await topicsRef
        .where("status", "==", "active")
        .where("deadline", "<", nowIso)
        .get();
      
      console.log(`[CARRY-FORWARD] Found ${expiredSnapshot.size} expired topics.`);

      const batch = db.batch();
      expiredSnapshot.docs.forEach((topicDoc) => {
        const data = topicDoc.data();
        batch.update(topicDoc.ref, {
          status: "delayed",
          delayCount: (data.delayCount || 0) + 1,
          isCarryForward: true
        });
      });
      await batch.commit();

      // 2. Process each active course for new assignments
      const coursesRef = db.collection("courses");
      const activeCoursesSnapshot = await coursesRef.where("status", "==", "active").get();

      for (const courseDoc of activeCoursesSnapshot.docs) {
        const course = courseDoc.data();
        const courseId = courseDoc.id;
        
        // Calculate dynamic topicsPerDay
        // remainingTopics = totalTopics - completedTopics
        const allTopicsSnapshot = await topicsRef.where("courseId", "==", courseId).get();
        const totalTopicsCount = allTopicsSnapshot.size;
        const completedTopicsCount = allTopicsSnapshot.docs.filter(d => d.data().status === "completed").length;
        const remainingTopicsCount = totalTopicsCount - completedTopicsCount;

        if (remainingTopicsCount <= 0) continue;

        const startDate = new Date(course.startDate);
        const durationDays = course.durationDays;
        const diffTime = Math.max(0, now.getTime() - startDate.getTime());
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const remainingDays = Math.max(1, durationDays - daysPassed);

        const topicsPerDay = Math.ceil(remainingTopicsCount / remainingDays);
        console.log(`Course: ${course.name} | Remaining Topics: ${remainingTopicsCount} | Remaining Days: ${remainingDays} | TopicsPerDay: ${topicsPerDay}`);

        // Get delayed topics for this course (Highest Priority)
        const delayedSnapshot = await topicsRef
          .where("courseId", "==", courseId)
          .where("status", "==", "delayed")
          .orderBy("delayCount", "desc")
          .get();
        
        const delayedTopics = delayedSnapshot.docs;
        let assignedCount = 0;

        const courseBatch = db.batch();

        // STEP 1: Assign delayed topics first
        for (const topicDoc of delayedTopics) {
          if (assignedCount >= topicsPerDay) break;
          
          courseBatch.update(topicDoc.ref, {
            status: "active",
            assignedDate: nowIso,
            deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            isCarryForward: true
          });
          assignedCount++;
        }

        // STEP 2: Fill remaining slots with new (pending) topics
        if (assignedCount < topicsPerDay) {
          const pendingSnapshot = await topicsRef
            .where("courseId", "==", courseId)
            .where("status", "==", "pending")
            .limit(topicsPerDay - assignedCount)
            .get();
          
          pendingSnapshot.docs.forEach((topicDoc) => {
            courseBatch.update(topicDoc.ref, {
              status: "active",
              assignedDate: nowIso,
              deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
              isCarryForward: false
            });
          });
        }
        
        await courseBatch.commit();
      }

      io.emit("system-update", { type: "CARRY_FORWARD_COMPLETE" });
    } catch (error) {
      console.error("Error in Carry-Forward Engine:", error);
    }
  };

  // CRON JOBS
  // 1. Midnight Job: Carry-Forward Engine
  cron.schedule("0 0 * * *", async () => {
    await processCarryForward();
  });

  // 2. Every Minute: Sync Countdown & Check for immediate expirations or empty queues
  cron.schedule("* * * * *", async () => {
    io.emit("time-sync", { serverTime: new Date().toISOString() });
    
    // Check for expired topics or if any course needs new assignments
    const now = new Date();
    const nowIso = now.toISOString();
    const topicsRef = db.collection("topics");
    const coursesRef = db.collection("courses");

    try {
      // Check for expired topics
      const expiredSnapshot = await topicsRef
        .where("status", "==", "active")
        .where("deadline", "<", nowIso)
        .limit(1)
        .get();

      let needsProcessing = !expiredSnapshot.empty;

      if (!needsProcessing) {
        // Also check if any active course has 0 active topics (initial state)
        const activeCoursesSnapshot = await coursesRef.where("status", "==", "active").get();
        for (const courseDoc of activeCoursesSnapshot.docs) {
          const activeTopicsSnapshot = await topicsRef
            .where("courseId", "==", courseDoc.id)
            .where("status", "==", "active")
            .limit(1)
            .get();
          
          if (activeTopicsSnapshot.empty) {
            // Check if there are pending topics to assign
            const pendingSnapshot = await topicsRef
              .where("courseId", "==", courseDoc.id)
              .where("status", "==", "pending")
              .limit(1)
              .get();
            
            if (!pendingSnapshot.empty) {
              needsProcessing = true;
              break;
            }
          }
        }
      }

      if (needsProcessing) {
        console.log("[NODE-CRON] System update needed. Triggering carry-forward...");
        try {
          await processCarryForward();
          console.log("[NODE-CRON] Carry-forward completed successfully.");
        } catch (cfError) {
          console.error("[NODE-CRON] [ERROR] Carry-forward failed:", cfError);
        }
      } else {
        console.log("[NODE-CRON] No system update needed at this time.");
      }
    } catch (error) {
      console.error("[NODE-CRON] [ERROR] Minute cron job failed:", error);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Chronos AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
