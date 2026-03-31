import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
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

type FirebaseAppletConfig = {
  projectId?: string;
  firestoreDatabaseId?: string;
};

type TopicQueueRecord = {
  id: string;
  status?: "pending" | "active" | "completed" | "delayed";
  assignedDate?: string;
  delayCount?: number;
};

const typedFirebaseConfig = firebaseConfig as FirebaseAppletConfig;

// Initialize Firebase Admin for Backend Logic (Bypasses Security Rules)
admin.initializeApp({
  projectId: typedFirebaseConfig.projectId,
});

// Use the correct database ID directly in the firestore() call
const db = getFirestore(typedFirebaseConfig.firestoreDatabaseId && typedFirebaseConfig.firestoreDatabaseId !== "(default)" 
  ? typedFirebaseConfig.firestoreDatabaseId 
  : undefined
);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "https://e-darashana-frontend.onrender.com",
        "https://abhibhi.in"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const PORT = Number(process.env.PORT || 3000);

  app.use(
    cors({
      origin: [
        "https://e-darashana-frontend.onrender.com",
        "https://abhibhi.in"
      ],
      credentials: true
    })
  );
  app.use(express.json());
  
  // API Routes
  app.get("/api/courses", async (req, res) => {
    try {
      const snapshot = await db.collection("courses").get();
      const courses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const docRef = await db.collection("courses").add(req.body);
      res.json({ success: true, id: docRef.id });
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.post("/api/notifications/subscribe", async (req, res) => {
    try {
      const { subscription } = req.body;
      await db.collection("pushSubscriptions").add({
        subscription,
        createdAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.post("/api/process-queue", async (req, res) => {
    try {
      await processCarryForward();
      res.json({ success: true });
    } catch (error) {
      console.error("Manual queue processing error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
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
  async function processCarryForward() {
    // Short-circuit: legacy Firestore carry-forward disabled. Backend (MongoDB/BullMQ) handles this.
    console.log("🚀 Running Carry-Forward Engine (Strict Logic Mode)...");
    const now = new Date();
    const nowIso = now.toISOString();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    try {
      // Legacy Firestore references disabled
      const topicsRef = db.collection("topics");
      console.log("[CARRY-FORWARD] Fetching expired topics...");
      // const expiredSnapshot = await topicsRef
      //   .where("status", "==", "active")
      //   .where("deadline", "<", nowIso)
      //   .get();
      
      // console.log(`[CARRY-FORWARD] Found ${expiredSnapshot.size} expired topics.`);

      // const batch = db.batch();
      let expiredUpdates = 0;
      // (legacy disabled)

      const coursesRef = db.collection("courses");
      const activeCoursesSnapshot = await coursesRef.where("status", "==", "active").get();

      for (const courseDoc of activeCoursesSnapshot.docs) {
        const course = courseDoc.data();
        const courseId = courseDoc.id;
        
        const allTopicsSnapshot = await topicsRef.where("courseId", "==", courseId).get();
        const allTopics: TopicQueueRecord[] = allTopicsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as TopicQueueRecord));
        const totalTopicsCount = allTopics.length;
        const completedTopicsCount = allTopics.filter((topic) => topic.status === "completed").length;
        const remainingTopicsCount = totalTopicsCount - completedTopicsCount;

        if (remainingTopicsCount <= 0) continue;

        const startDate = new Date(course.startDate);
        const durationDays = course.durationDays;
        const diffTime = Math.max(0, now.getTime() - startDate.getTime());
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const remainingDays = Math.max(1, durationDays - daysPassed);

        const topicsPerDay = Math.ceil(remainingTopicsCount / remainingDays);
        console.log(`Course: ${course.name} | Remaining Topics: ${remainingTopicsCount} | Remaining Days: ${remainingDays} | TopicsPerDay: ${topicsPerDay}`);

        const cycleAssignedCount = allTopics.filter((topic) => {
          if (!topic.assignedDate) return false;
          const assignedAt = new Date(topic.assignedDate).getTime();
          if (Number.isNaN(assignedAt)) return false;
          return now.getTime() - assignedAt < oneDayMs && topic.status !== "pending";
        }).length;

        const remainingCapacity = Math.max(0, topicsPerDay - cycleAssignedCount);
        if (remainingCapacity === 0) {
          continue;
        }

        const delayedTopics = allTopics
          .filter((topic) => {
            if (topic.status !== "delayed") return false;
            if (!topic.assignedDate) return true;
            const assignedAt = new Date(topic.assignedDate).getTime();
            if (Number.isNaN(assignedAt)) return true;
            return now.getTime() - assignedAt >= oneDayMs;
          })
          .sort((a, b) => (b.delayCount || 0) - (a.delayCount || 0));
        const pendingTopics = allTopics
          .filter((topic) => topic.status === "pending")
          .sort((a, b) => {
            const indexA = (a as any).orderIndex !== undefined ? (a as any).orderIndex : 999999;
            const indexB = (b as any).orderIndex !== undefined ? (b as any).orderIndex : 999999;
            return indexA - indexB;
          });
        
        let assignedCount = 0;
        const courseBatch = db.batch();
        let courseUpdates = 0;

        for (const topicDoc of delayedTopics) {
          if (assignedCount >= remainingCapacity) break;
          
          const topicRef = topicsRef.doc(topicDoc.id);
          courseBatch.update(topicRef, {
            status: "active",
            assignedDate: nowIso,
            deadline: new Date(now.getTime() + oneDayMs).toISOString(),
            isCarryForward: true
          });
          assignedCount++;
          courseUpdates++;
        }

        for (const topicDoc of pendingTopics) {
          if (assignedCount >= remainingCapacity) break;
          const topicRef = topicsRef.doc(topicDoc.id);
          courseBatch.update(topicRef, {
            status: "active",
            assignedDate: nowIso,
            deadline: new Date(now.getTime() + oneDayMs).toISOString(),
            isCarryForward: false
          });
          assignedCount++;
          courseUpdates++;
        }
        
        if (courseUpdates > 0) {
          await courseBatch.commit();
        }
      }

      io.emit("system-update", { type: "CARRY_FORWARD_COMPLETE" });
    } catch (error) {
      console.error("Error in Carry-Forward Engine:", error);
    }
  };

  // CRON JOBS
  // 1. Midnight Job: Carry-Forward Engine
  // Disabled legacy cron (MongoDB/BullMQ in backend handles midnight tasks)
  // cron.schedule("0 0 * * *", async () => {
  //   await processCarryForward();
  // });

  // 2. Every Minute: Sync Countdown & Check for immediate expirations or empty queues
  // Keep time-sync only; do not call legacy carry-forward
  // cron.schedule("* * * * *", async () => {
  //   io.emit("time-sync", { serverTime: new Date().toISOString() });
  //   try {
  //     await processCarryForward();
  //     console.log("[NODE-CRON] Carry-forward completed successfully.");
  //   } catch (cfError) {
  //     console.error("[NODE-CRON] [ERROR] Carry-forward failed:", cfError);
  //   }
  // });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Chronos AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
