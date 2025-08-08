// Browser notification utilities for reminder system

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} - True if permission granted
 */
export const requestNotificationPermission = async () => {
  try {
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
export const showReminderNotification = (reminder, onClick) => {
  try {
    if (!reminder || !reminder.problem) {
      console.warn('Invalid reminder object provided to showReminderNotification');
      return null;
    }

    if (Notification.permission !== 'granted') {
      return null;
    }

    const { problem } = reminder;
    const title = `Review Problem: ${problem.title}`;
    const body = `Time to review this ${problem.difficulty} problem! (${reminder.interval} day interval)`;
    const options = {
      body,
      icon: '/favicon.ico',
      tag: `reminder-${reminder.id}`,
      requireInteraction: true,
      badge: '/favicon.ico',
      data: {
        reminderId: reminder.id,
        problemId: problem.id,
        url: problem.url
      }
    };

    // Try to use service worker first if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, options);
        });
        return true;
      } catch (swError) {
        console.error('Service worker notification error:', swError);
        // Fall back to regular notification
      }
    }

    // Use regular Notification API with try/catch
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
      const preferences = getNotificationPreferences();
      if (preferences.autoClose) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      return notification;
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      return null;
    }
  } catch (error) {
    console.error('Error in showReminderNotification:', error);
    return null;
  }
};

/**
 * Schedule a local notification for a future reminder
 * @param {Object} reminder - Reminder object
 * @param {Function} onClick - Optional callback when notification is clicked
 */
export const scheduleLocalNotification = (reminder, onClick) => {
  try {
    if (!reminder || !reminder.reminderDate) {
      console.warn('Invalid reminder object provided to scheduleLocalNotification');
      return null;
    }

    const now = new Date();
    const reminderDate = new Date(reminder.reminderDate);
    const timeUntilReminder = reminderDate.getTime() - now.getTime();

    if (timeUntilReminder <= 0) {
      // Reminder is due now or overdue
      showReminderNotification(reminder, onClick);
      return null;
    }

    // Schedule notification for future
    const timeoutId = setTimeout(() => {
      showReminderNotification(reminder, onClick);
    }, timeUntilReminder);

    // Store timeout ID for potential cancellation
    return timeoutId;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    return null;
  }
};

/**
 * Check if there are any due reminders and show notifications
 * @param {Array} reminders - Array of reminder objects
 * @param {Function} onClick - Optional callback when notification is clicked
 */
export const checkDueReminders = (reminders, onClick) => {
  try {
    if (!reminders || reminders.length === 0) {
      return 0;
    }

    const now = new Date();
    const dueReminders = reminders.filter(reminder => {
      try {
        const reminderDate = new Date(reminder.reminderDate);
        return reminderDate <= now && reminder.status === 'pending';
      } catch (err) {
        console.error('Error processing reminder:', err);
        return false;
      }
    });

    let shownCount = 0;
    dueReminders.forEach(reminder => {
      try {
        const result = showReminderNotification(reminder, onClick);
        if (result) shownCount++;
      } catch (err) {
        console.error('Error showing reminder notification:', err);
      }
    });

    return shownCount;
  } catch (error) {
    console.error('Error in checkDueReminders:', error);
    return 0;
  }
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
  try {
    if (timeoutIds && timeoutIds.length > 0) {
      timeoutIds.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    }
  } catch (error) {
    console.error('Error clearing scheduled notifications:', error);
  }
};

/**
 * Format reminder date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
export const formatReminderDate = (dateString) => {
  try {
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
  } catch (error) {
    console.error('Error formatting reminder date:', error);
    return 'Unknown date';
  }
};

/**
 * Get notification status and permission info
 * @returns {Object} - Notification status information
 */
export const getNotificationStatus = () => {
  try {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'unsupported';
    const preferences = getNotificationPreferences();

    return {
      supported,
      permission,
      enabled: supported && permission === 'granted' && preferences.enabled,
      preferences
    };
  } catch (error) {
    console.error('Error getting notification status:', error);
    return {
      supported: false,
      permission: 'unsupported',
      enabled: false,
      preferences: getNotificationPreferences()
    };
  }
};