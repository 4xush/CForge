import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BookOpen, Brain, Code, RotateCw, AlertCircle, Trophy, Calendar, Target, User } from 'lucide-react';

const TabPanel = ({ children, value, index, ...other }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && (
                <div className="pt-6">
                    {children}
                </div>
            )}
        </div>
    );
};

const LeetCodeDashboard = ({ leetcodeData, nestedUsername }) => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Use actual data or fallback
    const data = leetcodeData || {
        "questionsSolvedByDifficulty": {
            "easy": 152,
            "medium": 196,
            "hard": 17
        },
        "username": "codeayush_",
        "totalQuestionsSolved": 365,
        "attendedContestsCount": 36,
        "contestRating": 1465,
        "isValid": true,
        "lastValidationCheck": "2025-05-30T22:07:04.628Z"
    };

    const username = nestedUsername || data.username || "User";

    const refreshStats = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error || !data.isValid) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 max-w-md">
                    <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle size={20} />
                        <span>{error || "Invalid user data"}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare difficulty data for charts
    const difficultyData = [
        {
            name: 'Easy',
            value: data.questionsSolvedByDifficulty.easy,
            color: '#22c55e', // green-500
            percentage: ((data.questionsSolvedByDifficulty.easy / data.totalQuestionsSolved) * 100).toFixed(1)
        },
        {
            name: 'Medium',
            value: data.questionsSolvedByDifficulty.medium,
            color: '#f59e0b', // amber-500
            percentage: ((data.questionsSolvedByDifficulty.medium / data.totalQuestionsSolved) * 100).toFixed(1)
        },
        {
            name: 'Hard',
            value: data.questionsSolvedByDifficulty.hard,
            color: '#ef4444', // red-500
            percentage: ((data.questionsSolvedByDifficulty.hard / data.totalQuestionsSolved) * 100).toFixed(1)
        }
    ];

    // Calculate contest performance level
    const getContestLevel = (rating) => {
        if (rating >= 2100) return { level: 'Expert', color: 'text-red-400' };
        if (rating >= 1900) return { level: 'Candidate Master', color: 'text-purple-400' };
        if (rating >= 1600) return { level: 'Specialist', color: 'text-blue-400' };
        if (rating >= 1400) return { level: 'Pupil', color: 'text-green-400' };
        return { level: 'Newbie', color: 'text-gray-400' };
    };

    const contestLevel = getContestLevel(data.contestRating);
    const lastUpdated = new Date(data.lastValidationCheck).toLocaleDateString();

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-light text-gray-100 mb-1">
                            {username}
                        </h1>
                        <p className="text-gray-400 font-light">LeetCode Progress Dashboard</p>
                        <p className="text-xs text-gray-500 mt-1">Last updated: {lastUpdated}</p>
                    </div>
                    <button
                        onClick={refreshStats}
                        className="p-3 hover:bg-gray-800 rounded-full transition-colors border border-gray-700 hover:border-purple-500"
                        title="Refresh stats"
                    >
                        <RotateCw size={18} className="text-gray-400 hover:text-purple-400" />
                    </button>
                </div>

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-light text-gray-300">
                                Total Solved
                            </h3>
                            <Target size={20} className="text-purple-400" />
                        </div>
                        <div className="text-3xl font-light text-gray-100 mb-1">
                            {data.totalQuestionsSolved}
                        </div>
                        <p className="text-sm text-gray-500">
                            Problems
                        </p>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-light text-gray-300">
                                Contest Rating
                            </h3>
                            <Trophy size={20} className="text-purple-400" />
                        </div>
                        <div className="text-3xl font-light text-gray-100 mb-1">
                            {data.contestRating}
                        </div>
                        <p className={`text-sm ${contestLevel.color}`}>
                            {contestLevel.level}
                        </p>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-light text-gray-300">
                                Contests
                            </h3>
                            <Calendar size={20} className="text-purple-400" />
                        </div>
                        <div className="text-3xl font-light text-gray-100 mb-1">
                            {data.attendedContestsCount}
                        </div>
                        <p className="text-sm text-gray-500">
                            Attended
                        </p>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-light text-gray-300">
                                Best Category
                            </h3>
                            <Brain size={20} className="text-purple-400" />
                        </div>
                        <div className="text-3xl font-light text-gray-100 mb-1">
                            {Math.max(...Object.values(data.questionsSolvedByDifficulty))}
                        </div>
                        <p className="text-sm text-gray-500">
                            {Object.entries(data.questionsSolvedByDifficulty)
                                .reduce((a, b) => data.questionsSolvedByDifficulty[a] > data.questionsSolvedByDifficulty[b[0]] ? a : b[0], 'easy')
                                .charAt(0).toUpperCase() + Object.entries(data.questionsSolvedByDifficulty)
                                .reduce((a, b) => data.questionsSolvedByDifficulty[a] > data.questionsSolvedByDifficulty[b[0]] ? a : b[0], 'easy')
                                .slice(1)}
                        </p>
                    </div>
                </div>

                {/* Difficulty Distribution Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {difficultyData.map((item) => (
                        <div 
                            key={item.name}
                            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-light text-gray-300">
                                    {item.name}
                                </h3>
                                <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                ></div>
                            </div>
                            <div className="text-3xl font-light text-gray-100 mb-1">
                                {item.value}
                            </div>
                            <p className="text-sm text-gray-500">
                                {item.percentage}% of total
                            </p>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-800">
                        <div className="flex">
                            {['Overview', 'Difficulty Analysis'].map((label, index) => (
                                <button
                                    key={label}
                                    onClick={() => setTabValue(index)}
                                    className={`px-8 py-4 font-light transition-colors border-b-2 ${
                                        tabValue === index
                                            ? 'text-purple-400 border-purple-500 bg-gray-900/50'
                                            : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-900/30'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <TabPanel value={tabValue} index={0}>
                        <div className="p-6">
                            <h3 className="text-xl font-light text-gray-200 mb-6">
                                Problem Distribution by Difficulty
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Bar Chart */}
                                <div className="bg-gray-900/30 rounded-lg p-4">
                                    <h4 className="text-lg font-light text-gray-300 mb-4">Bar Chart</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={difficultyData}>
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                />
                                                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                                <Tooltip 
                                                    contentStyle={{
                                                        backgroundColor: '#1f2937',
                                                        border: '1px solid #374151',
                                                        borderRadius: '8px',
                                                        color: '#f3f4f6'
                                                    }}
                                                />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                    {difficultyData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Pie Chart */}
                                <div className="bg-gray-900/30 rounded-lg p-4">
                                    <h4 className="text-lg font-light text-gray-300 mb-4">Distribution</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={difficultyData}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    dataKey="value"
                                                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                                                >
                                                    {difficultyData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{
                                                        backgroundColor: '#1f2937',
                                                        border: '1px solid #374151',
                                                        borderRadius: '8px',
                                                        color: '#f3f4f6'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left py-4 px-2 font-light text-gray-300">Difficulty</th>
                                            <th className="text-right py-4 px-2 font-light text-gray-300">Problems Solved</th>
                                            <th className="text-right py-4 px-2 font-light text-gray-300">Percentage</th>
                                            <th className="text-center py-4 px-2 font-light text-gray-300">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {difficultyData.map((item) => (
                                            <tr 
                                                key={item.name}
                                                className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors"
                                            >
                                                <td className="py-4 px-2 text-gray-200 font-light flex items-center gap-3">
                                                    <div 
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: item.color }}
                                                    ></div>
                                                    {item.name}
                                                </td>
                                                <td className="py-4 px-2 text-right text-gray-100 font-light">
                                                    {item.value}
                                                </td>
                                                <td className="py-4 px-2 text-right text-purple-400 font-light">
                                                    {item.percentage}%
                                                </td>
                                                <td className="py-4 px-2">
                                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                                        <div 
                                                            className="h-2 rounded-full transition-all duration-300"
                                                            style={{ 
                                                                width: `${item.percentage}%`,
                                                                backgroundColor: item.color
                                                            }}
                                                        ></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabPanel>
                </div>

                {/* Achievement Summary */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-xl font-light text-gray-200 mb-4">
                        Achievement Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-light text-purple-400 mb-1">
                                {data.totalQuestionsSolved}
                            </div>
                            <p className="text-sm text-gray-500">Total Solutions</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-light text-green-400 mb-1">
                                {data.questionsSolvedByDifficulty.easy}
                            </div>
                            <p className="text-sm text-gray-500">Easy Problems</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-light text-amber-400 mb-1">
                                {data.questionsSolvedByDifficulty.medium}
                            </div>
                            <p className="text-sm text-gray-500">Medium Problems</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-light text-red-400 mb-1">
                                {data.questionsSolvedByDifficulty.hard}
                            </div>
                            <p className="text-sm text-gray-500">Hard Problems</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeetCodeDashboard;