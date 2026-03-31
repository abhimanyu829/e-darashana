import { Queue, Worker } from 'bullmq';
import { generateDailyTasks } from '../services/taskService';
import { DailyTask } from '../models/DailyTask';
import { SyllabusRaw } from '../models/SyllabusRaw';
import { updateActivityScore } from '../services/ActivityTrackerService';
import mongoose from 'mongoose';

const redisConnection = { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT) || 6379 };

const taskQueue = new Queue('task-generation', { connection: redisConnection });

/**
 * STEP 13: MIDNIGHT WORKER (MANDATORY)
 * Handles expiration and generation of next day's tasks.
 */
const worker = new Worker('task-generation', async job => {
  const { userId, courseId } = job.data;
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Move expired tasks -> delayed
    // Any 'active' tasks from previous days should be marked 'delayed'
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Find all daily tasks that are NOT for today and have 'active' tasks
    const expiredDays = await DailyTask.find({ 
        userId, 
        courseId, 
        date: { $lt: todayStr },
        'tasks.status': 'active'
    }).session(session);

    for (const day of expiredDays) {
        day.tasks.forEach(task => {
            if (task.status === 'active' && !task.checkbox) {
                task.status = 'delayed';
            }
        });
        await day.save({ session });
        await updateActivityScore(userId, day.date, day.section, session);
    }

    // 2. Recalculate W & Generate next day tasks (delegated to taskService)
    await generateDailyTasks(userId, courseId);

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error(`Error in worker for job ${job.id}:`, error);
    throw error; // Let BullMQ retry
  } finally {
    session.endSession();
  }
}, { connection: redisConnection });

/**
 * Schedules a daily repeat for a specific user and course.
 */
export const scheduleDailyTaskGeneration = async (userId: string, courseId: string) => {
  // Use a unique job ID to avoid duplicate repeaters
  const jobId = `${userId}-${courseId}-daily`;
  
  await taskQueue.add('generate-daily-tasks', { userId, courseId }, {
    jobId,
    repeat: { 
        pattern: '0 0 * * *',
        startDate: new Date()
    },
    removeOnComplete: true,
    removeOnFail: false
  });
};

export default worker;
