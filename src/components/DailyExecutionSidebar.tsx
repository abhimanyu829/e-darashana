import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Clock } from "lucide-react";

interface DailyExecutionSidebarProps {
  user: User;
}

export function DailyExecutionSidebar({ user }: DailyExecutionSidebarProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Clock className="w-5 h-5 text-emerald-500" />
        Execution
      </h3>
      <div className="text-xs text-zinc-500">Server-synced time widgets appear here.</div>
    </div>
  );
}
