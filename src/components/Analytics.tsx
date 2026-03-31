import { useState, useEffect, useRef } from 'react';
import { ActivityLog, SectionType, Task } from '../types';
import { Activity, Info } from 'lucide-react';
import { activityApi } from '../lib/api';
import { socket } from '../lib/socket';

interface AnalyticsProps {
  tasks: Task[];
  section: SectionType;
}

export function Analytics({ tasks, section }: AnalyticsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number; y: number; content: React.ReactNode } | null>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await activityApi.getActivityLogs(section);
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch activity logs", err);
      }
    };
    fetchLogs();
  }, [section]);

  useEffect(() => {
    const handleActivityUpdate = (updatedLog: ActivityLog) => {
      // Only update if it matches current section
      if (updatedLog.section === section) {
        setLogs(prev => {
          const index = prev.findIndex(l => l.date === updatedLog.date);
          if (index >= 0) {
            const newLogs = [...prev];
            newLogs[index] = updatedLog;
            return newLogs;
          }
          return [...prev, updatedLog];
        });
      }
    };

    socket.on('activity_update', handleActivityUpdate);
    return () => {
      socket.off('activity_update', handleActivityUpdate);
    };
  }, [section]);

  const getColor = (score: number) => {
    if (score === 0) return "var(--border)";
    if (score < 0.3) return "#f7d7cd";
    if (score < 0.6) return "#eda78e";
    if (score < 0.9) return "#da7756";
    return "#b75a40";
  };

  // Generate the last 365 days of contribution boxes
  // Displayed as 52 columns x 7 rows
  const today = new Date();
  
  // To align the grid nicely (Sunday to Saturday rows)
  const daysInYear = 365;
  const gridDates: string[] = [];
  
  // Calculate start date to map nicely into columns
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - daysInYear);
  
  // Align start date to the beginning of that week (Sunday)
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Fill up to today (and end of the current week for neatness)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - today.getDay()));

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    gridDates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Map dates to their log entries
  const logMap = new Map(logs.map(l => [l.date, l]));

  // Create columns of weeks (7 days each)
  const weeks: string[][] = [];
  for (let i = 0; i < gridDates.length; i += 7) {
    weeks.push(gridDates.slice(i, i + 7));
  }

  // Compute Today's Score directly from `tasks` (since we get instant updates locally too)
  const todayStr = today.toISOString().split('T')[0];
  const completionRate = tasks.length > 0 
    ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 
    : 0;

  return (
    <div className="bg-card border border-border rounded-none p-6 space-y-6 relative transition-colors" ref={mainContainerRef}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground font-serif">
          <Activity className="w-5 h-5 text-[#da7756]" />
          Contribution Grid
        </h2>
        <div className="px-3 py-1 bg-[#da7756]/10 text-[#da7756] text-xs font-bold rounded-none capitalize">
          {section}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-background rounded-none border border-border">
          <p className="text-xs text-muted uppercase font-bold font-serif">Today's Completion</p>
          <p className="text-2xl font-bold text-foreground mt-1">{Math.round(completionRate)}%</p>
        </div>
        <div className="p-4 bg-background rounded-none border border-border">
          <p className="text-xs text-muted uppercase font-bold font-serif">Total Days Active</p>
          <p className="text-2xl font-bold text-foreground mt-1">{logs.filter(l => l.score > 0).length}</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="inline-flex gap-[3px]">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-[3px]">
              {week.map((dateStr) => {
                let log = logMap.get(dateStr);
                let score = log ? log.score : 0;
                let delayed = log ? log.delayedTasks : 0;

                // Live override for today based on current tasks prop
                if (dateStr === todayStr && tasks.length > 0) {
                  const completed = tasks.filter(t => t.status === 'completed' || t.checkbox).length;
                  const total = tasks.length;
                  const liveScore = total > 0 ? (completed / total) : 0;
                  // If backend log hasn't updated the delayed penalty, use what we have in log
                  score = Math.max(0, liveScore - (total > 0 ? delayed / total : 0));
                }

                const isFuture = new Date(dateStr) > today;
                
                return (
                  <div
                    key={dateStr}
                    onMouseEnter={(e) => {
                      if (!isFuture && mainContainerRef.current) {
                        const cellRect = e.currentTarget.getBoundingClientRect();
                        const containerRect = mainContainerRef.current.getBoundingClientRect();
                        
                        const displayDate = new Date(dateStr).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric'
                        });

                        setTooltip({
                          visible: true,
                          x: (cellRect.left - containerRect.left) + cellRect.width / 2,
                          y: (cellRect.top - containerRect.top) - 10,
                          content: (
                            <div className="text-center">
                              <div className="font-bold text-foreground text-sm font-serif">{displayDate}</div>
                              <div className="text-xs text-muted font-medium font-serif">
                                {Math.round(score * 100)}% Productivity 
                                {delayed > 0 ? ` (${delayed} delayed penalty)` : ''}
                              </div>
                            </div>
                          )
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    className={`w-[11px] h-[11px] rounded-[2px] cursor-pointer transition-colors ${isFuture ? 'bg-transparent' : 'hover:ring-1 hover:ring-white/50'}`}
                    style={{
                      backgroundColor: isFuture ? 'transparent' : getColor(score),
                      border: isFuture ? 'none' : '1px solid rgba(27,31,35,0.06)'
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Tooltip */}
      {tooltip?.visible && (
        <div 
          className="absolute z-50 pointer-events-none bg-card border border-border rounded-none shadow-xl px-3 py-2 text-sm transform -translate-x-1/2 -translate-y-full whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
          <div className="absolute w-2 h-2 bg-card border-r border-b border-border transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted font-serif">
          <div className="flex items-center gap-2">
            <Info className="w-3 h-3 text-[#da7756]" />
            <span>Updates in real-time. Delays reduce score.</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Less</span>
            <div className="w-[11px] h-[11px] rounded-[2px] border border-black/5" style={{ backgroundColor: getColor(0) }} />
            <div className="w-[11px] h-[11px] rounded-[2px] border border-black/5" style={{ backgroundColor: getColor(0.2) }} />
            <div className="w-[11px] h-[11px] rounded-[2px] border border-black/5" style={{ backgroundColor: getColor(0.4) }} />
            <div className="w-[11px] h-[11px] rounded-[2px] border border-black/5" style={{ backgroundColor: getColor(0.7) }} />
            <div className="w-[11px] h-[11px] rounded-[2px] border border-black/5" style={{ backgroundColor: getColor(1) }} />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
