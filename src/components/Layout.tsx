import { ReactNode, useState } from "react";
import { User } from "../lib/firebase";
import { 
  BookOpen, 
  Briefcase, 
  Target, 
  Zap, 
  TrendingUp, 
  MoreHorizontal,
  LogOut,
  Clock,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { SectionType } from "../types";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { NotificationDebug } from "./NotificationDebug";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
  user: User;
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  onLogout: () => void;
}

const SECTIONS: { id: SectionType; label: string; icon: any }[] = [
  { id: "academic", label: "Academic", icon: BookOpen },
  { id: "exam", label: "Exam Prep", icon: Target },
  { id: "skill", label: "Skills", icon: Zap },
  { id: "placement", label: "Placement", icon: Briefcase },
  { id: "project", label: "Project", icon: LayoutDashboard },
  { id: "othertasks", label: "Other Tasks", icon: MoreHorizontal },
];

export function Layout({ children, user, activeSection, onSectionChange, onLogout }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors">
      {/* Sidebar */}
      <aside className={cn(
        "border-r border-border flex flex-col fixed h-full bg-background z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn(
          "p-4 flex items-center border-b border-border transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn(
              "border border-[#da7756] overflow-hidden flex items-center justify-center bg-black transition-all duration-300",
              isCollapsed ? "w-12 h-12" : "w-14 h-14"
            )}>
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-bold text-lg tracking-normal uppercase text-foreground whitespace-nowrap"
              >
                KARYA
              </motion.span>
            )}
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-card border border-transparent hover:border-border transition-colors text-muted hover:text-foreground"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
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
                  "w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 group border border-transparent",
                  isActive 
                    ? "bg-[#da7756]/10 text-[#da7756] border-[#da7756]/40" 
                    : "text-muted hover:bg-card hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#da7756]" : "text-zinc-500 group-hover:text-zinc-300")} />
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {section.label}
                  </motion.span>
                )}
              </button>
            );
          })}
          
        </nav>

        <div className={cn("p-4 border-t border-border space-y-4", isCollapsed && "px-2")}>
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "px-2")}>
            <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-10 h-10 shrink-0 rounded-none border border-border" referrerPolicy="no-referrer" />
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium truncate text-foreground">{user.displayName}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </motion.div>
            )}
          </div>
          <div className={cn("flex items-center gap-2 px-1", isCollapsed ? "flex-col" : "justify-between")}>
            <button 
              onClick={onLogout}
              className={cn(
                "flex items-center gap-3 px-4 py-2 transition-colors border border-transparent hover:border-red-400/30",
                isCollapsed ? "p-2 justify-center" : "flex-1 text-muted hover:text-red-400 hover:bg-red-400/10"
              )}
              title="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
            <ThemeToggle />
          </div>
          
          <div className="pt-2">
            <NotificationDebug />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 p-8 transition-all duration-300 ease-in-out",
        isCollapsed ? "ml-20" : "ml-64"
      )}>
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto"
        >
          {children}
        </motion.div>

        {/* Footer Section */}
        <footer className="mt-12 pt-8 border-t border-border flex flex-col items-center gap-4 text-center pb-8 transition-colors">
          <div className="w-24 h-24 grayscale opacity-100  cursor-help">
            <img src="/1000100177.png" alt="Footer Logo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted font-serif uppercase tracking-[0.2em]">Karyadarshana Protocol</p>
            <p className="text-[10px] text-muted/50 font-serif">© 2026 Structured Execution Environment. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
