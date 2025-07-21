import { useState } from 'react';
import { MessageCircle, UserPlus, Clock, Check } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';

const NotificationItem = ({ notification, onNotificationRead }) => {
  const [isMarking, setIsMarking] = useState(false);
  const { markAsRead } = useNotifications();

  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    if (notification.isRead || isMarking) return;

    setIsMarking(true);
    await markAsRead(notification._id);
    setIsMarking(false);
  };

  const handleNotificationClick = () => {
    // TODO: Navigate to the relevant room/chat
    console.log('Navigate to room:', notification.roomId);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      handleMarkAsRead({ stopPropagation: () => {} });
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'chat_new_message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'room_user_joined':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return <MessageCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationMessage = () => {
    switch (notification.type) {
      case 'chat_new_message':
        return {
          title: `New message in ${notification.data?.roomName || "Unknown Room"}`,
          subtitle: notification.data.messagePreview,
          action: 'sent a message'
        };
      case 'room_user_joined':
        return {
          title: `${notification.data.username} joined ${notification.data?.roomName || "Unknown Room"}`,
          subtitle: 'Welcome the new member!',
          action: 'joined the room'
        };
      default:
        return {
          title: 'New notification',
          subtitle: '',
          action: ''
        };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const { title, subtitle, action } = getNotificationMessage();

  return (
    <div
      onClick={handleNotificationClick}
      className={`
        p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors
        ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        {/* Notification Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon()}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          {/* Header with user and action */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {notification.triggeredBy?.username || 'Unknown User'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {action}
            </span>
          </div>

          {/* Title */}
          <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
            {title}
          </p>

          {/* Subtitle/Preview */}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {subtitle}
            </p>
          )}

          {/* Footer with time and read status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(notification.createdAt)}</span>
            </div>

            {/* Read/Unread indicator and mark as read button */}
            <div className="flex items-center space-x-2">
              {!notification.isRead && (
                <>
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <button
                    onClick={handleMarkAsRead}
                    disabled={isMarking}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
                    title="Mark as read"
                  >
                    {isMarking ? (
                      <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </button>
                </>
              )}
              {notification.isRead && (
                <span className="text-xs text-gray-400 dark:text-gray-500">Read</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;