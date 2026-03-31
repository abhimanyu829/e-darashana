export type SectionType = 'academic' | 'exam' | 'skill' | 'placement' | 'project' | 'othertasks';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Course {
  _id?: string;
  id?: string; // Compatibility
  userId: string;
  section: SectionType;
  name: string;
  durationDays: number;
  dailyStudyHours: number;
  syllabusText?: string;
  createdAt: string;
}

export interface Topic {
  _id?: string;
  id?: string; // Compatibility
  topicTitle: string;
  globalOrderIndex: number;
}

export interface Unit {
  _id?: string;
  unitName: string;
  topics: Topic[];
}

export interface TopicsMaster {
  _id?: string;
  courseId: string;
  userId: string;
  units: Unit[];
  createdAt: string;
}

export interface Task {
  _id?: string;
  id?: string; // Compatibility
  topicId: string;
  topicTitle: string;
  globalOrderIndex: number;
  assignedAt: string;
  deadline: string;
  status: 'active' | 'completed' | 'delayed';
  checkbox: boolean;
}

export interface DailyTask {
  _id?: string;
  userId: string;
  courseId: string;
  date: string;
  tasks: Task[];
}

export interface ActivityLog {
  _id?: string;
  userId: string;
  section: SectionType | string;
  date: string;
  completedTasks: number;
  totalTasks: number;
  delayedTasks: number;
  score: number;
}

