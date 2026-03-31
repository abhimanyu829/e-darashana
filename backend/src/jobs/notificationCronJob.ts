import cron from 'node-cron';
import { DailyTask } from '../models/DailyTask';
import { NotificationSubscription } from '../models/NotificationSubscription';
import { sendNotificationToUser } from '../services/notificationService';
import logger from '../config/logger';

/**
 * NOTIFICATION CRON JOB — New file, no existing job modified.
 *
 * 1. Every 12 hours → REMINDER notifications to all subscribed users
 * 2. Every hour     → MISSED TASK check (tasks past deadline still 'active')
 */

// ─────────────────────────────────────────────────────────────────────────────
// CRON 1: 12-Hour Study Reminder
// Fires at 08:00 and 20:00 every day
// ─────────────────────────────────────────────────────────────────────────────
const twelveHourReminderJob = cron.schedule('0 8,20 * * *', async () => {
  logger.info('[NotificationCron] Running 12-hour reminder job...');
  try {
    // Get all unique userIds that have a push subscription
    const subscriptions = await NotificationSubscription.distinct('userId');

    for (const userId of subscriptions) {
      // Only send reminder if user has active tasks today
      const todayStr = new Date().toISOString().split('T')[0];
      const dailyTask = await DailyTask.findOne({
        userId,
        date: todayStr,
        'tasks.status': 'active',
      });

      if (dailyTask) {
        const activeCount = dailyTask.tasks.filter((t: any) => t.status === 'active').length;
        await sendNotificationToUser(userId, {
          title: '⏰ Study Reminder',
          body: `You have ${activeCount} active task${activeCount !== 1 ? 's' : ''} pending today. Stay on track!`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'reminder',
          url: '/',
        });
      }
    }
  } catch (err: any) {
    logger.error('[NotificationCron] 12-hour reminder error:', err.message);
  }
});
twelveHourReminderJob.stop(); // will be started explicitly in startNotificationCronJobs()

// ─────────────────────────────────────────────────────────────────────────────
// CRON 2: Missed Task Detection (runs every hour)
// Finds tasks where deadline has passed but status is still 'active'
// Does NOT change task status — that is handled by the existing taskWorker
// ─────────────────────────────────────────────────────────────────────────────
const missedTaskCheckJob = cron.schedule('0 * * * *', async () => {
  logger.info('[NotificationCron] Running missed task check...');
  try {
    const now = new Date();

    // Find all daily task documents that have tasks past deadline still 'active'
    const overdueDocs = await DailyTask.find({
      'tasks.status': 'active',
      'tasks.deadline': { $lt: now },
    });

    // Group notifications per user (deduplicate)
    const userMissedMap: Record<string, number> = {};

    for (const doc of overdueDocs) {
      const overdueCount = doc.tasks.filter(
        (t: any) => t.status === 'active' && new Date(t.deadline) < now
      ).length;

      if (overdueCount > 0) {
        const userId = doc.userId;
        userMissedMap[userId] = (userMissedMap[userId] || 0) + overdueCount;
      }
    }

    for (const [userId, count] of Object.entries(userMissedMap)) {
      // Only notify if user has a subscription
      const hasSub = await NotificationSubscription.exists({ userId });
      if (!hasSub) continue;

      await sendNotificationToUser(userId, {
        title: '⚠️ Task Missed',
        body: `${count} task${count !== 1 ? 's' : ''} missed their deadline. Complete them now to stay on track!`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'missed-task',
        url: '/',
      });
    }
  } catch (err: any) {
    logger.error('[NotificationCron] Missed task check error:', err.message);
  }
});
missedTaskCheckJob.stop(); // will be started explicitly in startNotificationCronJobs()

/**
 * Call this once in server.ts to activate both cron jobs.
 */
export const startNotificationCronJobs = () => {
  twelveHourReminderJob.start();
  missedTaskCheckJob.start();
  logger.info('[NotificationCron] 12-hour reminder + missed task check jobs started.');
};
