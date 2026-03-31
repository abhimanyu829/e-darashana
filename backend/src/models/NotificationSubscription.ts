import mongoose from 'mongoose';

/**
 * NEW COLLECTION: notification_subscriptions
 * Stores browser PushSubscription objects per user.
 * Does NOT touch any existing schema.
 */
const notificationSubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    subscription: {
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
      },
    },
  },
  { timestamps: true }
);

// Unique index: one subscription endpoint per user
notificationSubscriptionSchema.index({ userId: 1, 'subscription.endpoint': 1 }, { unique: true });

export const NotificationSubscription = mongoose.model(
  'NotificationSubscription',
  notificationSubscriptionSchema
);
