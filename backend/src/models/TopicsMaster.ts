import mongoose, { Document } from 'mongoose';

export interface ITopic {
  topicTitle: string;
  globalOrderIndex: number;
}

export interface IUnit {
  unitName: string;
  topics: ITopic[];
}

export interface IPreScheduleDay {
  dayNumber: number;
  topics: number[];
}

export interface ITopicsMaster extends Document {
  userId: string;
  courseId: mongoose.Types.ObjectId;
  section: 'academic' | 'exam' | 'skill' | 'placement' | 'project' | 'othertasks';
  units: IUnit[];
  preSchedule: IPreScheduleDay[];
}

const topicSchema = new mongoose.Schema<ITopic>(
  {
    topicTitle: { type: String, required: true },
    globalOrderIndex: { type: Number, required: true },
  },
  { _id: false }
);

const unitSchema = new mongoose.Schema<IUnit>(
  {
    unitName: { type: String, required: true },
    topics: [topicSchema],
  },
  { _id: false }
);

const topicsMasterSchema = new mongoose.Schema<ITopicsMaster>(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Course' },
    userId: { type: String, required: true },
    section: { type: String, enum: ['academic', 'exam', 'skill', 'placement', 'project', 'othertasks'], required: true },
    units: [unitSchema],
    preSchedule: [{
      dayNumber: { type: Number, required: true },
      topics: [{ type: Number }]
    }],
  },
  { timestamps: true }
);

topicsMasterSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const TopicsMaster = mongoose.model<ITopicsMaster>('TopicsMaster', topicsMasterSchema);