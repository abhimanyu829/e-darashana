import { useState, useEffect } from "react";
import { auth, signInWithGoogle, logout, db } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Layout } from "./components/Layout";
import { CourseManager } from "./components/CourseManager";
import { DailyPlanner } from "./components/DailyPlanner";
import { Analytics } from "./components/Analytics";
import { Auth } from "./components/Auth";
import { Course, SectionType, Topic, Task } from "./types";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionType>("academic");
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to courses
    const qCourses = query(collection(db, "courses"), where("userId", "==", user.uid));
    const unsubCourses = onSnapshot(qCourses, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });

    // Listen to tasks
    const qTasks = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });

    return () => {
      unsubCourses();
      unsubTasks();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={signInWithGoogle} />;
  }

  return (
    <Layout 
      user={user} 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
      onLogout={logout}
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-white capitalize">
            {activeSection} Engine
          </h1>
          <p className="text-zinc-400">
            Real-time execution and autonomous scheduling for your {activeSection} goals.
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <DailyPlanner 
              user={user}
              section={activeSection}
              courses={courses.filter(c => c.section === activeSection)}
              tasks={tasks.filter(t => t.section === activeSection)}
            />
          </div>
          <div className="space-y-8">
            <CourseManager 
              user={user}
              section={activeSection}
              courses={courses.filter(c => c.section === activeSection)}
            />
            <Analytics 
              tasks={tasks.filter(t => t.section === activeSection)}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
