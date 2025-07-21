import { useState } from "react";
import {
  CheckCheck,
  MessageCircle,
  UserPlus,
  Settings,
  X,
  Bell,
} from "lucide-react";
import useNotifications from "../../hooks/useNotifications";
import NotificationItem from "./NotificationItem";
import { Spinner } from "../ui/Spinner";

const NotificationDropdown = ({ onClose, onNotificationRead }) => {
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'chat', 'room'
  const { notifications, unreadCount, loading, markAllAsRead, refetch } =
    useNotifications();

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter((notification) => {
    switch (filter) {
      case "unread":
        return !notification.isRead;
      case "chat":
        return notification.type === "chat_new_message";
      case "room":
        return notification.type === "room_user_joined";
      default:
        return true;
    }
  });

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      // Refresh notifications to update UI
      refetch();
    }
  };

  const getFilterIcon = (filterType) => {
    switch (filterType) {
      case "chat":
        return <MessageCircle className="w-4 h-4" />;
      case "room":
        return <UserPlus className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-h-96 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-3">
          {[
            { key: "all", label: "All", count: notifications.length },
            { key: "unread", label: "Unread", count: unreadCount },
            {
              key: "chat",
              label: "Chat",
              count: notifications.filter((n) => n.type === "chat_new_message")
                .length,
            },
            {
              key: "room",
              label: "Room",
              count: notifications.filter((n) => n.type === "room_user_joined")
                .length,
            },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`
                flex items-center space-x-1 px-1.5 py-1 rounded-full text-sm font-medium transition-colors
                ${
                  filter === key
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }
              `}
            >
              {getFilterIcon(key)}
              <span>{label}</span>
              {count > 0 && (
                <span
                  className={`
                  ml-1 px-1.5 py-0.5 rounded-full text-xs
                  ${
                    filter === key
                      ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                  }
                `}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={handleMarkAllAsRead}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading...
            </span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            <Bell className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </p>
            {filter === "all" && (
              <p className="text-xs mt-1 text-center px-4">
                You'll see notifications here when you receive messages or when
                users join your rooms
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={() => {
              // TODO: Navigate to full notifications page
              console.log("Navigate to full notifications page");
            }}
            className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
