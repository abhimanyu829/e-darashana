import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Course, SectionType, Task, Topic } from "../types";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  MoreVertical,
  BrainCircuit,
  ArrowRight,
  History,
  FastForward
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, updateDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { format, differenceInSeconds } from "date-fns";
import { cn } from "../lib/utils";

interface DailyPlannerProps {
  user: User;
  section: SectionType;
  courses: Course[];
  tasks: Task[];
}

export function DailyPlanner({ user, section, courses, tasks }: DailyPlannerProps) {
  const [now, setNow] = useState(new Date());
  const [activeTopics, setActiveTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (courses.length === 0) return;
    
    // Listen to topics for active courses
    // We only want topics that are active (assigned for today) 
    // or completed (if they were assigned for today)
    const q = query(
      collection(db, "topics"), 
      where("courseId", "in", courses.map(c => c.id).filter(Boolean)),
      where("status", "in", ["active", "completed"])
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const allTopics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
      // Filter for topics assigned in the current cycle (last 24h)
      const currentCycleTopics = allTopics.filter(topic => {
        if (topic.status === "active") return true;
        if (topic.status === "completed" && topic.assignedDate) {
          const assigned = new Date(topic.assignedDate);
          const now = new Date();
          return (now.getTime() - assigned.getTime()) < (24 * 60 * 60 * 1000);
        }
        return false;
      });
      setActiveTopics(currentCycleTopics);
    });

    return () => unsub();
  }, [courses]);

  const getRemainingTime = (deadline: string) => {
    const diff = differenceInSeconds(new Date(deadline), now);
    if (diff <= 0) return "EXPIRED";
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleToggleTopic = async (topic: Topic) => {
    if (!topic.id) return;
    
    if (topic.status === "completed") {
      // Unchecking: Check if it's past deadline
      const isPastDeadline = topic.deadline ? new Date(topic.deadline) < new Date() : false;
      await updateDoc(doc(db, "topics", topic.id), {
        status: isPastDeadline ? "delayed" : "active"
      });
    } else {
      // Checking: Mark as completed
      await updateDoc(doc(db, "topics", topic.id), {
        status: "completed"
      });
    }
  };

  const handleDeferTopic = async (topic: Topic) => {
    if (!topic.id) return;
    await updateDoc(doc(db, "topics", topic.id), {
      status: "delayed",
      delayCount: (topic.delayCount || 0) + 1,
      isCarryForward: true
    });
  };

  const handleToggleTask = async (task: Task) => {
    if (!task.id) return;
    await updateDoc(doc(db, "tasks", task.id), {
      status: task.status === "completed" ? "todo" : "completed"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <BrainCircuit className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Daily Execution Table</h2>
            <p className="text-sm text-zinc-500">Today: {format(now, "EEEE, MMMM do")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
          <Clock className="w-4 h-4 text-zinc-500" />
          <span className="font-mono text-sm text-zinc-300">{format(now, "HH:mm:ss")}</span>
        </div>
      </div>

      <div className="overflow-hidden border border-zinc-800 rounded-2xl bg-zinc-900/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Subject / Topic</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Target</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Time Remaining</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {activeTopics.map((topic) => (
              <tr key={topic.id} className={cn(
                "group transition-colors",
                topic.status === "completed" ? "bg-emerald-500/5 opacity-60" : "hover:bg-zinc-800/30",
                topic.status === "delayed" && "bg-red-500/5"
              )}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleToggleTopic(topic)}
                      className="transition-transform active:scale-90"
                    >
                      {topic.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className={cn("w-5 h-5", topic.status === "delayed" ? "text-red-500" : "text-zinc-700")} />
                      )}
                    </button>
                    <div>
                      <p className={cn(
                        "font-medium",
                        topic.status === "completed" ? "text-zinc-500 line-through" : "text-zinc-200",
                        topic.status === "delayed" && "text-red-400"
                      )}>
                        {topic.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {topic.isCarryForward && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase">
                            <History className="w-3 h-3" />
                            Pending from yesterday
                          </span>
                        )}
                        {topic.delayCount > 0 && (
                          <span className="text-[10px] text-zinc-500">
                            Delayed {topic.delayCount}x
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckCircle2 className="w-4 h-4 text-zinc-600" />
                    <span>24h Rolling Target</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {topic.deadline && topic.status !== "completed" && (
                    <div className="flex items-center gap-2">
                      <Clock className={cn("w-4 h-4", topic.status === "delayed" ? "text-red-500" : "text-zinc-500")} />
                      <span className={cn(
                        "font-mono text-sm",
                        topic.status === "delayed" ? "text-red-500" : "text-emerald-500"
                      )}>
                        {getRemainingTime(topic.deadline)}
                      </span>
                    </div>
                  )}
                  {topic.status === "completed" && (
                    <span className="text-xs text-emerald-500 font-bold uppercase">Completed</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium capitalize",
                    topic.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : 
                    topic.status === "delayed" ? "bg-red-500/10 text-red-500" : "bg-zinc-800 text-zinc-400"
                  )}>
                    {topic.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {topic.status === "active" && (
                      <button 
                        onClick={() => handleDeferTopic(topic)}
                        title="Defer to tomorrow"
                        className="p-2 text-zinc-500 hover:text-amber-500 transition-colors"
                      >
                        <FastForward className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {activeTopics.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No active topics for today. Start by adding a course.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Flexible Tasks Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 px-2">Flexible Tasks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => handleToggleTask(task)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4",
                task.status === "completed" 
                  ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" 
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
              )}
            >
              {task.status === "completed" ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              ) : (
                <Circle className="w-6 h-6 text-zinc-700" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("font-medium truncate", task.status === "completed" && "line-through text-zinc-500")}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                    task.priority === "high" ? "bg-red-500/20 text-red-500" : "bg-zinc-800 text-zinc-500"
                  )}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
