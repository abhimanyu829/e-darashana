import { useState, useEffect } from "react";
import { Course, Task, Unit, TopicsMaster } from "../types";
import { 
  X, Shield, CheckCircle2, Circle, Clock, AlertCircle, 
  History, BookOpen, Calendar,
  BarChart, Zap, ArrowRight
} from "lucide-react";
import { differenceInSeconds, format } from "date-fns";
import { cn } from "../lib/utils";
import { courseApi, taskApi } from "../lib/api";

interface CourseDashboardProps {
  course: Course;
  onClose: () => void;
}

export function CourseDashboard({ course, onClose }: CourseDashboardProps) {
  const [topicsMaster, setTopicsMaster] = useState<TopicsMaster | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    if (!course._id) return;
    try {
      const topicsRes = await courseApi.getTopics(course._id);
      setTopicsMaster(topicsRes.data);
      
      const tasksRes = await taskApi.getTodayTasks(course._id);
      setTasks(tasksRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [course._id]);

  // Calculations based on STRICT LOGIC rules
  const allTopics = topicsMaster?.units.flatMap(u => u.topics) || [];
  const totalTopicsCount = allTopics.length;
  
  const completedTasksCount = tasks.filter(t => t.status === "completed").length; 
  
  const remainingTopicsCount = totalTopicsCount - completedTasksCount;

  const startDate = new Date(course.createdAt);
  const durationDays = course.durationDays;
  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(1, durationDays - daysPassed);

  const topicsPerDay = Math.ceil(remainingTopicsCount / remainingDays);

  const getRemainingTime = (deadline: string) => {
    const diff = differenceInSeconds(new Date(deadline), now);
    if (diff <= 0) return "EXPIRED";
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleToggleTask = async (task: Task) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await taskApi.updateTaskStatus(today, task._id || task.id!, !task.checkbox);
      fetchData();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 transition-all">
      <div className="bg-background border border-border w-full max-w-5xl max-h-[90vh] rounded-none overflow-hidden shadow-2xl flex flex-col transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-card transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#da7756]/10 rounded-none border border-[#da7756]/20">
              <Shield className="w-6 h-6 text-[#da7756]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground font-serif uppercase tracking-tight">{course.name}</h2>
              <p className="text-muted flex items-center gap-2 text-sm font-serif">
                <Calendar className="w-4 h-4" /> Started {format(startDate, "MMM do, yyyy")} • {durationDays} Days Goal
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-card rounded-none transition-colors">
            <X className="w-6 h-6 text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Zap className="w-8 h-8 text-[#da7756] animate-pulse" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-none border border-border transition-colors">
                  <div className="text-muted text-xs font-bold uppercase tracking-wider mb-2 font-serif">Completion</div>
                  <div className="text-3xl font-bold text-[#da7756]">
                    {totalTopicsCount > 0 ? Math.round((completedTasksCount / totalTopicsCount) * 100) : 0}%
                  </div>
                  <div className="text-xs text-muted mt-1 font-serif">{completedTasksCount} / {totalTopicsCount} Topics</div>
                </div>
                <div className="bg-card p-6 rounded-none border border-border transition-colors">
                  <div className="text-muted text-xs font-bold uppercase tracking-wider mb-2 font-serif">Days Remaining</div>
                  <div className="text-3xl font-bold text-foreground">{remainingDays}</div>
                  <div className="text-xs text-muted mt-1 font-serif">out of {durationDays} days</div>
                </div>
                <div className="bg-[#da7756]/5 p-6 rounded-none border border-[#da7756]/10 transition-colors">
                  <div className="text-[#da7756]/70 text-xs font-bold uppercase tracking-wider mb-2 font-serif">Current Workload</div>
                  <div className="text-3xl font-bold text-[#da7756]">{topicsPerDay}</div>
                  <div className="text-xs text-[#da7756]/50 mt-1 font-serif">Topics per day</div>
                </div>
                <div className="bg-card p-6 rounded-none border border-border transition-colors">
                  <div className="text-muted text-xs font-bold uppercase tracking-wider mb-2 font-serif">Pace</div>
                  <div className="text-3xl font-bold text-foreground">
                    {daysPassed > 0 ? (completedTasksCount / daysPassed).toFixed(1) : 0}
                  </div>
                  <div className="text-xs text-muted mt-1 font-serif">Avg topics/day</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Today's Focus */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-foreground font-serif">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Today's Execution Focus
                  </h3>
                  <div className="space-y-4">
                    {tasks.length === 0 ? (
                      <div className="p-8 text-center bg-card border border-dashed border-border rounded-none text-muted font-serif">
                        No tasks assigned for today yet.
                      </div>
                    ) : (
                      tasks.map((task) => (
                         <div key={task._id} className={cn(
                          "p-5 rounded-none border transition-all flex items-center justify-between",
                          task.status === "completed" 
                            ? "bg-[#da7756]/5 border-[#da7756]/20 opacity-60" 
                            : "bg-card border-border hover:border-[#da7756]/30"
                        )}>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleToggleTask(task)}
                              className={cn(
                                "p-1 rounded-none transition-colors",
                                 task.status === "completed" ? "text-[#da7756]" : "text-muted hover:text-[#da7756]"
                              )}
                            >
                              {task.status === "completed" ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </button>
                            <div>
                              <div className="font-bold text-foreground font-serif">{task.topicTitle}</div>
                              <div className="text-xs text-muted flex items-center gap-3 mt-1 font-serif">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {getRemainingTime(task.deadline)}
                                </span>
                                {task.status === "delayed" && (
                                  <span className="text-amber-500 font-bold flex items-center gap-1">
                                    <History className="w-3 h-3" /> DELAYED
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted/50" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Syllabus Overview */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-foreground font-serif">
                    <BookOpen className="w-5 h-5 text-[#da7756]" />
                    Syllabus Progress
                  </h3>
                  <div className="space-y-4">
                    {topicsMaster?.units.map((unit, idx) => (
                      <div key={unit._id} className="bg-card border border-border rounded-none p-4 transition-colors">
                        <div className="text-xs font-bold text-muted uppercase mb-3 flex justify-between font-serif">
                          <span>Unit {idx + 1}: {unit.unitName}</span>
                        </div>
                        <div className="space-y-2">
                          {unit.topics.map(topic => (
                            <div key={topic._id} className="flex items-center justify-between text-sm">
                              <span className="text-foreground truncate pr-4 font-serif">{topic.topicTitle}</span>
                              <span className="text-xs text-muted font-mono bg-background px-1 border border-border transition-colors">P{topic.globalOrderIndex}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
