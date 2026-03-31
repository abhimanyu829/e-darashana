import mongoose, { Document } from 'mongoose';

export interface ICourse extends Document {
  name: string;
  durationDays: number;
  dailyStudyHours: number;
  section: 'academic' | 'exam' | 'skill' | 'placement' | 'project' | 'othertasks';
  userId: string;
  createdAt: Date;
}

const CourseSchema = new mongoose.Schema<ICourse>({
  name: { type: String, required: true },
  durationDays: { type: Number, required: true },
  dailyStudyHours: { type: Number, required: true },
  section: { type: String, enum: ['academic', 'exam', 'skill', 'placement', 'project', 'othertasks'], required: true },
  userId: { type: String, required: true },
}, { timestamps: true });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);