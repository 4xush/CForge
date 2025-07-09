import { useState, useEffect } from "react";
import { Bell, BellOff, Settings, X, Check, Smartphone } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getNotificationStatus,
  setNotificationPreferences,
  getNotificationPreferences,
  requestNotificationPermission,
} from "../../utils/notificationUtils";
import PushNotificationService from "../../services/pushNotificationService"; // NEW: Import push service

const NotificationPreferences = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState(getNotificationPreferences());
  const [notificationStatus, setNotificationStatus] = useState(
    getNotificationStatus()
  );
  const [pushStatus, setPushStatus] = useState({
    supported: false,
    subscribed: false,
  }); // NEW: Push status
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPreferences(getNotificationPreferences());
      setNotificationStatus(getNotificationStatus());
      checkPushStatus(); // NEW: Check push notification status
    }
  }, [isOpen]);

  // NEW: Check push notification status
  const checkPushStatus = async () => {
    try {
      
      // Check basic support first
      const basicSupport = "serviceWorker" in navigator && "PushManager" in window;
      
      if (!basicSupport) {
        setPushStatus({ supported: false, subscribed: false });
        return;
      }
      
      
      // Get status from push service
      const status = await PushNotificationService.getStatus();
      setPushStatus(status);
      
    } catch (error) {
      console.error("❌ Error in checkPushStatus:", error);
      setPushStatus({ supported: false, subscribed: false, error: error.message });
    }
  };

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // NEW: Handle push notification toggle
  const handlePushToggle = async () => {
    try {
      setSaving(true);

      if (pushStatus.subscribed) {
        // Unsubscribe from push notifications
        await PushNotificationService.unsubscribe();
        toast.success("Push notifications disabled");
      } else {
        // Subscribe to push notifications
        await PushNotificationService.subscribe();
        toast.success(
          "Push notifications enabled! You'll receive reminders even when the app is closed."
        );
      }

      await checkPushStatus();
    } catch (error) {
      console.error("Error toggling push notifications:", error);
      toast.error("Failed to update push notification settings");
    } finally {
      setSaving(false);
    }
  };

  // NEW: Send test push notification
  const handleTestPush = async () => {
    try {
      setSaving(true);
      await PushNotificationService.sendTestNotification();
      toast.success("Test notification sent! Check your device.");
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // If enabling notifications but permission not granted, request it
      if (preferences.enabled && notificationStatus.permission !== "granted") {
        const granted = await requestNotificationPermission();
        if (!granted) {
          toast.error("Please enable notifications in your browser settings");
          setSaving(false);
          return;
        }
      }

      setNotificationPreferences(preferences);
      setNotificationStatus(getNotificationStatus());
      toast.success("Notification preferences saved!");
      onClose();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const getPermissionStatusColor = (permission) => {
    switch (permission) {
      case "granted":
        return "text-green-400";
      case "denied":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  const getPermissionStatusText = (permission) => {
    switch (permission) {
      case "granted":
        return "Granted";
      case "denied":
        return "Denied";
      default:
        return "Not Requested";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Notification Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Browser Support Status */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Browser Support:</span>
              <span
                className={`text-sm ${
                  notificationStatus.supported
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {notificationStatus.supported ? "Supported" : "Not Supported"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Permission Status:</span>
              <span
                className={`text-sm ${getPermissionStatusColor(
                  notificationStatus.permission
                )}`}
              >
                {getPermissionStatusText(notificationStatus.permission)}
              </span>
            </div>
          </div>

          {/* Browser Notifications */}
          <div className="space-y-3">
            {/* Enable Notifications */}
            <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Bell className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm sm:text-base text-white font-medium">
                    Browser Notifications
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    Show browser notifications for reminders
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle("enabled")}
                disabled={!notificationStatus.supported}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  preferences.enabled ? "bg-blue-600" : "bg-gray-600"
                } ${
                  !notificationStatus.supported
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* NEW: Push Notifications */}
            <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm sm:text-base text-white font-medium">
                    Push Notifications
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    Receive notifications even when app is closed
                  </div>
                  {pushStatus.subscribed && (
                    <div className="text-xs text-green-400 mt-1">✓ Active</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {pushStatus.subscribed && (
                  <button
                    onClick={handleTestPush}
                    disabled={saving}
                    className="px-1.5 sm:px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
                  >
                    Test
                  </button>
                )}
                <button
                  onClick={handlePushToggle}
                  disabled={!pushStatus.supported || saving}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    pushStatus.subscribed ? "bg-purple-600" : "bg-gray-600"
                  } ${
                    !pushStatus.supported ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      pushStatus.subscribed ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Sub-settings (only show if notifications are enabled) */}
            {preferences.enabled && (
              <div className="ml-8 space-y-3 border-l-2 border-gray-600 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm sm:text-base text-white font-medium">Show on due</div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      When reminders become due
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle("showOnDue")}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      preferences.showOnDue ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        preferences.showOnDue
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm sm:text-base text-white font-medium">
                      Show when overdue
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      For past due reminders
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle("showOnOverdue")}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      preferences.showOnOverdue ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        preferences.showOnOverdue
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm sm:text-base text-white font-medium">
                      Auto-close notifications
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Automatically close after 10 seconds
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle("autoClose")}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      preferences.autoClose ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        preferences.autoClose
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Bell className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-1">
                  How notifications work:
                </p>
                <ul className="text-gray-400 space-y-1">
                  <li>• Browser notifications appear when reminders are due</li>
                  <li>• Push notifications work even when the app is closed</li>
                  <li>
                    • Click notifications to open the problem in a new tab
                  </li>
                  <li>• You can disable them anytime in browser settings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* NEW: Push Notification Info */}
          {pushStatus.supported && (
            <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-purple-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-purple-400 font-medium mb-1">
                    Push Notifications:
                  </p>
                  <ul className="text-gray-400 space-y-1">
                    <li>• Work even when CForge is closed</li>
                    <li>• Perfect for spaced repetition reminders</li>
                    <li>• Include action buttons (Complete, Snooze, Open)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Permission Help */}
          {notificationStatus.permission === "denied" && (
            <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <BellOff className="w-4 h-4 text-red-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-red-400 font-medium mb-1">
                    Notifications are blocked
                  </p>
                  <p className="text-gray-400">
                    To enable notifications, click the bell icon in your
                    browser's address bar or go to your browser settings and
                    allow notifications for this site.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors font-medium flex items-center justify-center gap-1 sm:gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
