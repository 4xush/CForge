const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// VAPID keys - Generate these once and store in environment variables
// Run: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI6YrrfQAsxSR_-HitCOvfHLHXMQJWZDxaiAKDdkdBMrPushServiceBxleroy',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'UxI-mvHXXQOzjTmS5aUXFmSqRXBcSI0_J3C8Q1wJQHU'
};

// Configure web-push
webpush.setVapidDetails(
  'mailto:your-email@cforge.live',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

class PushNotificationService {
  /**
   * Subscribe user to push notifications
   */
  static async subscribe(userId, subscription, userAgent = '') {
    try {
      // Remove existing subscription for this endpoint
      await PushSubscription.deleteMany({ endpoint: subscription.endpoint });
      
      // Create new subscription
      const pushSub = new PushSubscription({
        user: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent,
        isActive: true
      });
      
      await pushSub.save();
      console.log(`✅ Push subscription created for user ${userId}`);
      return pushSub;
    } catch (error) {
      console.error('❌ Error creating push subscription:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  static async unsubscribe(userId, endpoint = null) {
    try {
      const query = { user: userId };
      if (endpoint) {
        query.endpoint = endpoint;
      }
      
      const result = await PushSubscription.deleteMany(query);
      console.log(`✅ Removed ${result.deletedCount} push subscriptions for user ${userId}`);
      return result;
    } catch (error) {
      console.error('❌ Error removing push subscription:', error);
      throw error;
    }
  }

  /**
   * Send push notification to a specific user
   */
  static async sendToUser(userId, payload) {
    try {
      const subscriptions = await PushSubscription.find({ 
        user: userId, 
        isActive: true 
      });
      
      if (subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${userId}`);
        return { sent: 0, failed: 0 };
      }

      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendNotification(sub, payload))
      );

      const sent = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`📱 Push notification sent to user ${userId}: ${sent} sent, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('❌ Error sending push notification to user:', error);
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   */
  static async sendToUsers(userIds, payload) {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.sendToUser(userId, payload))
      );

      const totalSent = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value.sent, 0);

      const totalFailed = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value.failed, 0);

      console.log(`📱 Bulk push notification: ${totalSent} sent, ${totalFailed} failed`);
      return { sent: totalSent, failed: totalFailed };
    } catch (error) {
      console.error('❌ Error sending bulk push notifications:', error);
      throw error;
    }
  }

  /**
   * Send reminder notification for a specific reminder
   */
  static async sendReminderNotification(userId, reminder) {
    const payload = {
      title: `Review Problem: ${reminder.problem.title}`,
      body: `Time to review this ${reminder.problem.difficulty} problem! (${reminder.interval} day interval)`,
      icon: '/favicon/web-app-manifest-192x192.png',
      badge: '/favicon/web-app-manifest-192x192.png',
      tag: `reminder-${reminder.id}`,
      data: {
        type: 'reminder',
        reminderId: reminder.id,
        problemId: reminder.problem.id,
        problemUrl: reminder.problem.url,
        url: '/leetcode-tracker'
      },
      actions: [
        {
          action: 'complete',
          title: 'Mark Complete',
          icon: '/favicon/web-app-manifest-192x192.png'
        },
        {
          action: 'snooze',
          title: 'Snooze 1 hour',
          icon: '/favicon/web-app-manifest-192x192.png'
        },
        {
          action: 'open',
          title: 'Open Problem',
          icon: '/favicon/web-app-manifest-192x192.png'
        }
      ],
      requireInteraction: true
    };

    return await this.sendToUser(userId, payload);
  }

  /**
   * Send individual push notification
   */
  static async sendNotification(subscription, payload) {
    try {
      const result = await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys
        },
        JSON.stringify(payload),
        {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: 'normal'
        }
      );
      
      return result;
    } catch (error) {
      console.error('❌ Push notification failed:', error);
      
      // Handle expired/invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`🗑️ Removing invalid subscription: ${subscription.endpoint}`);
        await PushSubscription.deleteOne({ _id: subscription._id });
      }
      
      throw error;
    }
  }

  /**
   * Get VAPID public key for frontend
   */
  static getVapidPublicKey() {
    return vapidKeys.publicKey;
  }

  /**
   * Test push notification
   */
  static async sendTestNotification(userId) {
    const payload = {
      title: 'CForge Test Notification',
      body: 'Push notifications are working! 🎉',
      icon: '/favicon/web-app-manifest-192x192.png',
      tag: 'test-notification',
      data: {
        type: 'test',
        url: '/leetcode-tracker'
      }
    };

    return await this.sendToUser(userId, payload);
  }
}

module.exports = PushNotificationService;