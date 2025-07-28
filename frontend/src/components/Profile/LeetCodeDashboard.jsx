import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BookOpen, Brain, Code, RotateCw, AlertCircle } from "lucide-react";
import { useLeetCodeStats } from "../../hooks/useLeetCodeStats";

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <div className="pt-6">{children}</div>}
    </div>
  );
};

import LeetCodeLevelCard from "./LeetCodeLevelCard";
const LeetCodeDashboard = ({ leetcodeData, nestedUsername }) => {
  const username = nestedUsername;
  const { data, loading, error, refreshStats } = useLeetCodeStats(username);

  const [tabValue, setTabValue] = useState(0);
  const currentData = leetcodeData;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 w-full max-w-md mx-auto">
          <div className="flex items-center gap-2 text-red-400 text-sm sm:text-base">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 w-full max-w-md mx-auto">
          <div className="flex items-center gap-2 text-yellow-400 text-sm sm:text-base">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>No data available for this user.</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals (matching your original logic)
  const totalProblems = {
    advanced: data.advanced
      ? data.advanced.reduce((acc, curr) => acc + curr.problemsSolved, 0)
      : 0,
    intermediate: data.intermediate
      ? data.intermediate.reduce((acc, curr) => acc + curr.problemsSolved, 0)
      : 0,
    fundamental: data.fundamental
      ? data.fundamental.reduce((acc, curr) => acc + curr.problemsSolved, 0)
      : 0,
  };

  // Color schemes - Purple theme (matching your original structure)
  const categoryColors = {
    advanced: "#a855f7", // purple-500 (was #3b82f6)
    intermediate: "#8b5cf6", // violet-500 (was #10b981)
    fundamental: "#c084fc", // purple-400 (was #f59e0b)
  };

  const getCategoryIcon = (category) => {
    const iconProps = { size: 20, className: "text-purple-400" };
    switch (category) {
      case "advanced":
        return <Brain {...iconProps} />;
      case "intermediate":
        return <Code {...iconProps} />;
      case "fundamental":
        return <BookOpen {...iconProps} />;
      default:
        return null;
    }
  };

  // Prepare chart data (matching your original logic)
  const chartData = Object.entries(data).flatMap(([category, tags]) =>
    tags.map((tag) => ({
      ...tag,
      category,
      color: categoryColors[category],
    }))
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-light text-gray-100">
              {username}&#39;s LeetCode Progress
            </h1>
            <p className="text-gray-400 font-light">Progress Dashboard</p>
            {currentData?.lastValidationCheck && (
              <p className="text-xs text-gray-500">
                Last updated:{" "}
                {new Date(currentData.lastValidationCheck).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={refreshStats}
            className="p-3 hover:bg-gray-800 rounded-full transition-colors border border-gray-700 hover:border-purple-500 self-end sm:self-auto"
            title="Refresh stats"
          >
            <RotateCw
              size={18}
              className="text-gray-400 hover:text-purple-400"
            />
          </button>
        </div>

        {/* Summary Cards (matching your original structure) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {Object.entries(totalProblems).map(([category, total]) => (
            <div
              key={category}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 sm:p-6 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-light text-gray-300 capitalize">
                  {category}
                </h3>
                {getCategoryIcon(category)}
              </div>
              <div className="text-2xl sm:text-3xl font-light text-gray-100 mb-1">
                {total}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Concepts Included
              </p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-800 overflow-x-auto">
            <div className="flex">
              {["Overview", "Detailed Stats"].map((label, index) => (
                <button
                  key={label}
                  onClick={() => setTabValue(index)}
                  className={`px-4 sm:px-8 py-3 sm:py-4 font-light transition-colors border-b-2 whitespace-nowrap ${
                    tabValue === index
                      ? "text-purple-400 border-purple-500 bg-gray-900/50"
                      : "text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-900/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <TabPanel value={tabValue} index={0}>
            <div className="p-3 sm:p-6">
              <h3 className="text-lg sm:text-xl font-light text-gray-200 mb-4 sm:mb-6">
                Problem Solving Distribution
              </h3>
              <div className="h-64 sm:h-80 md:h-96 bg-gray-900/30 rounded-lg p-2 sm:p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      bottom: 80,
                      left: 0,
                      right: 10,
                    }}
                  >
                    <XAxis
                      dataKey="tagName"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      tickMargin={5}
                    />
                    <YAxis
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#f3f4f6",
                      }}
                    />
                    <Bar dataKey="problemsSolved" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <div className="p-3 sm:p-6">
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-4 font-light text-gray-300 text-sm sm:text-base">
                        Category
                      </th>
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-4 font-light text-gray-300 text-sm sm:text-base">
                        Tag
                      </th>
                      <th className="text-right py-3 sm:py-4 px-3 sm:px-4 font-light text-gray-300 text-sm sm:text-base">
                        Concepts Included
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data).flatMap(([category, tags]) =>
                      tags.map((tag) => (
                        <tr
                          key={`${category}-${tag.tagName}`}
                          className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors"
                        >
                          <td className="py-2 sm:py-4 px-3 sm:px-4 text-gray-400 capitalize font-light text-sm sm:text-base">
                            {category}
                          </td>
                          <td className="py-2 sm:py-4 px-3 sm:px-4 text-gray-200 font-light text-sm sm:text-base">
                            {tag.tagName}
                          </td>
                          <td className="py-2 sm:py-4 px-3 sm:px-4 text-right text-purple-400 font-light text-sm sm:text-base">
                            {tag.problemsSolved}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabPanel>
        </div>
        <LeetCodeLevelCard leetcodeData={currentData} />
      </div>
    </div>
  );
};

export default LeetCodeDashboard;
