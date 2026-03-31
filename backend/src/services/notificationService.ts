import webpush from 'web-push';
import { NotificationSubscription } from '../models/NotificationSubscription';
import logger from '../config/logger';

/**
 * NOTIFICATION SERVICE — Standalone, no existing service modified.
 * Configures web-push and exposes helpers for sending notifications.
 */

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_MAILTO = process.env.VAPID_MAILTO || 'mailto:admin@actiontracker.app';

webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

/**
 * Sends a push notification to a single PushSubscription object.
 */
export const sendPushNotification = async (
  subscriptionObj: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: NotificationPayload
): Promise<void> => {
  try {
    await webpush.sendNotification(
      subscriptionObj as webpush.PushSubscription,
      JSON.stringify(payload)
    );
  } catch (err: any) {
    // 410 = subscription expired/unsubscribed — clean it up
    if (err.statusCode === 410 || err.statusCode === 404) {
      await NotificationSubscription.deleteOne({ 'subscription.endpoint': subscriptionObj.endpoint });
      logger.warn(`Removed expired subscription: ${subscriptionObj.endpoint}`);
    } else {
      logger.error('webpush.sendNotification error:', err.message);
    }
  }
};

/**
 * Sends a push notification to ALL subscriptions for a given userId.
 */
export const sendNotificationToUser = async (
  userId: string,
  payload: NotificationPayload
): Promise<void> => {
  try {
    const docs = await NotificationSubscription.find({ userId });
    if (!docs.length) return;

    await Promise.all(docs.map(doc => sendPushNotification(doc.subscription as any, payload)));
    logger.info(`Push sent to ${docs.length} subscription(s) for user ${userId}: "${payload.title}"`);
  } catch (err: any) {
    logger.error(`sendNotificationToUser failed for user ${userId}:`, err.message);
  }
};
