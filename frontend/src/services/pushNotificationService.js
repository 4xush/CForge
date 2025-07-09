import ApiService from './ApiService';

class PushNotificationService {
  static vapidPublicKey = null;
  static subscription = null;

  /**
   * Check if push notifications are supported
   */
  static isSupported() {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    return supported;
  }

  /**
   * Get VAPID public key from server
   */
  static async getVapidPublicKey() {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey;
    }

    try {
      const response = await ApiService.get('/push-notifications/vapid-public-key');
      this.vapidPublicKey = response.data.publicKey;
      return this.vapidPublicKey;
    } catch (error) {
      console.error('❌ Error getting VAPID public key:', error);
      throw error;
    }
  }

  /**
   * Request notification permission and subscribe
   */
  static async subscribe() {
    
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      
      // Check if push manager is available
      if (!registration.pushManager) {
        console.error('❌ Push manager not available');
        throw new Error('Push manager unavailable');
      }
      
      // Get VAPID public key
      const vapidPublicKey = await this.getVapidPublicKey();
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      const response = await ApiService.post('/push-notifications/subscribe', {
        subscription: subscription.toJSON()
      });

      this.subscription = subscription;
      
      // Store subscription in localStorage for quick access
      localStorage.setItem('pushSubscription', JSON.stringify(subscription.toJSON()));
      
      return response.data;
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe() {
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        await ApiService.post('/push-notifications/unsubscribe', {
          endpoint: subscription.endpoint
        });
        
      } else {
        console.log('ℹ️ No active subscription found');
      }
      
      // Clear local storage
      localStorage.removeItem('pushSubscription');
      this.subscription = null;
      
    } catch (error) {
      console.error('❌ Error unsubscribing from push notifications:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently subscribed
   */
  static async isSubscribed() {
    
    if (!this.isSupported()) {
      return false;
    }

    try {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      
      // Check if push manager is available
      if (!registration.pushManager) {
        return false;
      }
      
      const subscription = await registration.pushManager.getSubscription();
      const isSubscribed = !!subscription;
      
      return isSubscribed;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  static async getSubscription() {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.pushManager) {
        return null;
      }
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Send test notification
   */
  static async sendTestNotification() {
    try {
      const response = await ApiService.post('/push-notifications/test');
      return response.data;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Get push notification status with detailed debugging
   */
  static async getStatus() {
    
    const supported = this.isSupported();
    const permission = supported ? Notification.permission : 'unsupported';
    
    
    let subscribed = false;
    let error = null;
    
    try {
      subscribed = await this.isSubscribed();
    } catch (err) {
      error = err.message;
      console.error('❌ Error checking subscription:', err);
    }
    
    const status = {
      supported,
      permission,
      subscribed,
      enabled: supported && permission === 'granted' && subscribed,
      error
    };
    
    return status;
  }
}

export default PushNotificationService;
