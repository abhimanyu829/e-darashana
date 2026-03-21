import { useState } from "react";
import { BrainCircuit, Loader2, Wand2, X } from "lucide-react";
import { parseSyllabus } from "../services/aiService";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface SyllabusParserProps {
  courseId: string;
  onClose: () => void;
}

export function SyllabusParser({ courseId, onClose }: SyllabusParserProps) {
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!text) return;
    setIsParsing(true);
    setError(null);

    try {
      const result = await parseSyllabus(text);
      
      // Flatten subjects/chapters/topics into Firestore topics
      for (const subject of result.subjects) {
        // Create a subject first (simplified for MVP)
        const subjectRef = await addDoc(collection(db, "subjects"), {
          courseId,
          name: subject.name,
          priorityIndex: 1,
          color: "#10b981"
        });

        for (const chapter of subject.chapters) {
          for (const topicName of chapter.topics) {
            await addDoc(collection(db, "topics"), {
              courseId,
              subjectId: subjectRef.id,
              name: `${chapter.name}: ${topicName}`,
              status: "pending",
              estimatedTime: 2,
              isLocked: true,
              delayCount: 0,
              isCarryForward: false
            });
          }
        }
      }
      onClose();
    } catch (err) {
      console.error("Parsing error:", err);
      setError("Failed to parse syllabus. Please check the format and try again.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold">AI Syllabus Parser</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Paste Syllabus Content</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your syllabus, course outline, or topics here..."
              className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleParse}
              disabled={isParsing || !text}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-bold py-4 rounded-2xl transition-all"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Syllabus...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Execution Plan
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 bg-zinc-950/50 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 text-center">
            Our AI will automatically structure your syllabus into subjects, chapters, and topics with 24h rolling deadlines.
          </p>
        </div>
      </div>
    </div>
  );
}
