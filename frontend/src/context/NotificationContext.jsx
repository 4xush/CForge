import { createContext, useContext, useEffect, useState } from "react";
import { useAuthContext } from "./AuthContext";
import { useWebSocket } from "./WebSocketContext";
import PropTypes from "prop-types";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [lastNotification, setLastNotification] = useState(null);
  const [notificationPermission, setNotificationPermission] =
    useState("default");

  const { authUser } = useAuthContext();
  const { addEventListener, removeEventListener, connected } = useWebSocket();

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    }
    return "denied";
  };

  // Show browser notification
  const showBrowserNotification = (title, options = {}) => {
    if (notificationPermission === "granted" && "Notification" in window) {
      const notification = new Notification(title, {
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    }
    return null;
  };

  // Handle new notifications from WebSocket
  useEffect(() => {
    if (!connected || !authUser) return;

    const handleNewNotification = (notificationData) => {
      setLastNotification(notificationData);
      setGlobalUnreadCount((prev) => prev + 1);

      // Show browser notification if page is not visible
      if (document.hidden || !document.hasFocus()) {
        const title =
          notificationData.type === "chat_new_message"
            ? `New message in ${notificationData.roomName}`
            : `${notificationData.data.username} joined ${notificationData.roomName}`;

        const options = {
          body:
            notificationData.type === "chat_new_message"
              ? notificationData.data.messagePreview
              : "Welcome the new member!",
          tag: `notification-${notificationData._id}`,
          data: {
            roomId: notificationData.roomId,
            type: notificationData.type,
          },
        };

        showBrowserNotification(title, options);
      }
    };

    const handleNotificationRead = () => {
      setGlobalUnreadCount((prev) => Math.max(0, prev - 1));
    };

    addEventListener("new_notification", handleNewNotification);
    addEventListener("notification_read", handleNotificationRead);

    return () => {
      removeEventListener("new_notification", handleNewNotification);
      removeEventListener("notification_read", handleNotificationRead);
    };
  }, [
    connected,
    authUser,
    addEventListener,
    removeEventListener,
    notificationPermission,
  ]);

  // Initialize notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Fetch initial unread count when user connects
  useEffect(() => {
    const fetchInitialUnreadCount = async () => {
      if (!authUser || !connected) return;

      try {
        const token = localStorage.getItem("app-token");
        const response = await fetch("/api/notifications/unread-count", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setGlobalUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error("Error fetching initial unread count:", error);
      }
    };

    fetchInitialUnreadCount();
  }, [authUser, connected]);

  const contextValue = {
    globalUnreadCount,
    lastNotification,
    notificationPermission,
    requestNotificationPermission,
    showBrowserNotification,
    setGlobalUnreadCount,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
};

export default NotificationContext;
