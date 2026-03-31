import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DailyTask } from '../models/DailyTask';
import { generateDailyTasks } from '../services/taskService';
import { TopicsMaster } from '../models/TopicsMaster';
import { updateActivityScore } from '../services/ActivityTrackerService';
import { z } from 'zod';
// ── Notification hook (non-destructive) ──────────────────────────────────────
import { sendNotificationToUser } from '../services/notificationService';

const updateTaskStatusSchema = z.object({
  date: z.string(),
  taskId: z.string(),
  checkbox: z.boolean(),
});

/**
 * STEP 10: CHECKBOX ENGINE
 */
export const updateTaskStatus = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validated = updateTaskStatusSchema.parse(req.body);
    const { date, taskId, checkbox } = validated;
    const userId = (req as any).userId;

    const dailyTask = await DailyTask.findOne({ 
      userId, 
      date,
      'tasks._id': taskId
    }).session(session);

    if (!dailyTask) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Daily task not found for the given task ID' });
    }

    const task = (dailyTask.tasks as any).id(taskId);

    if (!task) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Task not found' });
    }

    const now = new Date();
    const assignedAt = new Date(task.assignedAt);
    const timeDiff = now.getTime() - assignedAt.getTime();
    const isWithin24h = timeDiff <= 24 * 60 * 60 * 1000;

    if (checkbox === true) {
      if (isWithin24h) {
        task.status = 'completed';
        task.checkbox = true;
      } else {
        // After 24h, we still allow completion, but the worker might have already marked it delayed
        task.status = 'completed';
        task.checkbox = true;
      }
    } else {
      task.status = 'active';
      task.checkbox = false;
    }

    await dailyTask.save({ session });
    await updateActivityScore(userId, date, dailyTask.section, session);
    await session.commitTransaction();

    // ── NOTIFICATION HOOK: fire-and-forget, never blocks task logic ──────────
    if (checkbox === true) {
      sendNotificationToUser(userId, {
        title: '✅ Task Completed!',
        body: `"${task.topicTitle}" marked as complete. Great work!`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'task-complete',
        url: '/'
      }).catch(() => {}); // silently ignore any push errors
    }
    // ────────────────────────────────────────────────────────────────────────

    res.json(dailyTask);
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });

    }
    res.status(500).json({ message: 'Error updating task status', error });
  } finally {
    session.endSession();
  }
};

/**
 * STEP 9: FRONTEND RULE (Fetch ONLY today's tasks)
 */
export const getTodayTasks = async (req: Request, res: Response) => {
  try {
    const { courseId, section } = req.query;
    const userId = (req as any).userId;
    const todayStr = new Date().toISOString().split('T')[0];

    // Case A: Fetch by Section (Dashboard View)
    if (section) {
      const { Course } = require('../models/Course');
      // Find all courses for this section
      const courses = await Course.find({ userId, section: String(section) });
      const courseIds = courses.map((c: any) => c._id.toString());

      // Ensure tasks are generated for all courses in this section
      for (const cId of courseIds) {
        const dailyTask = await DailyTask.findOne({ userId, courseId: cId, date: todayStr });
        if (!dailyTask) {
          const hasTopics = await TopicsMaster.exists({ courseId: cId, userId });
          if (hasTopics) {
            await generateDailyTasks(userId, cId);
          }
        }
      }

      // Fetch all tasks for this section today
      const dailyTasks = await DailyTask.find({ userId, section: String(section), date: todayStr });
      const allTasks = dailyTasks.flatMap(dt => dt.tasks);
      return res.json(allTasks);
    }

    // Case B: Fetch by Course (Legacy/Specific view)
    if (courseId) {
      const courseIdStr = String(courseId);
      const hasTopics = await TopicsMaster.exists({ courseId: courseIdStr, userId });
      if (!hasTopics) {
        return res.json([]);
      }

      let dailyTask = await DailyTask.findOne({ userId, courseId: courseIdStr, date: todayStr });

      if (!dailyTask) {
        await generateDailyTasks(userId, courseIdStr);
        dailyTask = await DailyTask.findOne({ userId, courseId: courseIdStr, date: todayStr });
      }

      return res.json(dailyTask?.tasks || []);
    }

    res.status(400).json({ message: 'courseId or section is required' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today tasks', error });
  }
};
