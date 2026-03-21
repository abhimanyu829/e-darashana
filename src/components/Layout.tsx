import { ReactNode } from "react";
import { User } from "firebase/auth";
import { 
  BookOpen, 
  Briefcase, 
  Target, 
  Zap, 
  TrendingUp, 
  MoreHorizontal,
  LogOut,
  Clock,
  LayoutDashboard
} from "lucide-react";
import { SectionType } from "../types";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface LayoutProps {
  children: ReactNode;
  user: User;
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  onLogout: () => void;
}

const SECTIONS: { id: SectionType; label: string; icon: any }[] = [
  { id: "academic", label: "Academic", icon: BookOpen },
  { id: "project", label: "Projects", icon: LayoutDashboard },
  { id: "placement", label: "Placement", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Zap },
  { id: "business", label: "Business", icon: TrendingUp },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

export function Layout({ children, user, activeSection, onSectionChange, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col fixed h-full bg-zinc-950/50 backdrop-blur-xl z-50">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-xl tracking-tighter">CHRONOS AI</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-emerald-500" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span className="font-medium">{section.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-10 h-10 rounded-full border border-zinc-700" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
