import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import AddPlatform from "../components/Settings/AddPlatform";
import SocialNetworks from "../components/Settings/SocialNetworksSettings";
import BasicInfo from "../components/Settings/BasicInfoSettings";
import AccountSettings from "../components/Settings/AccountSettings";
import NotificationPreferences from "../components/ProblemTracker/NotificationPreferences";
import { useAuthContext } from "../context/AuthContext";
import { CheckCircle, Bell } from "lucide-react";
import {
  requestNotificationPermission,
  getNotificationStatus,
} from "../utils/notificationUtils";

const Settings = () => {
  const { authUser, updateUser, logout, isLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState("basic");
  const [showNotificationPreferences, setShowNotificationPreferences] =
    useState(false);
  const [notificationStatus, setNotificationStatus] = useState({
    supported: false,
    enabled: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      setActiveTab(tabParam === "notifications" ? "account" : tabParam);
      if (tabParam === "notifications") {
        setShowNotificationPreferences(true);
      }
    }

    // Check notification status without displaying notifications
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    try {
      const status = getNotificationStatus();
      setNotificationStatus(status);

      // Save notification status to user preferences
      if (
        authUser &&
        authUser.preferences?.notifications?.enabled !== status.enabled
      ) {
        const updatedPreferences = {
          ...(authUser.preferences || {}),
          notifications: {
            ...(authUser.preferences?.notifications || {}),
            enabled: status.enabled,
            supported: status.supported,
          },
        };

        updateUser({
          ...authUser,
          preferences: updatedPreferences,
        });
      }
    } catch (error) {
      console.error("Error checking notification status:", error);
      // Continue anyway - we don't want this to block the settings page
    }
  };

  const handleProfileUpdate = (updatedData) => {
    const success = updateUser(updatedData);
    if (success) {
      // toast.success('Profile updated successfully');
    } else {
      toast.error("Failed to update profile");
    }
  };

  const handlePlatformsUpdate = (updatedPlatform) => {
    const updatedPlatforms = {
      ...authUser.platforms,
      [updatedPlatform.name]: updatedPlatform,
    };

    const updatedData = { ...authUser, platforms: updatedPlatforms };
    const success = updateUser(updatedData);
    if (success) {
      // toast.success('Platform updated successfully');
    } else {
      toast.error("Failed to update platform");
    }
  };

  const handleSocialNetworksUpdate = (socialNetworks) => {
    const updatedData = { ...authUser, socialNetworks };
    const success = updateUser(updatedData);
    if (success) {
      // toast.success('Social networks updated successfully');
    } else {
      toast.error("Failed to update social networks");
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      let newStatus;

      if (!notificationStatus.enabled) {
        // Request permission
        const granted = await requestNotificationPermission();
        newStatus = { ...notificationStatus, enabled: granted };

        if (granted) {
          toast.success(
            "Notifications enabled! You'll be notified when reminders are due."
          );
        } else {
          toast.error(
            "Notifications denied. Enable them in your browser settings."
          );
        }
      } else {
        // No way to programmatically disable notifications once granted,
        // so we just update our preferences
        newStatus = { ...notificationStatus, enabled: false };
        toast.success(
          "Notification preference saved. Note: Browser permissions remain granted."
        );
      }

      setNotificationStatus(newStatus);

      // Update user preferences
      if (authUser) {
        const updatedPreferences = {
          ...(authUser.preferences || {}),
          notifications: {
            ...(authUser.preferences?.notifications || {}),
            enabled: newStatus.enabled,
            supported: newStatus.supported,
          },
        };

        updateUser({
          ...authUser,
          preferences: updatedPreferences,
        });
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
    }
  };

  // Show loading state if auth is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Show error state if no user data
  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Unable to load user data</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 sm:p-4">
      <div className="max-w-2xl w-full mx-auto sm:mx-0 sm:ml-4">
        <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
          Settings
        </h1>

        {/* Profile Summary */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <img
            src={authUser?.profilePicture || "/default-avatar.png"}
            alt="Profile"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-blue-500"
          />
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h3 className="text-base sm:text-lg font-medium">
                {authUser?.fullName}
              </h3>
              {authUser?.isProfileComplete && (
                <CheckCircle
                  className="w-4 h-4 sm:w-5 sm:h-5 text-green-500"
                  title="Profile Complete"
                />
              )}
            </div>
            <p className="text-gray-400 text-sm">@{authUser?.username}</p>
            {!authUser?.isProfileComplete && (
              <p className="text-xs sm:text-sm text-yellow-500">
                Complete your profile for a professional look!
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap mb-4 sm:mb-6 gap-2 sm:gap-0">
          {["basic", "platforms", "social", "account"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base
                                ${
                                  activeTab === tab
                                    ? "text-blue-500 border-b-2 border-blue-500"
                                    : "text-gray-400 hover:text-white"
                                }`}
            >
              {tab === "basic"
                ? "Basic Info"
                : tab === "platforms"
                ? "Platforms"
                : tab === "social"
                ? "Social Networks"
                : "Account"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-6">
          {activeTab === "basic" ? (
            <BasicInfo
              profileData={authUser}
              onProfileUpdate={handleProfileUpdate}
            />
          ) : activeTab === "platforms" ? (
            <AddPlatform
              platforms={authUser?.platforms}
              onPlatformsUpdate={handlePlatformsUpdate}
            />
          ) : activeTab === "social" ? (
            <SocialNetworks
              socialNetworks={authUser?.socialNetworks}
              onSocialNetworksUpdate={handleSocialNetworksUpdate}
            />
          ) : (
            <>
              {/* Add Notifications section to Account tab */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications
                </h3>

                {notificationStatus.supported ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Problem Review Reminders</p>
                        <p className="text-gray-400 text-sm">
                          Get notified when it's time to review problems
                        </p>
                      </div>

                      <button
                        onClick={handleNotificationUpdate}
                        className={`px-3 py-1.5 rounded text-sm ${
                          notificationStatus.enabled
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-600 hover:bg-gray-700"
                        }`}
                      >
                        {notificationStatus.enabled ? "Enabled" : "Enable"}
                      </button>
                    </div>

                    <p className="text-sm text-gray-400">
                      {notificationStatus.enabled
                        ? "Notifications are enabled. You'll be notified when reminders are due."
                        : "Enable notifications to get reminded when it's time to review problems."}
                    </p>
                  </div>
                ) : (
                  <p className="text-yellow-500">
                    Your browser doesn't support notifications or they're
                    blocked by your system settings.
                  </p>
                )}
              </div>

              <AccountSettings
                profileData={authUser}
                onProfileUpdate={handleProfileUpdate}
                onLogout={logout}
              />
            </>
          )}
        </div>

        {/* Notification Preferences Modal */}
        {showNotificationPreferences && (
          <NotificationPreferences
            isOpen={showNotificationPreferences}
            onClose={() => {
              setShowNotificationPreferences(false);
              setNotificationStatus(getNotificationStatus());
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Settings;
