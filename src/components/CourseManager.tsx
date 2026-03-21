import { useState } from "react";
import { User } from "firebase/auth";
import { Course, SectionType } from "../types";
import { Plus, Calendar, Clock, Shield, Trash2, BrainCircuit } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { addDays, format } from "date-fns";
import { SyllabusParser } from "./SyllabusParser";

interface CourseManagerProps {
  user: User;
  section: SectionType;
  courses: Course[];
}

export function CourseManager({ user, section, courses }: CourseManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [parsingCourseId, setParsingCourseId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [hours, setHours] = useState(4);

  const handleAddCourse = async () => {
    if (!name) return;
    const startDate = new Date().toISOString();
    const endDate = addDays(new Date(), duration).toISOString();

    const docRef = await addDoc(collection(db, "courses"), {
      userId: user.uid,
      section,
      name,
      durationDays: duration,
      startDate,
      endDate,
      dailyStudyHours: hours,
      isImmutable: true,
      status: "active"
    });

    setName("");
    setIsAdding(false);
    // Automatically open parser for academic/project sections
    if (section === "academic" || section === "project") {
      setParsingCourseId(docRef.id);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "courses", id));
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
      {parsingCourseId && (
        <SyllabusParser 
          courseId={parsingCourseId} 
          onClose={() => setParsingCourseId(null)} 
        />
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          Active Courses
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isAdding && (
        <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 space-y-4">
          <input 
            type="text" 
            placeholder="Course Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-bold">Duration (Days)</label>
              <input 
                type="number" 
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-bold">Daily Hours</label>
              <input 
                type="number" 
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
              />
            </div>
          </div>
          <button 
            onClick={handleAddCourse}
            className="w-full py-2 bg-emerald-500 text-black font-bold rounded-lg"
          >
            Create Immutable Course
          </button>
        </div>
      )}

      <div className="space-y-3">
        {courses.map((course) => (
          <div key={course.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl group hover:border-zinc-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-zinc-100">{course.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(course.endDate), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.dailyStudyHours}h/day
                  </span>
                </div>
              </div>
              <button 
                onClick={() => course.id && handleDelete(course.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {/* Progress Bar */}
            <div className="mt-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: '35%' }} // Mock progress
              />
            </div>
          </div>
        ))}
        {courses.length === 0 && !isAdding && (
          <p className="text-center py-8 text-zinc-500 text-sm">No active courses in this section.</p>
        )}
      </div>
    </div>
  );
}
