import { useState, useRef, useEffect } from "react";
import { Bell, BellRing } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import ApiService from "../../services/ApiService";
import NotificationDropdown from "./NotificationDropdown";

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const { authUser } = useAuthContext();

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Animate bell when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotifications(true);
      const timer = setTimeout(() => setHasNewNotifications(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Fetch unread count using ApiService.get
  const fetchUnreadCount = async () => {
    if (!authUser) return;

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.get("/notifications/unread-count");
      setUnreadCount(response.data.data.unreadCount);
      console.log(
        "✅ NotificationBell: Unread count fetched via ApiService.get:",
        response.data.data.unreadCount
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch notifications"
      );
      console.error("❌ NotificationBell: Error fetching unread count:", err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time WebSocket notifications
  useEffect(() => {
    // Simple WebSocket listener without context dependency
    const handleStorageChange = (e) => {
      if (e.key === "notification_update") {
        console.log("🔔 Storage notification update detected");
        fetchUnreadCount();
    
    // Listen for WebSocket events via global window object
    const handleWebSocketMessage = (event) => {
      if (event.detail && event.detail.type === "new_notification") {
        console.log("🔔 New notification via WebSocket event");
        fetchUnreadCount();
      }
    };
    
    window.addEventListener("websocket_notification", handleWebSocketMessage);
    
    // Set up polling for real-time updates (fallback)
    const pollInterval = setInterval(() => {
      if (authUser && document.visibilityState === "visible") {
        fetchUnreadCount();
    
    // Listen for WebSocket events via global window object
    const handleWebSocketMessage = (event) => {
      if (event.detail && event.detail.type === "new_notification") {
        console.log("🔔 New notification via WebSocket event");
        fetchUnreadCount();
      }
    };
    
    window.addEventListener("websocket_notification", handleWebSocketMessage);
      }
    }, 30000); // Poll every 30 seconds when page is visible

    return () => clearInterval(pollInterval);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for custom events
    const handleNotificationUpdate = () => {
      console.log("🔔 Custom notification update event");
      fetchUnreadCount();
    
    // Listen for WebSocket events via global window object
    const handleWebSocketMessage = (event) => {
      if (event.detail && event.detail.type === "new_notification") {
        console.log("🔔 New notification via WebSocket event");
        fetchUnreadCount();
      }
    };
    
    window.addEventListener("websocket_notification", handleWebSocketMessage);
    
    // Set up polling for real-time updates (fallback)
    const pollInterval = setInterval(() => {
      if (authUser && document.visibilityState === "visible") {
        fetchUnreadCount();
    
    // Listen for WebSocket events via global window object
    const handleWebSocketMessage = (event) => {
      if (event.detail && event.detail.type === "new_notification") {
        console.log("🔔 New notification via WebSocket event");
        fetchUnreadCount();
      }
    };
    
    window.addEventListener("websocket_notification", handleWebSocketMessage);
      }
    }, 30000); // Poll every 30 seconds when page is visible

    return () => clearInterval(pollInterval);
    };

    window.addEventListener("notification_update", handleNotificationUpdate);
    
    // Listen for WebSocket notification count updates
    const handleWebSocketUpdate = () => {
      console.log("🔔 WebSocket notification count update");
      fetchUnreadCount();
    
    // Listen for WebSocket events via global window object
    const handleWebSocketMessage = (event) => {
      if (event.detail && event.detail.type === "new_notification") {
        console.log("🔔 New notification via WebSocket event");
        fetchUnreadCount();
      }
    };
    
    window.addEventListener("websocket_notification", handleWebSocketMessage);
    };
    
    // Try to access WebSocket if available
    try {
      if (window.webSocketService && window.webSocketService.on) {
        window.webSocketService.on("notification_count_update", handleWebSocketUpdate);
      }
    } catch (e) {
      console.log("WebSocket service not available for direct access");
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("notification_update", handleNotificationUpdate);
    };
  }, [authUser]);

  // Initial fetch when component mounts or user changes
  useEffect(() => {
    if (authUser) {
      console.log(
        "🔔 NotificationBell: Fetching unread count for user:",
        authUser.username
      );
      fetchUnreadCount();
    
    // Listen for WebSocket events via global window object
    const handleWebSocketMessage = (event) => {
      if (event.detail && event.detail.type === "new_notification") {
        console.log("🔔 New notification via WebSocket event");
        fetchUnreadCount();
      }
    };
    
    window.addEventListener("websocket_notification", handleWebSocketMessage);
    
    // Set up polling for real-time updates (fallback)
    const pollInterval = setInterval(() => {
      if (authUser && document.visibilityState === "visible") {
        fetchUnreadCount();
    
    // Listen for WebSocket events via global window object
    const handleWebSocketMessage = (event) => {
      if (event.detail && event.detail.type === "new_notification") {
        console.log("🔔 New notification via WebSocket event");
        fetchUnreadCount();
      }
    };
    
    window.addEventListener("websocket_notification", handleWebSocketMessage);
      }
    }, 30000); // Poll every 30 seconds when page is visible

    return () => clearInterval(pollInterval);
    }
  }, [authUser]);

  const toggleDropdown = () => {
    console.log("🔔 NotificationBell clicked!");
    console.log("Current unread count:", unreadCount);
    console.log("User:", authUser?.username);

    setIsOpen(!isOpen);

    if (unreadCount > 0) {
      console.log(
        "💡 Opening notification dropdown with",
        unreadCount,
        "unread notifications"
      );
    } else {
      console.log("💡 Opening notification dropdown (no unread notifications)");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="relative">
        <button
          className="relative p-2 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          disabled
        >
          <Bell className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-300 rounded-full animate-pulse"></span>
        </button>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative">
        <button
          onClick={() => {
            console.log("🔄 Retrying notification fetch...");
            fetchUnreadCount();
    
    // Listen for WebSocket events via global window object
    const handleWebSocketMessage = (event) => {
      if (event.detail && event.detail.type === "new_notification") {
        console.log("🔔 New notification via WebSocket event");
        fetchUnreadCount();
      }
    };
    
    window.addEventListener("websocket_notification", handleWebSocketMessage);
    
    // Set up polling for real-time updates (fallback)
    const pollInterval = setInterval(() => {
      if (authUser && document.visibilityState === "visible") {
        fetchUnreadCount();
    
    // Listen for WebSocket events via global window object
    const handleWebSocketMessage = (event) => {
      if (event.detail && event.detail.type === "new_notification") {
        console.log("🔔 New notification via WebSocket event");
        fetchUnreadCount();
      }
    };
    
    window.addEventListener("websocket_notification", handleWebSocketMessage);
      }
    }, 30000); // Poll every 30 seconds when page is visible

    return () => clearInterval(pollInterval);
          }}
          className="relative p-2 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          title={`Error loading notifications: ${error}`}
        >
          <Bell className="w-6 h-6 text-red-500 dark:text-red-400" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        ref={bellRef}
        onClick={toggleDropdown}
        className={`
          relative p-2 rounded-full transition-all duration-200 
          hover:bg-gray-100 dark:hover:bg-gray-700
          ${isOpen ? "bg-gray-100 dark:bg-gray-700" : ""}
          ${hasNewNotifications ? "animate-pulse" : ""}
        `}
        aria-label={`Notifications ${
          unreadCount > 0 ? `(${unreadCount} unread)` : ""
        }`}
        title={`${unreadCount} unread notification${
          unreadCount !== 1 ? "s" : ""
        }`}
      >
        {/* Bell Icon - animate if there are unread notifications */}
        {hasNewNotifications && unreadCount > 0 ? (
          <BellRing
            className={`
              w-6 h-6 text-gray-600 dark:text-gray-300
              ${hasNewNotifications ? "animate-bounce" : ""}
            `}
          />
        ) : (
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        )}

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Active Indicator Dot */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
        >
          <NotificationDropdown
            onClose={() => setIsOpen(false)}
            onNotificationRead={() => {
              // Refresh unread count when notification is marked as read
              fetchUnreadCount();
    
    // Listen for WebSocket events via global window object
    const handleWebSocketMessage = (event) => {
      if (event.detail && event.detail.type === "new_notification") {
        console.log("🔔 New notification via WebSocket event");
        fetchUnreadCount();
      }
    };
    
    window.addEventListener("websocket_notification", handleWebSocketMessage);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
