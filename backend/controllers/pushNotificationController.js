const PushNotificationService = require('../services/pushNotificationService');

/**
 * Subscribe to push notifications
 */
const subscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;
    const userAgent = req.get('User-Agent') || '';

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ 
        message: 'Invalid subscription data' 
      });
    }

    const pushSub = await PushNotificationService.subscribe(userId, subscription, userAgent);
    
    res.json({
      message: 'Successfully subscribed to push notifications',
      subscription: {
        id: pushSub._id,
        endpoint: pushSub.endpoint,
        isActive: pushSub.isActive
      }
    });

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({ 
      message: 'Failed to subscribe to push notifications',
      error: error.message 
    });
  }
};

/**
 * Unsubscribe from push notifications
 */
const unsubscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    const result = await PushNotificationService.unsubscribe(userId, endpoint);
    
    res.json({
      message: 'Successfully unsubscribed from push notifications',
      removedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({ 
      message: 'Failed to unsubscribe from push notifications',
      error: error.message 
    });
  }
};

/**
 * Get VAPID public key
 */
const getVapidPublicKey = (req, res) => {
  try {
    console.log('Fetching VAPID public key');
    const publicKey = PushNotificationService.getVapidPublicKey();
    res.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({ 
      message: 'Failed to get VAPID public key',
      error: error.message 
    });
  }
};

/**
 * Send test notification
 */
const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await PushNotificationService.sendTestNotification(userId);
    
    if (result.sent === 0) {
      return res.status(404).json({
        message: 'No active push subscriptions found. Please enable push notifications first.'
      });
    }

    res.json({
      message: 'Test notification sent successfully',
      result
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ 
      message: 'Failed to send test notification',
      error: error.message 
    });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  getVapidPublicKey,
  sendTestNotification
};