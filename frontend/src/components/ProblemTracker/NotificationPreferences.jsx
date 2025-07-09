import { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  getNotificationStatus, 
  setNotificationPreferences, 
  getNotificationPreferences,
  requestNotificationPermission 
} from '../../utils/notificationUtils';

const NotificationPreferences = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState(getNotificationPreferences());
  const [notificationStatus, setNotificationStatus] = useState(getNotificationStatus());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPreferences(getNotificationPreferences());
      setNotificationStatus(getNotificationStatus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // If enabling notifications but permission not granted, request it
      if (preferences.enabled && notificationStatus.permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
          toast.error('Please enable notifications in your browser settings');
          setSaving(false);
          return;
        }
      }

      setNotificationPreferences(preferences);
      setNotificationStatus(getNotificationStatus());
      toast.success('Notification preferences saved!');
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const getPermissionStatusColor = (permission) => {
    switch (permission) {
      case 'granted':
        return 'text-green-400';
      case 'denied':
        return 'text-red-400';
      case 'default':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPermissionStatusText = (permission) => {
    switch (permission) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied - Enable in browser settings';
      case 'default':
        return 'Not requested';
      default:
        return 'Not supported';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Notification Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Browser Support Status */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Browser Support</span>
              <span className={`text-sm ${notificationStatus.supported ? 'text-green-400' : 'text-red-400'}`}>
                {notificationStatus.supported ? 'Supported' : 'Not Supported'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Permission Status</span>
              <span className={`text-sm ${getPermissionStatusColor(notificationStatus.permission)}`}>
                {getPermissionStatusText(notificationStatus.permission)}
              </span>
            </div>
          </div>

          {/* Main Settings */}
          <div className="space-y-3">
            {/* Enable Notifications */}
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                {preferences.enabled ? (
                  <Bell className="w-5 h-5 text-green-400" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <div className="text-white font-medium">Enable Notifications</div>
                  <div className="text-sm text-gray-400">
                    Show browser notifications for reminders
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('enabled')}
                disabled={!notificationStatus.supported}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.enabled ? 'bg-blue-600' : 'bg-gray-600'
                } ${!notificationStatus.supported ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    preferences.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sub-settings (only show if notifications are enabled) */}
            {preferences.enabled && (
              <div className="space-y-3 ml-4 border-l border-gray-600 pl-4">
                {/* Show on Due */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Show when due</div>
                    <div className="text-sm text-gray-400">
                      Notify when reminders are due today
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('showOnDue')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      preferences.showOnDue ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        preferences.showOnDue ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Show on Overdue */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Show when overdue</div>
                    <div className="text-sm text-gray-400">
                      Notify for overdue reminders
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('showOnOverdue')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      preferences.showOnOverdue ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        preferences.showOnOverdue ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto Close */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Auto-close notifications</div>
                    <div className="text-sm text-gray-400">
                      Automatically close after 10 seconds
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('autoClose')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      preferences.autoClose ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        preferences.autoClose ? 'translate-x-5' : 'translate-x-0'
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
                <p className="text-blue-400 font-medium mb-1">How notifications work:</p>
                <ul className="text-gray-400 space-y-1">
                  <li>• Browser notifications appear when reminders are due</li>
                  <li>• Click notifications to open the problem in a new tab</li>
                  <li>• Notifications work even when the app is closed</li>
                  <li>• You can disable them anytime in browser settings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Permission Help */}
          {notificationStatus.permission === 'denied' && (
            <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <BellOff className="w-4 h-4 text-red-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-red-400 font-medium mb-1">Notifications are blocked</p>
                  <p className="text-gray-400">
                    To enable notifications, click the bell icon in your browser's address bar 
                    or go to your browser settings and allow notifications for this site.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors font-medium flex items-center justify-center gap-2"
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