// Browser notification utilities for reminder system

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} - True if permission granted
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Show a browser notification for a reminder
 * @param {Object} reminder - Reminder object with problem details
 * @param {Function} onClick - Optional callback when notification is clicked
 */
export const showReminderNotification = async (reminder, onClick) => {
  if (Notification.permission !== 'granted') {
    return;
  }

  const { problem } = reminder;
  const title = `Review Problem: ${problem.title}`;
  const body = `Time to review this ${problem.difficulty} problem! (${reminder.interval} day interval)`;

  // Options for the notification
  const options = {
    body,
    icon: '/favicon.ico',
    tag: `reminder-${reminder.id}`,
    requireInteraction: true,
    badge: '/favicon.ico',
    data: {
      reminderId: reminder.id,
      problemId: problem.id,
      url: problem.url,
      onClick: onClick ? true : false
    },
    actions: [
      {
        action: 'view',
        title: 'View Problem'
      }
    ]
  };

  // Use service worker if available, fallback to standard notification
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Get the service worker registration to show notification
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return true;
    } else {
      console.warn('Service worker not available, notifications may not work in PWA mode');
      // Fallback for non-PWA environments (this will fail in PWAs)
      try {
        const notification = new Notification(title, options);

        // Handle notification click
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();

          if (onClick) {
            onClick(reminder);
          } else {
            // Default behavior: open problem URL
            window.open(problem.url, '_blank');
          }

          notification.close();
        };

        // Auto-close after 10 seconds if not interacted with
        setTimeout(() => {
          notification.close();
        }, 10000);

        return notification;
      } catch (error) {
        console.error('Failed to show notification:', error);
        return null;
      }
    }
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

/**
 * Schedule a local notification for a future reminder
 * @param {Object} reminder - Reminder object
 * @param {Function} onClick - Optional callback when notification is clicked
 */
export const scheduleLocalNotification = (reminder, onClick) => {
  const now = new Date();
  const reminderDate = new Date(reminder.reminderDate);
  const timeUntilReminder = reminderDate.getTime() - now.getTime();

  if (timeUntilReminder <= 0) {
    // Reminder is due now or overdue
    showReminderNotification(reminder, onClick);
    return;
  }

  // Schedule notification for future
  const timeoutId = setTimeout(() => {
    showReminderNotification(reminder, onClick);
  }, timeUntilReminder);

  // Store timeout ID for potential cancellation
  return timeoutId;
};

/**
 * Check if there are any due reminders and show notifications
 * @param {Array} reminders - Array of reminder objects
 * @param {Function} onClick - Optional callback when notification is clicked
 */
export const checkDueReminders = (reminders, onClick) => {
  if (!reminders || reminders.length === 0) {
    return;
  }

  const now = new Date();
  const dueReminders = reminders.filter(reminder => {
    const reminderDate = new Date(reminder.reminderDate);
    return reminderDate <= now && reminder.status === 'pending';
  });

  dueReminders.forEach(reminder => {
    showReminderNotification(reminder, onClick);
  });

  return dueReminders.length;
};

/**
 * Store notification preferences in localStorage
 * @param {Object} preferences - Notification preferences
 */
export const setNotificationPreferences = (preferences) => {
  try {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
};

/**
 * Get notification preferences from localStorage
 * @returns {Object} - Notification preferences
 */
export const getNotificationPreferences = () => {
  try {
    const stored = localStorage.getItem('notificationPreferences');
    return stored ? JSON.parse(stored) : {
      enabled: true,
      showOnDue: true,
      showOnOverdue: true,
      autoClose: true
    };
  } catch (error) {
    console.error('Error loading notification preferences:', error);
    return {
      enabled: true,
      showOnDue: true,
      showOnOverdue: true,
      autoClose: true
    };
  }
};

/**
 * Clear all scheduled notifications
 * @param {Array} timeoutIds - Array of timeout IDs to clear
 */
export const clearScheduledNotifications = (timeoutIds) => {
  if (timeoutIds && timeoutIds.length > 0) {
    timeoutIds.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
  }
};

/**
 * Format reminder date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
export const formatReminderDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    return `In ${diffDays} days`;
  }
};

/**
 * Check if service worker is available for notifications
 * @returns {Promise<boolean>} - True if service worker is available
 */
export const isServiceWorkerAvailable = async () => {
  return 'serviceWorker' in navigator &&
    navigator.serviceWorker.controller !== null &&
    (await navigator.serviceWorker.ready) !== undefined;
};

/**
 * Get notification status and permission info
 * @returns {Object} - Notification status information
 */
export const getNotificationStatus = () => {
  const supported = 'Notification' in window;
  const permission = supported ? Notification.permission : 'unsupported';
  const preferences = getNotificationPreferences();
  const serviceWorkerAvailable = 'serviceWorker' in navigator;

  return {
    supported,
    permission,
    serviceWorkerAvailable,
    enabled: supported && permission === 'granted' && preferences.enabled,
    preferences
  };
};