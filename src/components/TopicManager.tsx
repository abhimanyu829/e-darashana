import { useState, useEffect } from "react";
import { TopicsMaster, Unit, Topic } from "../types";
import { X, Layers, AlertCircle, Clock, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import api from "../lib/api";

interface TopicManagerProps {
  courseId: string;
  courseName: string;
  onClose: () => void;
}

export function TopicManager({ courseId, courseName, onClose }: TopicManagerProps) {
  const [topicsMaster, setTopicsMaster] = useState<TopicsMaster | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/topics`);
        setTopicsMaster(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };
    fetchData();
  }, [courseId]);

  const allTopics = topicsMaster?.units.flatMap(u => u.topics) || [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 transition-all">
      <div className="bg-background border border-border w-full max-w-4xl max-h-[85vh] rounded-none overflow-hidden shadow-2xl flex flex-col transition-colors">
        <div className="p-6 border-b border-border flex items-center justify-between bg-card transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#da7756]/10 rounded-none">
              <Layers className="w-5 h-5 text-[#da7756]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground font-serif">Manage Topics</h2>
              <p className="text-sm text-muted font-serif">{courseName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-none transition-colors">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-none h-8 w-8 border-t-2 border-b-2 border-[#da7756]"></div>
            </div>
          ) : allTopics.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-serif">No topics found. Add a syllabus to generate topics.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {topicsMaster?.units.map((unit, uIdx) => (
                <div key={unit._id || uIdx} className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2 font-serif">
                    <span className="text-xs bg-card px-2 py-1 rounded-none text-muted font-mono border border-border">UNIT {uIdx + 1}</span>
                    {unit.unitName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unit.topics.map((topic) => (
                      <div 
                        key={topic._id}
                        className="p-4 bg-background border border-border rounded-none flex items-center justify-between group hover:border-[#da7756]/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted/50">#{topic.globalOrderIndex}</span>
                          <span className="text-foreground font-medium font-serif">{topic.topicTitle}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
