import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  Github,
  Trophy,
  BarChart2,
  RefreshCw,
  Award,
  TrendingUp,
  AlertCircle,
  X,
} from "lucide-react";
import PropTypes from "prop-types";
import { useUserDashboard } from "../hooks/useUserDashboard";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { ProfileHeader } from "./Profile/ProfileHeader";
import { PlatformCard, getPlatformStats } from "./Profile/PlatformCards";
import ActivityHeatmap from "./Profile/ActivityHeatmap";
import { useHeatmapData } from "../hooks/useHeatmapData";
import LeetCodeDashboard from "./Profile/LeetCodeDashboard";

const TabButton = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`
            flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold rounded-xl 
            transition-all duration-300 ease-in-out transform hover:scale-105
            ${
              active
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700"
            }
        `}
  >
    {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
    {children}
  </button>
);

TabButton.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
};

const RefreshButton = ({ onClick, refreshing }) => (
  <button
    onClick={onClick}
    disabled={refreshing}
    className={`
            flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold
            transition-all duration-300 ease-in-out transform hover:scale-105
            ${
              refreshing
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg"
            }
        `}
  >
    <RefreshCw
      className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? "animate-spin" : ""}`}
    />
    {refreshing ? "Refreshing..." : "Refresh Data"}
  </button>
);

RefreshButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  refreshing: PropTypes.bool.isRequired,
};

const PlatformVerificationModal = ({ user, onClose }) => {
  const navigate = useNavigate();
  const platformUsernames = {
    leetcode: user?.platforms?.leetcode?.username,
    codeforces: user?.platforms?.codeforces?.username,
    github: user?.platforms?.github?.username,
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case "leetcode":
        return <Code2 className="w-5 h-5 text-yellow-400" />;
      case "codeforces":
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case "github":
        return <Github className="w-5 h-5 text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 max-w-xs sm:max-w-md w-full mx-2 sm:mx-4 border border-gray-700 shadow-xl">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Verify Your Platform Usernames
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <p className="text-gray-400 mb-4 sm:mb-6 text-xs sm:text-base">
          Please verify your coding platform usernames to ensure accurate stats
          tracking.
        </p>

        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {Object.entries(platformUsernames).map(([platform, username]) => (
            <div
              key={platform}
              className="flex items-center justify-between bg-gray-700/50 p-2 sm:p-3 rounded-lg"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {getPlatformIcon(platform)}
                <div>
                  <p className="text-white font-medium capitalize text-xs sm:text-base">
                    {platform}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {username || "Not set"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/settings?tab=platforms")}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                {username ? "Update" : "Add"}
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
};

PlatformVerificationModal.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
    platforms: PropTypes.shape({
      leetcode: PropTypes.shape({
        username: PropTypes.string,
      }),
      codeforces: PropTypes.shape({
        username: PropTypes.string,
      }),
      github: PropTypes.shape({
        username: PropTypes.string,
      }),
    }),
  }),
  onClose: PropTypes.func.isRequired,
};

// Error boundary component for heatmap
const HeatmapErrorBoundary = ({ children, platform, error, onRetry }) => {
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-24 sm:h-32 text-center p-2 sm:p-4">
        <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mb-1 sm:mb-2" />
        <p className="text-red-400 font-bold mb-0.5 sm:mb-1 text-xs sm:text-base">
          Failed to load {platform} activity
        </p>
        <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">
          Unable to fetch activity data
        </p>
        <button
          onClick={onRetry}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  return children;
};

HeatmapErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  platform: PropTypes.string.isRequired,
  error: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
};

const UserProfile = () => {
  // Solution 1: Use AuthContext as single source of truth for user data
  const { authUser: user, isLoading: authLoading, refreshPlatformData } = useAuthContext();
  
  // Keep only non-user related functionality from useUserDashboard
  const { 
    showVerificationModal, 
    closeVerificationModal 
  } = useUserDashboard();

  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Modified heatmap data hook call
  const {
    data: heatmapData,
    loading: heatmapLoading,
    error: heatmapError,
    refetch: refetchHeatmap,
  } = useHeatmapData(user?.username);

  // Use AuthContext's refreshPlatformData method with toast message
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Use AuthContext's method which updates global user state and returns response data
      const refreshResult = await refreshPlatformData();
      
      // Display success message from backend response
      if (refreshResult?.message) {
        toast.success(refreshResult.message);
      } else {
        toast.success("Platform data refreshed successfully");
      }
      
      // Show additional info if available
      if (refreshResult?.warnings && refreshResult.warnings.length > 0) {
        refreshResult.warnings.forEach(warning => {
          toast.warning(`${warning.platform}: ${warning.message}`);
        });
      }
      
      // Retry heatmap
      refetchHeatmap();
    } catch (err) {
      console.error("Failed to refresh platform data:", err);
      // Error toast is already handled in AuthContext
    } finally {
      setRefreshing(false);
    }
  };

  const handleHeatmapRetry = () => {
    refetchHeatmap();
  };

  // Handle auth loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-purple">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"></div>
          </div>
          <p className="text-gray-300 font-medium text-sm sm:text-base">
            Loading profile data...
          </p>
        </div>
      </div>
    );
  }

  // Handle case where user is not authenticated
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-purple">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-8 max-w-xs sm:max-w-lg text-center">
          <div className="text-gray-300 text-lg sm:text-xl font-bold mb-2 sm:mb-4">
            Authentication Required
          </div>
          <p className="text-gray-400 text-xs sm:text-base">
            Please log in to view your profile.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl text-white font-bold transition-all text-xs sm:text-base"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Handle incomplete profile
  if (!user.isProfileComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 max-w-xs sm:max-w-md w-full mx-2 sm:mx-4 border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Complete Your Profile
              </h2>
            </div>
          </div>
          <p className="text-gray-400 mb-4 sm:mb-6 text-xs sm:text-base">
            Please complete your profile by adding your LeetCode profile in the
            settings.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => navigate("/settings?tab=platforms")}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-lg text-white font-medium transition-colors text-xs sm:text-base"
            >
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const leetcodeData = user.platforms?.leetcode;
  const platformStats = getPlatformStats(user);

  // Check if LeetCode data is outdated (older than 2 days)
  let showLeetCodeStaleDialog = false;
  let leetcodeLastUpdated = leetcodeData?.lastUpdated;
  
  if (leetcodeLastUpdated) {
    const last = new Date(leetcodeLastUpdated);
    const now = new Date();
    const diffDays = (now - last) / (1000 * 60 * 60 * 24);
    showLeetCodeStaleDialog = diffDays > 2;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple">
      {showVerificationModal && (
        <PlatformVerificationModal
          user={user}
          onClose={closeVerificationModal}
        />
      )}
      <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-4">
        {showLeetCodeStaleDialog && (
          <div className="mb-4 flex items-center justify-between bg-yellow-900/80 border border-yellow-600 rounded-xl px-4 py-3 shadow-lg animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 animate-pulse" />
              <div>
                <div className="font-bold text-yellow-300 text-sm sm:text-base">
                  Your LeetCode data is out of date
                </div>
                <div className="text-yellow-200 text-xs sm:text-sm">
                  Last updated{" "}
                  {leetcodeLastUpdated
                    ? new Date(leetcodeLastUpdated).toLocaleString()
                    : ""}
                  .<br />
                  Please refresh to see your latest stats.
                </div>
              </div>
            </div>
            <RefreshButton onClick={handleRefresh} refreshing={refreshing} />
          </div>
        )}
        <div className="mb-4 sm:mb-8">
          <ProfileHeader user={user} />
        </div>
        <div className="mt-2 sm:mt-2 mb-3 sm:mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome, {user.fullName}!
          </h1>
          <p className="text-gray-400 mt-1 sm:mt-2 text-xs sm:text-base">
            Below are your coding platform details and activity statistics.
            Click the 'Refresh Data' button to retrieve the updated stats.
          </p>
        </div>
        <div className="mb-4 sm:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 sm:gap-4">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={BarChart2}
            >
              Overview
            </TabButton>
            <TabButton
              active={activeTab === "leetcode"}
              onClick={() => setActiveTab("leetcode")}
              icon={Code2}
            >
              LeetCode Stats
            </TabButton>
          </div>
          <RefreshButton onClick={handleRefresh} refreshing={refreshing} />
        </div>
        {activeTab === "overview" ? (
          <div className="space-y-4 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
              <PlatformCard
                platform="LeetCode"
                stats={platformStats.leetcode}
                icon={Trophy}
                color="text-yellow-400"
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-indigo-500"
              />
              <PlatformCard
                platform="Codeforces"
                stats={platformStats.codeforces}
                icon={Award}
                color="text-red-500"
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-indigo-500"
              />
              <PlatformCard
                platform="GitHub"
                stats={platformStats.github}
                icon={Github}
                color="text-blue-400"
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-8">
              {[
                {
                  platform: "leetcode",
                  data: heatmapData?.leetcode,
                  icon: Code2,
                  color: "text-yellow-400",
                },
                {
                  platform: "github",
                  data: heatmapData?.github,
                  icon: Github,
                  color: "text-blue-400",
                },
                {
                  platform: "codeforces",
                  data: heatmapData?.codeforces,
                  icon: TrendingUp,
                  color: "text-red-500",
                },
              ].map(({ platform, data, icon: Icon, color }) => (
                <div
                  key={platform}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg p-3 sm:p-6 transform transition-all duration-300 hover:shadow-xl hover:border-indigo-500"
                >
                  <HeatmapErrorBoundary
                    platform={platform}
                    error={heatmapError}
                    onRetry={handleHeatmapRetry}
                  >
                    {heatmapLoading ? (
                      <div className="flex justify-center items-center h-24 sm:h-32">
                        <div className="flex flex-col items-center gap-2 sm:gap-4">
                          <div className="w-8 h-8 sm:w-12 sm:h-12 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full animate-ping opacity-75"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"></div>
                          </div>
                          <p className="text-gray-300 font-medium text-xs sm:text-base">
                            Loading {platform} activity...
                          </p>
                        </div>
                      </div>
                    ) : data && Object.keys(data).length > 0 ? (
                      <ActivityHeatmap data={data} platform={platform} />
                    ) : (
                      <div className="flex justify-center items-center h-24 sm:h-32">
                        <p className="text-gray-400 text-xs sm:text-base">
                          No activity data available for {platform}.
                        </p>
                      </div>
                    )}
                  </HeatmapErrorBoundary>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:border-indigo-500">
            <div className="p-3 sm:p-6 border-b border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  LeetCode Dashboard
                </h3>
              </div>
            </div>
            <LeetCodeDashboard
              leetcodeData={leetcodeData}
              nestedUsername={user?.username}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;