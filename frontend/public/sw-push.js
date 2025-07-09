// Service Worker for handling push notifications
// This file will be merged with VitePWA's service worker

self.addEventListener('push', function(event) {
  console.log('📱 Push notification received:', event);
  
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/favicon/web-app-manifest-192x192.png',
      badge: data.badge || '/favicon/web-app-manifest-192x192.png',
      tag: data.tag || 'cforge-notification',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: false,
      timestamp: Date.now()
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'CForge', options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('CForge', {
        body: 'You have a new notification',
        icon: '/favicon/web-app-manifest-192x192.png',
        tag: 'cforge-fallback'
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('📱 Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  if (action === 'complete') {
    // Handle complete action
    event.waitUntil(
      handleReminderAction('complete', data.reminderId)
    );
  } else if (action === 'snooze') {
    // Handle snooze action
    event.waitUntil(
      handleReminderAction('snooze', data.reminderId)
    );
  } else if (action === 'open' && data.problemUrl) {
    // Open problem in new tab
    event.waitUntil(
      clients.openWindow(data.problemUrl)
    );
  } else {
    // Default action - open app
    const urlToOpen = data.url || '/leetcode-tracker';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(function(clientList) {
          // Check if app is already open
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window if app is not open
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Handle reminder actions (complete/snooze)
async function handleReminderAction(action, reminderId) {
  if (!reminderId) {
    console.error('No reminder ID provided for action:', action);
    return;
  }

  try {
    // Get auth token from IndexedDB or localStorage
    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token found');
      return;
    }

    const endpoint = action === 'complete' 
      ? `/api/leetcode-tracker/reminders/${reminderId}/complete`
      : `/api/leetcode-tracker/reminders/${reminderId}/skip`;

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: action === 'snooze' ? JSON.stringify({ snoozeHours: 1 }) : undefined
    });

    if (response.ok) {
      console.log(`✅ Reminder ${action} successful`);
      
      // Show success notification
      self.registration.showNotification('CForge', {
        body: `Reminder ${action === 'complete' ? 'completed' : 'snoozed for 1 hour'}!`,
        icon: '/favicon/web-app-manifest-192x192.png',
        tag: 'cforge-action-success',
        requireInteraction: false
      });
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`Error handling ${action} action:`, error);
    
    // Show error notification
    self.registration.showNotification('CForge', {
      body: `Failed to ${action} reminder. Please open the app.`,
      icon: '/favicon/web-app-manifest-192x192.png',
      tag: 'cforge-action-error',
      requireInteraction: false
    });
  }
}

// Get auth token (you may need to adjust this based on your auth implementation)
async function getAuthToken() {
  // Try to get from cache first
  try {
    const cache = await caches.open('auth-cache');
    const response = await cache.match('/auth-token');
    if (response) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.log('No cached auth token found');
  }
  
  // Fallback: try to communicate with main thread
  try {
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      // Send message to main thread to get token
      clients[0].postMessage({ type: 'GET_AUTH_TOKEN' });
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  
  return null;
}