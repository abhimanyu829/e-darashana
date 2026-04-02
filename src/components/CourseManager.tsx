import { useState } from "react";
import { User } from "../lib/firebase";
import { Course, SectionType } from "../types";
import { Plus, Calendar, Clock, Shield, Trash2, BrainCircuit, Layers } from "lucide-react";
import { addDays, format } from "date-fns";
import { SyllabusParser } from "./SyllabusParser";
import { TopicManager } from "./TopicManager";
import { CourseDashboard } from "./CourseDashboard";
import api, { courseApi } from "../lib/api";


interface CourseManagerProps {
  user: User;
  section: SectionType;
  courses: Course[];
  onCourseAdded?: () => void;
}

export function CourseManager({ user, section, courses, onCourseAdded }: CourseManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [parsingCourseId, setParsingCourseId] = useState<string | null>(null);
  const [managingCourse, setManagingCourse] = useState<{ id: string, name: string } | null>(null);
  const [dashboardCourse, setDashboardCourse] = useState<Course | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState<string | number>(30);
  const [hours, setHours] = useState<string | number>(4);

  const handleAddCourse = async () => {

    try {
      if (!user) {
        alert("Please login first");
        return;
      }
      const durationNum = typeof duration === "string" ? Number(duration || "0") : Number(duration);
      const hoursNum = typeof hours === "string" ? Number(hours || "0") : Number(hours);

      if (!name || name.trim().length < 3) {
        alert("Course name must be at least 3 characters");
        return;
      }
      if (!durationNum || isNaN(durationNum) || durationNum <= 0) {
        alert("Enter valid duration");
        return;
      }
      if (!hoursNum || isNaN(hoursNum) || hoursNum <= 0) {
        alert("Enter valid daily hours");
        return;
      }

      await courseApi.createCourse({
        name: name.trim(),
        durationDays: durationNum,
        dailyStudyHours: hoursNum,
        section
      });

      setName("");
      setIsAdding(false);
      onCourseAdded?.();
    } catch (error: any) {
      console.error("Error adding course:", error);
      alert(error.response?.data?.message || "Failed to create course. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course? This will also delete all associated syllabus, topics, and tasks.")) return;
    try {
      await courseApi.deleteCourse(id);
      onCourseAdded?.();
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course. Please try again.");
    }
  };

  return (
    <div className="bg-card border border-border rounded-none p-6 space-y-6 transition-colors">
      {parsingCourseId && (
        <SyllabusParser
          courseId={parsingCourseId}
          onClose={() => setParsingCourseId(null)}
        />
      )}
      {managingCourse && (
        <TopicManager
          courseId={managingCourse.id}
          courseName={managingCourse.name}
          onClose={() => setManagingCourse(null)}
        />
      )}
      {dashboardCourse && (
        <CourseDashboard
          course={dashboardCourse}
          onClose={() => setDashboardCourse(null)}
        />
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground font-serif">
          <Shield className="w-5 h-5 text-[#da7756]" />
          Active Courses
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-[#da7756] hover:bg-[#b75a40] text-black rounded-none transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isAdding && (
        <div className="p-4 bg-background rounded-none border border-border space-y-4">
          <input
            type="text"
            placeholder="Course Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-card border border-border rounded-none px-4 py-2 focus:outline-none focus:border-[#da7756] text-foreground font-serif"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted font-serif uppercase font-bold">Duration (Days)</label>
              <input
                type="number"
                value={duration === "" ? "" : duration}
                onChange={(e) => {
                  const v = e.target.value;
                  setDuration(v === "" ? "" : Number(v));
                }}
                className="w-full bg-card border border-border rounded-none px-4 py-2 text-foreground font-serif focus:outline-none focus:border-[#da7756] transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted font-serif uppercase font-bold">Daily Hours</label>
              <input
                type="number"
                value={hours === "" ? "" : hours}
                onChange={(e) => {
                  const v = e.target.value;
                  setHours(v === "" ? "" : Number(v));
                }}
                className="w-full bg-card border border-border rounded-none px-4 py-2 text-foreground font-serif focus:outline-none focus:border-[#da7756] transition-colors"
              />
            </div>
          </div>
          <button
            onClick={handleAddCourse}
            className="w-full py-2 bg-[#da7756] hover:bg-[#b75a40] text-black font-bold rounded-none transition-colors uppercase tracking-wider font-serif"
          >
            Create Immutable Course
          </button>
        </div>
      )}

      <div className="space-y-3">
        {courses.map((course) => (
          <div
            key={course._id || course.id}
            onClick={() => setDashboardCourse(course)}
            className="p-4 bg-background border border-border rounded-none group hover:border-[#da7756]/50 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-foreground font-serif group-hover:text-[#da7756] transition-colors">{course.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted font-serif">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(addDays(new Date(course.createdAt), course.durationDays), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.dailyStudyHours}h/day
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    (course._id || course.id) && setParsingCourseId(course._id || course.id!)
                  }}
                  className="p-2 text-muted hover:text-[#da7756] bg-card rounded-none transition-colors border border-border"
                  title="Parse Syllabus"
                >
                  <BrainCircuit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    (course._id || course.id) && setManagingCourse({ id: (course._id || course.id)!, name: course.name })
                  }}
                  className="p-2 text-muted hover:text-blue-500 bg-card rounded-none transition-colors border border-border"
                  title="Manage Topics"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    (course._id || course.id) && handleDelete((course._id || course.id)!)
                  }}
                  className="p-2 text-muted hover:text-red-500 bg-card rounded-none transition-colors border border-border"
                  title="Delete Course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4 h-1.5 bg-card rounded-none overflow-hidden border border-border">
              <div
                className="h-full bg-[#da7756]"
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
