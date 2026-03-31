import { Request, Response } from 'express';
import { NotificationSubscription } from '../models/NotificationSubscription';
import logger from '../config/logger';

/**
 * POST /api/notifications/subscribe
 * Stores the browser's PushSubscription in MongoDB.
 */
export const subscribe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { subscription } = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }

    // Upsert: prevent duplicate endpoints for the same user
    await NotificationSubscription.findOneAndUpdate(
      { userId, 'subscription.endpoint': subscription.endpoint },
      { userId, subscription },
      { upsert: true, new: true }
    );

    logger.info(`Push subscription stored successfully for user: ${userId}`);
    return res.status(201).json({ message: 'Subscription stored successfully' });
  } catch (error: any) {
    logger.error('Error storing subscription:', error.message);
    return res.status(500).json({ message: 'Failed to store subscription', error: error.message });
  }
};

/**
 * DELETE /api/notifications/unsubscribe
 * Removes the browser's PushSubscription from MongoDB.
 */
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: 'Missing endpoint' });
    }

    await NotificationSubscription.deleteOne({ userId, 'subscription.endpoint': endpoint });

    logger.info(`Push subscription removed for user ${userId}`);
    return res.json({ message: 'Unsubscribed successfully' });
  } catch (error: any) {
    logger.error('Error removing subscription:', error.message);
    return res.status(500).json({ message: 'Failed to unsubscribe', error: error.message });
  }
};

/**
 * GET /api/notifications/vapid-public-key
 * Returns the VAPID public key to the frontend.
 */
export const getVapidPublicKey = async (_req: Request, res: Response) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(500).json({ message: 'VAPID public key not configured' });
  }
  return res.json({ publicKey: key });
};
