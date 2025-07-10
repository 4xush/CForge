import { useState, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  SkipForward,
  ExternalLink,
  Calendar,
  RefreshCw,
  Filter,
  AlertCircle,
} from "lucide-react";
import { formatReminderDate } from "../../utils/notificationUtils";

const ReminderList = ({
  reminders,
  onReminderComplete,
  onReminderSkip,
  onRefresh,
  refreshing = false,
}) => {
  const [processingReminder, setProcessingReminder] = useState(null);
  const [viewMode, setViewMode] = useState("today");

  const handleComplete = async (reminderId) => {
    try {
      setProcessingReminder(reminderId);
      await onReminderComplete(reminderId);
    } finally {
      setProcessingReminder(null);
    }
  };

  const handleSkip = async (reminderId, hours = 24) => {
    try {
      setProcessingReminder(reminderId);
      await onReminderSkip(reminderId, hours);
    } finally {
      setProcessingReminder(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: "text-green-400",
      Medium: "text-yellow-400",
      Hard: "text-red-400",
    };
    return colors[difficulty] || "text-gray-400";
  };

  const filteredReminders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return reminders.filter((reminder) => {
      const reminderDate = new Date(reminder.reminderDate);

      switch (viewMode) {
        case "today":
          return reminderDate < tomorrow;
        case "week":
          return reminderDate < weekFromNow;
        case "overdue":
          return reminderDate < today;
        case "all":
        default:
          return true;
      }
    });
  }, [reminders, viewMode]);

  const getCounts = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return {
      today: reminders.filter((r) => new Date(r.reminderDate) < tomorrow)
        .length,
      week: reminders.filter((r) => new Date(r.reminderDate) < weekFromNow)
        .length,
      overdue: reminders.filter((r) => new Date(r.reminderDate) < today).length,
      all: reminders.length,
    };
  };

  const counts = getCounts();

  if (reminders.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 sm:p-8 text-center border border-gray-700 mx-2 sm:mx-0">
        <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-gray-300 mb-1 sm:mb-2">
          No pending reminders
        </h3>
        <p className="text-gray-500 mb-3 sm:mb-4 text-xs sm:text-base">
          Great job! You're all caught up with your reviews.
        </p>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors mx-auto text-sm sm:text-base"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-medium text-white">
          Pending Reminders ({filteredReminders.length})
        </h3>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1 text-gray-400 hover:text-white disabled:text-gray-500 transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* View Mode Filter */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Filter className="w-4 h-4" />
          <span>View:</span>
        </div>
        {[
          { key: "today", label: "Due Today", count: counts.today },
          { key: "week", label: "This Week", count: counts.week },
          { key: "overdue", label: "Overdue", count: counts.overdue },
          { key: "all", label: "All", count: counts.all },
        ].map((mode) => (
          <button
            key={mode.key}
            onClick={() => setViewMode(mode.key)}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === mode.key
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {mode.key === "overdue" && mode.count > 0 && (
              <AlertCircle className="w-3 h-3 text-red-400" />
            )}
            {mode.label}
            {mode.count > 0 && (
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 min-w-[16px] h-4 flex items-center justify-center ${
                  mode.key === "overdue" && mode.count > 0
                    ? "bg-red-500 text-white"
                    : viewMode === mode.key
                    ? "bg-blue-800 text-blue-200"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                {mode.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <Clock className="w-8 h-8 text-gray-500 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-300 mb-2">
              No reminders in this view
            </h4>
            <p className="text-gray-500 text-sm">
              {viewMode === "today" && "No reminders due today."}
              {viewMode === "week" && "No reminders due this week."}
              {viewMode === "overdue" && "No overdue reminders."}
              {viewMode === "all" && "No reminders found."}
            </p>
          </div>
        ) : (
          filteredReminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`bg-gray-800 rounded-lg p-4 border transition-colors ${
                new Date(reminder.reminderDate) <
                new Date(new Date().setHours(0, 0, 0, 0))
                  ? "border-red-500/50 hover:border-red-500 bg-red-900/10"
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Problem Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-white font-medium truncate">
                      {reminder.problem.title}
                    </h4>
                    <a
                      href={reminder.problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="flex items-center gap-4 text-sm mb-3">
                    {/* Difficulty */}
                    {reminder.problem.difficulty && (
                      <span
                        className={`font-medium ${getDifficultyColor(
                          reminder.problem.difficulty
                        )}`}
                      >
                        {reminder.problem.difficulty}
                      </span>
                    )}
                    {/* Reminder Date */}
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatReminderDate(reminder.reminderDate)}</span>
                    </div>
                    {/* Interval */}
                    <span className="text-gray-500">
                      {reminder.interval} day
                      {reminder.interval !== 1 ? "s" : ""} interval
                    </span>
                  </div>
                  {/* Originally Solved Date */}
                  <div className="text-xs text-gray-500">
                    Originally solved:{" "}
                    {new Date(reminder.problem.solvedAt).toLocaleDateString()}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {/* Complete Button */}
                  <button
                    onClick={() => handleComplete(reminder.id)}
                    disabled={processingReminder === reminder.id}
                    className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {processingReminder === reminder.id
                      ? "Processing..."
                      : "Complete"}
                  </button>
                  {/* Skip Options */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </button>
                    {/* Skip Dropdown */}
                    <div className="absolute right-0 top-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
                      <button
                        onClick={() => handleSkip(reminder.id, 1)}
                        disabled={processingReminder === reminder.id}
                        className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 transition-colors text-sm"
                      >
                        1 hour
                      </button>
                      <button
                        onClick={() => handleSkip(reminder.id, 6)}
                        disabled={processingReminder === reminder.id}
                        className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 transition-colors text-sm"
                      >
                        6 hours
                      </button>
                      <button
                        onClick={() => handleSkip(reminder.id, 24)}
                        disabled={processingReminder === reminder.id}
                        className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 transition-colors text-sm"
                      >
                        1 day
                      </button>
                      <button
                        onClick={() => handleSkip(reminder.id, 72)}
                        disabled={processingReminder === reminder.id}
                        className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 transition-colors text-sm"
                      >
                        3 days
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReminderList;
