import { useState } from "react";
import { BrainCircuit, Loader2, Wand2, X } from "lucide-react";
import { syllabusApi } from "../lib/api";

interface SyllabusParserProps {
  courseId: string;
  onClose: () => void;
}

export function SyllabusParser({ courseId, onClose }: SyllabusParserProps) {
  const [text, setText] = useState("");
  const [duration, setDuration] = useState(30);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!text) return;
    setIsParsing(true);
    setError(null);

    try {
      const uploadRes = await syllabusApi.uploadSyllabus({
        courseId,
        syllabusText: text,
        durationDays: duration
      });
      await syllabusApi.parseSyllabus(uploadRes.data._id);
      onClose();
    } catch (err) {
      console.error("Parsing error:", err);
      setError("Failed to parse syllabus. Please check the backend connection.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 transition-all">
      <div className="bg-background border border-border w-full max-w-2xl rounded-none overflow-hidden shadow-2xl transition-colors">
        <div className="p-6 border-b border-border flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3 text-foreground">
            <div className="p-2 bg-[#da7756]/10 rounded-none">
              <BrainCircuit className="w-5 h-5 text-[#da7756]" />
            </div>
            <h2 className="text-xl font-serif">AI Syllabus Parser</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-card rounded-none transition-colors">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-serif text-muted uppercase tracking-wider font-bold">Paste Syllabus Content</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your syllabus, course outline, or topics here..."
              className="w-full h-64 bg-card border border-border rounded-none p-4 text-foreground font-serif focus:outline-none focus:border-[#da7756]/50 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-serif text-muted uppercase tracking-wider font-bold">Duration (Days)</label>
              <input 
                type="number" 
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-card border border-border rounded-none px-4 py-3 text-foreground font-serif focus:outline-none focus:border-[#da7756]/50 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-none text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-border rounded-none font-serif text-muted hover:bg-card transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleParse}
              disabled={isParsing || !text}
              className="flex-2 px-6 py-3 bg-[#da7756] hover:bg-[#b75a40] disabled:opacity-50 disabled:hover:bg-[#da7756] text-black rounded-none font-serif flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI Processing...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Analyze & Generate Topics
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
