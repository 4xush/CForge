import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BookOpen, Brain, Code, RotateCw, AlertCircle } from 'lucide-react';

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
    const username = nestedUsername || "johndoe";
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Mock data for demonstration
    const data = {
        advanced: [
            { tagName: "Dynamic Programming", problemsSolved: 45 },
            { tagName: "Graph Theory", problemsSolved: 32 },
            { tagName: "Backtracking", problemsSolved: 28 },
            { tagName: "Divide & Conquer", problemsSolved: 18 }
        ],
        intermediate: [
            { tagName: "Binary Search", problemsSolved: 52 },
            { tagName: "Two Pointers", problemsSolved: 38 },
            { tagName: "Sliding Window", problemsSolved: 31 },
            { tagName: "Hash Table", problemsSolved: 47 }
        ],
        fundamental: [
            { tagName: "Array", problemsSolved: 89 },
            { tagName: "String", problemsSolved: 67 },
            { tagName: "Linked List", problemsSolved: 41 },
            { tagName: "Stack & Queue", problemsSolved: 35 }
        ]
    };

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

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 max-w-md">
                    <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate totals
    const totalProblems = {
        advanced: data.advanced.reduce((acc, curr) => acc + curr.problemsSolved, 0),
        intermediate: data.intermediate.reduce((acc, curr) => acc + curr.problemsSolved, 0),
        fundamental: data.fundamental.reduce((acc, curr) => acc + curr.problemsSolved, 0)
    };

    // Color schemes - Purple theme
    const categoryColors = {
        advanced: '#a855f7',    // purple-500
        intermediate: '#8b5cf6', // violet-500  
        fundamental: '#c084fc'   // purple-400
    };

    const getCategoryIcon = (category) => {
        const iconProps = { size: 20, className: "text-purple-400" };
        switch (category) {
            case 'advanced': return <Brain {...iconProps} />;
            case 'intermediate': return <Code {...iconProps} />;
            case 'fundamental': return <BookOpen {...iconProps} />;
            default: return null;
        }
    };

    // Prepare chart data
    const chartData = Object.entries(data).flatMap(([category, tags]) =>
        tags.map(tag => ({
            ...tag,
            category,
            color: categoryColors[category]
        }))
    );

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
                    </div>
                    <button
                        onClick={refreshStats}
                        className="p-3 hover:bg-gray-800 rounded-full transition-colors border border-gray-700 hover:border-purple-500"
                        title="Refresh stats"
                    >
                        <RotateCw size={18} className="text-gray-400 hover:text-purple-400" />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(totalProblems).map(([category, total]) => (
                        <div 
                            key={category}
                            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-purple-500/30 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-light text-gray-300 capitalize">
                                    {category}
                                </h3>
                                {getCategoryIcon(category)}
                            </div>
                            <div className="text-3xl font-light text-gray-100 mb-1">
                                {total}
                            </div>
                            <p className="text-sm text-gray-500">
                                Problems Solved
                            </p>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-800">
                        <div className="flex">
                            {['Overview', 'Detailed Stats'].map((label, index) => (
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
                                Problem Distribution
                            </h3>
                            <div className="h-96 bg-gray-900/30 rounded-lg p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ bottom: 80 }}>
                                        <XAxis
                                            dataKey="tagName"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            interval={0}
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
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left py-4 px-2 font-light text-gray-300">Category</th>
                                            <th className="text-left py-4 px-2 font-light text-gray-300">Topic</th>
                                            <th className="text-right py-4 px-2 font-light text-gray-300">Problems Solved</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(data).flatMap(([category, tags]) =>
                                            tags.map((tag, index) => (
                                                <tr 
                                                    key={`${category}-${tag.tagName}`}
                                                    className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors"
                                                >
                                                    <td className="py-4 px-2 text-gray-400 capitalize font-light">
                                                        {category}
                                                    </td>
                                                    <td className="py-4 px-2 text-gray-200 font-light">
                                                        {tag.tagName}
                                                    </td>
                                                    <td className="py-4 px-2 text-right text-purple-400 font-light">
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

                {/* Additional Stats Card */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-xl font-light text-gray-200 mb-4">
                        Progress Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-light text-purple-400 mb-1">
                                {Object.values(totalProblems).reduce((a, b) => a + b, 0)}
                            </div>
                            <p className="text-sm text-gray-500">Total Problems</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-light text-purple-400 mb-1">
                                {Object.keys(data).reduce((acc, cat) => acc + data[cat].length, 0)}
                            </div>
                            <p className="text-sm text-gray-500">Topics Covered</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-light text-purple-400 mb-1">
                                {Math.max(...Object.entries(data).flatMap(([_, tags]) => tags.map(t => t.problemsSolved)))}
                            </div>
                            <p className="text-sm text-gray-500">Best Topic Score</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeetCodeDashboard;