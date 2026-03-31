import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  topicId: { type: Number, required: true },
  topicTitle: { type: String, required: true },
  globalOrderIndex: { type: Number, required: true },
  assignedAt: { type: Date, required: true },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed', 'delayed'], required: true },
  checkbox: { type: Boolean, default: false },
});

const dailyTaskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  section: { type: String, enum: ['academic', 'exam', 'skill', 'placement', 'project', 'othertasks'], required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  tasks: [taskSchema],
});

dailyTaskSchema.index({ userId: 1, date: 1 });

export const DailyTask = mongoose.model('DailyTask', dailyTaskSchema);
