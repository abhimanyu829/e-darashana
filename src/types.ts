export type SectionType = 'academic' | 'project' | 'placement' | 'skills' | 'business' | 'other';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Course {
  id?: string;
  userId: string;
  section: SectionType;
  name: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  dailyStudyHours: number;
  isImmutable: boolean;
  status: 'active' | 'completed' | 'archived';
}

export interface Subject {
  id?: string;
  courseId: string;
  name: string;
  priorityIndex: number;
  color: string;
}

export interface Topic {
  id?: string;
  subjectId: string;
  courseId: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'delayed';
  assignedDate?: string;
  deadline?: string;
  estimatedTime: number;
  isLocked: boolean;
  delayCount: number;
  isCarryForward: boolean;
}

export interface Task {
  id?: string;
  userId: string;
  section: SectionType;
  topicId?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in-progress' | 'completed' | 'deferred';
  canDoToday: boolean;
  isDeferred: boolean;
  nextAssignedDate?: string;
  productivityImpactScore: number;
}

export interface DailyPlan {
  id?: string;
  userId: string;
  date: string;
  activeSubjects: string[];
  totalHours: number;
}
