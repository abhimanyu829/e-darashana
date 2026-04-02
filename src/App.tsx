import { useState, useEffect } from "react";
import { signInWithGoogle, logout, onAuthStateChanged, getCurrentUser, getAuthToken, User } from "./lib/firebase";
import { Layout } from "./components/Layout";
import { CourseManager } from "./components/CourseManager";
import { DailyPlanner } from "./components/DailyPlanner";
import { Analytics } from "./components/Analytics";
import { Auth } from "./components/Auth";
import { Course, SectionType, Task } from "./types";
import { Loader2 } from "lucide-react";
import { courseApi, taskApi } from "./lib/api";
import { connectSocket, disconnectSocket, socket } from "./lib/socket";
import { requestAndSubscribe } from "./services/pushNotificationService";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionType>("academic");
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [serverTime, setServerTime] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        connectSocket(user.uid);
      } else {
        disconnectSocket();
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Push Notification Subscription (non-destructive hook) ─────────────────
  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    if (token) {
      requestAndSubscribe(user.uid, token).catch(() => {}); // silent — never breaks app
    }
  }, [user?.uid]);
  // ─────────────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      const coursesRes = await courseApi.getCourses();
      setCourses(coursesRes.data);

      // Phase 4: Frontend Isolation - Fetch tasks only for the active section
      const tasksRes = await taskApi.getTodayTasks(undefined, activeSection);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();

    // STEP 15: REAL-TIME RULE (Sync timers using server time)
    socket.on('time-sync', ({ serverTime }) => {
      setServerTime(serverTime);
    });

    return () => {
      socket.off('time-sync');
    };
  }, [user, activeSection]);

      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground font-serif transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-[#da7756]" />
      </div>

  const handleGoogleLogin = async (credential: string) => {
    try {
      const loggedInUser = await signInWithGoogle(credential);
      setUser(loggedInUser as any); // VERY IMPORTANT
      await fetchData(); // dashboard APIs
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (!user) {
    return <Auth onLogin={handleGoogleLogin as any} />;
  }

  return (
    <Layout
      user={user}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onLogout={() => {
        logout();
        setUser(null);
      }}
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground capitalize font-serif mb-1">
                Karyadarshana {activeSection}
              </h1>
              <p className="text-muted font-serif">
                Systematic execution and management for your {activeSection} objectives.
              </p>
            </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Standard Time</span>
                <div className="text-xl md:text-2xl font-bold font-mono text-[#da7756] bg-[#da7756]/10 px-4 py-2 border border-[#da7756]/20 shadow-sm">
                  {new Date(serverTime).toLocaleString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </div>
              </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <DailyPlanner
              user={user}
              section={activeSection}
              courses={courses.filter(c => c.section === activeSection)}
              tasks={tasks}
              serverTime={serverTime}
              onTaskUpdated={fetchData}
            />
          </div>
          <div className="space-y-8">
            <CourseManager
              user={user}
              section={activeSection}
              courses={courses.filter(c => c.section === activeSection)}
              onCourseAdded={fetchData}
            />
            <Analytics
              tasks={tasks}
              section={activeSection}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
