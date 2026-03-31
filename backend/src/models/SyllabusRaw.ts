import mongoose, { Document } from 'mongoose';

export interface ISyllabusRaw extends Document {
  userId: string;
  courseId: mongoose.Types.ObjectId;
  syllabusText: string;
  createdAt: Date;
}

const syllabusSchema = new mongoose.Schema<ISyllabusRaw>({
  userId: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Course' },
  syllabusText: { type: String, default: '' },
}, { timestamps: true });

export const SyllabusRaw = mongoose.model<ISyllabusRaw>('SyllabusRaw', syllabusSchema);