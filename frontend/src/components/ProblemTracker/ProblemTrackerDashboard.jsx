import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Code2,
  RefreshCw,
  BookOpen,
  Clock,
  Star,
  Bell,
  BellOff,
  Settings as SettingsIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { problemTrackerApi } from "../../api/problemTrackerApi";
import ProblemList from "./ProblemList";
import ReminderList from "./ReminderList";
import StatsCards from "./StatsCards";
import { useReminderContext } from "../../context/ReminderContext";
import { useAuthContext } from "../../context/AuthContext";

const ProblemTrackerDashboard = () => {
  const [activeTab, setActiveTab] = useState("problems");
  const [problems, setProblems] = useState([]);
  const [importantProblems, setImportantProblems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshingReminders, setRefreshingReminders] = useState(false);
  const { authUser } = useAuthContext();

  // Use reminder context
  const {
    reminders,
    pendingCount,
    fetchPendingReminders,
    completeReminder: contextCompleteReminder,
    skipReminder: contextSkipReminder,
    refreshCount,
  } = useReminderContext();

  const [filters, setFilters] = useState({
    search: "",
    isImportant: "",
    sortBy: "solvedAt",
    sortOrder: "desc",
  });
  const [importantFilters, setImportantFilters] = useState({
    search: "",
    sortBy: "solvedAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalProblems: 0,
  });
  const [importantPagination, setImportantPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalProblems: 0,
  });
  const [isMobile, setIsMobile] = useState(false);

  // Get notification preferences from user settings
  const notificationsEnabled =
    authUser?.preferences?.notifications?.enabled || false;

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadProblems(),
        loadImportantProblems(),
        loadPendingReminders(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await problemTrackerApi.getDashboardStats();
      setStats(response);
    } catch (error) {
      console.error("❌ Frontend: Error loading stats:", error);
    }
  };

  const loadProblems = async (page = 1) => {
    try {
      const params = {
        ...filters,
        page,
        limit: 20,
      };

      const response = await problemTrackerApi.getTrackedProblems(params);
      setProblems(response.problems || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error("Error loading problems:", error);
      toast.error("Failed to load problems");
    }
  };

  const loadImportantProblems = async (page = 1) => {
    try {
      const params = {
        ...importantFilters,
        isImportant: "true", // Force filter to only important problems
        page,
        limit: 20,
      };

      const response = await problemTrackerApi.getTrackedProblems(params);
      setImportantProblems(response.problems || []);
      setImportantPagination(response.pagination || {});
    } catch (error) {
      console.error("Error loading important problems:", error);
      toast.error("Failed to load important problems");
    }
  };

  const loadPendingReminders = async () => {
    try {
      setRefreshingReminders(true);
      await fetchPendingReminders();
    } catch (error) {
      console.error("❌ Frontend: Error loading reminders:", error);
    } finally {
      setRefreshingReminders(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await problemTrackerApi.syncRecentProblems();

      toast.success(`Synced ${response.synced} problems from LeetCode`);

      // Reload data after sync
      await loadDashboardData();
    } catch (error) {
      console.error("Error syncing problems:", error);

      // Handle rate limiting with detailed message
      if (error.cooldownSeconds) {
        const minutes = Math.floor(error.cooldownSeconds / 60);
        const seconds = error.cooldownSeconds % 60;
        const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        toast.error(`Please wait ${timeStr} before syncing again`, {
          duration: 6000,
        });
      } else if (error.message?.includes("LeetCode username not configured")) {
        toast.error("Please add your LeetCode username in settings first");
      } else {
        toast.error("Failed to sync problems from LeetCode");
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleImportantFilterChange = (newFilters) => {
    setImportantFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleProblemUpdate = async (problemId, updates) => {
    try {
      await problemTrackerApi.updateTrackedProblem(problemId, updates);
      toast.success("Problem updated successfully");

      // Reload current tab data
      if (activeTab === "problems") {
        loadProblems(pagination.current);
      } else if (activeTab === "important") {
        loadImportantProblems(importantPagination.current);
      }

      // Refresh reminders if reminders were updated
      if (updates.hasReminders !== undefined) {
        refreshCount();
      }

      loadStats(); // Refresh stats
    } catch (error) {
      console.error("Error updating problem:", error);
      toast.error("Failed to update problem");
    }
  };

  const handleProblemDelete = async (problemId) => {
    try {
      await problemTrackerApi.deleteTrackedProblem(problemId);
      toast.success("Problem deleted successfully");

      // Reload current tab data
      if (activeTab === "problems") {
        loadProblems(pagination.current);
      } else if (activeTab === "important") {
        loadImportantProblems(importantPagination.current);
      }

      loadStats(); // Refresh stats
    } catch (error) {
      console.error("Error deleting problem:", error);
      toast.error("Failed to delete problem");
    }
  };

  const handleReminderComplete = async (reminderId) => {
    try {
      await contextCompleteReminder(reminderId);
      toast.success("Reminder completed!");
      loadStats(); // Refresh stats
    } catch (error) {
      console.error("Error completing reminder:", error);
      toast.error("Failed to complete reminder");
    }
  };

  const handleReminderSkip = async (reminderId, snoozeHours = 24) => {
    try {
      await contextSkipReminder(reminderId, snoozeHours);
      toast.success(`Reminder snoozed for ${snoozeHours} hours`);
    } catch (error) {
      console.error("Error skipping reminder:", error);
      toast.error("Failed to skip reminder");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading Problem Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-0">
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-1 sm:gap-3">
              <Code2 className="w-5 h-5 sm:w-8 sm:h-8 text-blue-400" />
              LeetCode Problem Tracker
            </h1>
            <p className="text-gray-400 text-xs sm:text-base">
              Track your recent solved problems and set review reminders
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <Link
              to="/settings?tab=notifications"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm bg-gray-600 hover:bg-gray-700"
              title="Configure notifications in settings"
            >
              <SettingsIcon className="w-4 h-4" />
              {!isMobile && "Settings"}
            </Link>

            {/* Notification Status Indicator */}
            <div
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm ${
                notificationsEnabled
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
              title={
                notificationsEnabled
                  ? "Notifications enabled"
                  : "Notifications disabled"
              }
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
              {!isMobile &&
                (notificationsEnabled
                  ? "Notifications On"
                  : "Notifications Off")}
            </div>

            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg transition-colors text-xs sm:text-base"
            >
              <RefreshCw
                className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync from LeetCode"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Tabs */}
        <div className="flex flex-wrap mb-3 sm:mb-6 gap-0.5 sm:gap-2 overflow-x-auto">
          {(isMobile
            ? [
                { id: "problems", label: "All Problems", icon: BookOpen },
                {
                  id: "reminders",
                  label: "Pending Reminders",
                  icon: Clock,
                  badge: pendingCount,
                },
              ]
            : [
                { id: "problems", label: "All Problems", icon: BookOpen },
                {
                  id: "important",
                  label: "Important Problems",
                  icon: Star,
                  badge: stats.importantCount,
                },
                {
                  id: "reminders",
                  label: "Pending Reminders",
                  icon: Clock,
                  badge: pendingCount,
                },
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-1.5 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors text-xs sm:text-sm lg:text-base relative whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "text-blue-500 border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-white"
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] h-4 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-3 sm:space-y-6">
          {activeTab === "problems" && (
            <ProblemList
              problems={problems}
              pagination={pagination}
              filters={filters}
              onFilterChange={handleFilterChange}
              onProblemUpdate={handleProblemUpdate}
              onProblemDelete={handleProblemDelete}
              onPageChange={loadProblems}
            />
          )}

          {activeTab === "important" && (
            <ProblemList
              problems={importantProblems}
              pagination={importantPagination}
              filters={importantFilters}
              onFilterChange={handleImportantFilterChange}
              onProblemUpdate={handleProblemUpdate}
              onProblemDelete={handleProblemDelete}
              onPageChange={loadImportantProblems}
            />
          )}

          {activeTab === "reminders" && (
            <>
              <ReminderList
                reminders={reminders}
                onReminderComplete={handleReminderComplete}
                onReminderSkip={handleReminderSkip}
                onRefresh={loadPendingReminders}
                refreshing={refreshingReminders}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemTrackerDashboard;
