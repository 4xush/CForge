/**
 * Utility to trigger notification updates across the app
 */

// Function to trigger notification updates
export const triggerNotificationUpdate = () => {
  console.log('🔔 Triggering notification update across app');
  
  // Dispatch custom event
  window.dispatchEvent(new Event('notification_update'));
  
  // Also update localStorage to trigger storage event
  localStorage.setItem('notification_update', Date.now().toString());
  
  // Remove the localStorage item after a short delay
  setTimeout(() => {
    localStorage.removeItem('notification_update');
  }, 100);
};

// Function to be called when push notifications arrive
export const onPushNotificationReceived = (notificationData) => {
  console.log('🔔 Push notification received:', notificationData);
  
  // Trigger notification update
  triggerNotificationUpdate();
  
  // You can add more logic here like showing toast, etc.
};

export default {
  triggerNotificationUpdate,
  onPushNotificationReceived
};
