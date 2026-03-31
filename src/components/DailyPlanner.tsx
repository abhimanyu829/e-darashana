import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Course, SectionType, Task } from "../types";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  History,
  BrainCircuit
} from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { cn } from "../lib/utils";
import { taskApi } from "../lib/api";

interface DailyPlannerProps {
  user: User;
  section: SectionType;
  courses: Course[];
  tasks: Task[];
  serverTime?: string | null;
  onTaskUpdated?: () => void;
}

export function DailyPlanner({ user, section, courses, tasks, serverTime, onTaskUpdated }: DailyPlannerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (serverTime) {
      setNow(new Date(serverTime));
    }
    const timer = setInterval(() => {
      setNow(prev => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [serverTime]);

  const getRemainingTime = (deadline: string) => {
    const diff = differenceInSeconds(new Date(deadline), now);
    if (diff <= 0) return "EXPIRED";
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleToggleTask = async (task: any) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await taskApi.updateTaskStatus(today, task._id || task.id, !task.checkbox);
      onTaskUpdated?.();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex items-center justify-between bg-card border border-border p-4 rounded-none transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#da7756]/10 rounded-none border border-[#da7756]/20">
            <BrainCircuit className="w-6 h-6 text-[#da7756]" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground font-serif">Daily Execution Table</h2>
            <p className="text-sm text-muted font-serif">Today: {format(now, "EEEE, MMMM do")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-none border border-border transition-colors">
          <Clock className="w-4 h-4 text-muted" />
          <span className="font-mono text-sm text-foreground">{format(now, "HH:mm:ss")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Tasks */}
        <div className="bg-card border border-border rounded-none p-6 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground font-serif">
              <Clock className="w-5 h-5 text-[#da7756]" />
              Active Tasks
            </h2>
          </div>

          <div className="space-y-3">
            {activeTasks.length === 0 ? (
              <div className="text-center py-8 text-muted border border-dashed border-border rounded-none font-serif">
                No active tasks for today.
              </div>
            ) : (
              activeTasks.map((task: any) => (
                <div 
                  key={task._id || task.id}
                  className={cn(
                    "group relative p-4 bg-background border border-border rounded-none hover:bg-card transition-all",
                    task.status === "delayed" && "border-amber-500/30 bg-amber-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => handleToggleTask(task)}
                        className="mt-1 text-muted hover:text-[#da7756] transition-colors"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="font-semibold text-foreground font-serif">{task.topicTitle}</h3>
                        <p className="text-xs text-muted mt-1 flex items-center gap-2 font-serif">
                          {task.status === "delayed" ? (
                            <span className="text-amber-500 flex items-center gap-1 font-bold">
                              <History className="w-3 h-3" /> CARRY FORWARD
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {getRemainingTime(task.deadline)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-card border border-border rounded-none p-6 space-y-4 transition-colors">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground font-serif">
            <CheckCircle2 className="w-5 h-5 text-[#da7756]" />
            Completed
          </h2>
          <div className="space-y-3 opacity-60">
            {completedTasks.length === 0 ? (
              <div className="text-center py-8 text-muted border border-dashed border-border rounded-none font-serif">
                Finish a task to see it here.
              </div>
            ) : (
              completedTasks.map((task: any) => (
                <div key={task._id || task.id} className="p-4 bg-background border border-border rounded-none flex items-center gap-3 transition-colors">
                  <button 
                    onClick={() => handleToggleTask(task)}
                    className="text-[#da7756]"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <span className="text-muted line-through font-serif">{task.topicTitle}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
