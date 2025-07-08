import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Code2, Github, TrendingUp } from "lucide-react";

const ActivityHeatmap = ({ data, platform }) => {
  // Get platform icon and color
  const getPlatformIcon = () => {
    switch (platform) {
      case "leetcode":
        return { Icon: Code2, color: "text-yellow-400" };
      case "github":
        return { Icon: Github, color: "text-blue-400" };
      case "codeforces":
        return { Icon: TrendingUp, color: "text-red-500" };
      default:
        return { Icon: Code2, color: "text-gray-400" };
    }
  };

  const { Icon, color } = getPlatformIcon();
  // Process and validate the heatmap data
  const processedData = useMemo(() => {
    if (!data || typeof data !== "object") {
      console.warn(`No valid data provided for ${platform} heatmap`);
      return {};
    }

    // Handle different data formats
    let normalizedData = {};

    if (Array.isArray(data)) {
      // Convert array format to object format
      data.forEach((item) => {
        if (item && item.date && typeof item.count !== "undefined") {
          normalizedData[item.date] = item.count;
        }
      });
    } else {
      // Already in object format
      normalizedData = data;
    }

    return normalizedData;
  }, [data, platform]);

  // Generate calendar grid for the last year
  const calendarData = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate()
    );
    const days = [];

    // Generate all days for the past year
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const count = processedData[dateStr] || 0;

      days.push({
        date: dateStr,
        count: count,
        day: d.getDay(),
        month: d.getMonth(),
        dayOfMonth: d.getDate(),
      });
    }

    return days;
  }, [processedData]);

  // Calculate intensity levels for color coding
  const getIntensityLevel = useMemo(() => {
    const counts = calendarData
      .map((day) => day.count)
      .filter((count) => count > 0);
    if (counts.length === 0) return () => 0;

    const maxCount = Math.max(...counts);
    const levels = [
      0,
      maxCount * 0.25,
      maxCount * 0.5,
      maxCount * 0.75,
      maxCount,
    ];

    return (count) => {
      if (count === 0) return 0;
      for (let i = levels.length - 1; i >= 0; i--) {
        if (count >= levels[i]) return i;
      }
      return 0;
    };
  }, [calendarData]);

  // Get color for intensity level
  const getColor = (level) => {
    const colors = {
      leetcode: [
        "bg-gray-200 dark:bg-gray-700",
        "bg-yellow-200 dark:bg-yellow-900",
        "bg-yellow-300 dark:bg-yellow-700",
        "bg-yellow-400 dark:bg-yellow-600",
        "bg-yellow-500 dark:bg-yellow-500",
      ],
      github: [
        "bg-gray-200 dark:bg-gray-700",
        "bg-green-200 dark:bg-green-900",
        "bg-green-300 dark:bg-green-700",
        "bg-green-400 dark:bg-green-600",
        "bg-green-500 dark:bg-green-500",
      ],
      codeforces: [
        "bg-gray-200 dark:bg-gray-700",
        "bg-red-200 dark:bg-red-900",
        "bg-red-300 dark:bg-red-700",
        "bg-red-400 dark:bg-red-600",
        "bg-red-500 dark:bg-red-500",
      ],
    };

    return (
      colors[platform]?.[level] ||
      colors.github[level] ||
      "bg-gray-200 dark:bg-gray-700"
    );
  };

  // Group days by weeks
  const weeks = useMemo(() => {
    const weekGroups = [];
    let currentWeek = [];

    calendarData.forEach((day, index) => {
      if (day.day === 0 && currentWeek.length > 0) {
        // Start new week on Sunday
        weekGroups.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);

      // Handle last week
      if (index === calendarData.length - 1) {
        weekGroups.push(currentWeek);
      }
    });

    return weekGroups;
  }, [calendarData]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalDays = calendarData.length;
    const activeDays = calendarData.filter((day) => day.count > 0).length;
    const totalContributions = calendarData.reduce(
      (sum, day) => sum + day.count,
      0
    );
    const maxStreak = calculateMaxStreak(calendarData);
    const currentStreak = calculateCurrentStreak(calendarData);

    return {
      totalDays,
      activeDays,
      totalContributions,
      maxStreak,
      currentStreak,
      averagePerDay:
        totalDays > 0 ? (totalContributions / totalDays).toFixed(1) : 0,
    };
  }, [calendarData]);

  // Helper function to calculate max streak
  function calculateMaxStreak(days) {
    let maxStreak = 0;
    let currentStreak = 0;

    days.forEach((day) => {
      if (day.count > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return maxStreak;
  }

  // Helper function to calculate current streak
  function calculateCurrentStreak(days) {
    let streak = 0;

    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Month labels
  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Day labels
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (Object.keys(processedData).length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 bg-gray-800/30 rounded-lg border border-gray-700">
        <p className="text-sm">No activity data available for {platform}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Heatmap Container */}
      <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
              <h4 className="text-base sm:text-lg font-semibold text-white capitalize">
                {platform} Activity Heatmap
              </h4>
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Past 12 months</div>
          </div>

          {/* Heatmap Grid Container */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Month labels */}
                <div className="flex mb-3 ml-8">
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthIndex =
                      (new Date().getMonth() - 11 + i + 12) % 12;
                    return (
                      <div
                        key={i}
                        className="text-xs text-gray-400 flex-1 text-center min-w-[2.5rem]"
                      >
                        {i % 2 === 0 ? monthLabels[monthIndex] : ""}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar grid with day labels */}
                <div className="flex">
                  {/* Day labels */}
                  <div className="flex flex-col gap-1 mr-2">
                    {dayLabels.map((day, index) => (
                      <div key={day} className="h-3 flex items-center">
                        <span className="text-xs text-gray-400 w-6">
                          {index % 2 === 1 ? day.slice(0, 3) : ""}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Heatmap squares */}
                  <div className="flex gap-1">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }, (_, dayIndex) => {
                          const day = week.find((d) => d.day === dayIndex);
                          if (!day) {
                            return (
                              <div
                                key={`empty-${dayIndex}`}
                                className="w-3 h-3"
                              />
                            );
                          }

                          const intensityLevel = getIntensityLevel(day.count);
                          const colorClass = getColor(intensityLevel);

                          return (
                            <div
                              key={day.date}
                              className={`w-3 h-3 rounded-sm ${colorClass} hover:ring-2 hover:ring-white hover:ring-opacity-50 transition-all cursor-pointer hover:scale-110`}
                              title={`${day.date}: ${day.count} ${
                                platform === "leetcode"
                                  ? "submissions"
                                  : platform === "github"
                                  ? "contributions"
                                  : "submissions"
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend with Stats */}
                <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                  <span>Less</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span>
                      Total{" "}
                      {platform === "leetcode"
                        ? "Submissions : "
                        : platform === "github"
                        ? "Contributions : "
                        : "Submissions : "}
                      {stats.totalContributions}
                    </span>
                    <span>Active Days : {stats.activeDays}</span>
                    <span>Max Streak : {stats.maxStreak} </span>
                    <span>Current Streak : {stats.currentStreak}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`w-3 h-3 rounded-sm ${getColor(level)}`}
                        />
                      ))}
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ActivityHeatmap.propTypes = {
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  platform: PropTypes.oneOf(["leetcode", "github", "codeforces"]).isRequired,
};

export default ActivityHeatmap;
