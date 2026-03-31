import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  section: { type: String, required: true }, // 'academic', 'exam', 'skill', 'placement', 'project', 'othertasks'
  date: { type: String, required: true }, // YYYY-MM-DD
  completedTasks: { type: Number, default: 0 },
  totalTasks: { type: Number, default: 0 },
  delayedTasks: { type: Number, default: 0 },
  score: { type: Number, default: 0 }
});

// A user has one activity log entry per section per day
activityLogSchema.index({ userId: 1, section: 1, date: 1 }, { unique: true });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
