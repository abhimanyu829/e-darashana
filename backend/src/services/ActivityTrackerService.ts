import mongoose from 'mongoose';
import { DailyTask } from '../models/DailyTask';
import { ActivityLog } from '../models/ActivityLog';
import { getIO } from '../socket';
import logger from '../config/logger';

/**
 * Recalculates and upserts the activity log score for a user's section over a specific date.
 * Based on the equation: 
 * dailyScore = completedTasks / totalTasks
 * penalty = delayedTasks / totalTasks
 * finalScore = max(0, dailyScore - penalty)
 */
export const updateActivityScore = async (
  userId: string,
  date: string,
  section: string,
  session?: mongoose.ClientSession
) => {
  try {
    // 1. Fetch all DailyTasks for this particular day and section
    const dailyTasksList = await DailyTask.find({ userId, date, section }).session(session || null).lean();
    
    let totalTasks = 0;
    let completedTasks = 0;
    let delayedTasks = 0;

    dailyTasksList.forEach(dt => {
      dt.tasks.forEach((t: any) => {
        totalTasks++;
        if (t.status === 'completed') completedTasks++;
        if (t.status === 'delayed') delayedTasks++;
      });
    });

    // 2. Compute Scores
    const dailyScore = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
    const penalty = totalTasks > 0 ? (delayedTasks / totalTasks) : 0;
    const finalScore = Math.max(0, dailyScore - penalty);

    // 3. Upsert into ActivityLog
    const updatedLog = await ActivityLog.findOneAndUpdate(
      { userId, date, section },
      {
        $set: {
          completedTasks,
          totalTasks,
          delayedTasks,
          score: finalScore
        }
      },
      { upsert: true, new: true, session: session || null }
    );

    // 4. Real-time updates via Socket.IO
    try {
      const io = getIO();
      if (io) {
        io.to(userId).emit('activity_update', updatedLog);
      }
    } catch (wsError) {
      // getIO might throw if socket is not fully initialized in testing
      logger.warn(`Could not emit activity_update via socket: ${wsError}`);
    }

    return updatedLog;

  } catch (error) {
    logger.error(`Error updating Activity Log for User ${userId} on ${date}:`, error);
    // Suppress error since this is a side-effect tracker unless necessary
  }
};
