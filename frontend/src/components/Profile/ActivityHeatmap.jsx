import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '../ui/Alert';

const ActivityHeatmap = ({ data, platform }) => {
    
    // Handle the case where data is invalid or missing
    if (!data || (Array.isArray(data) && data.length === 0) || 
        (typeof data === 'object' && Object.keys(data).length === 0)) {
        return (
            <Alert variant="warning" className="w-full max-w-4xl bg-gray-800 text-gray-100 border-yellow-600">
                <AlertDescription className="flex justify-between items-center">
                    <span>No activity data available for {platform}.</span>
                    <button 
                        onClick={() => window.location.href = "/settings?tab=platforms"} 
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                    >
                        Update platform info
                    </button>
                </AlertDescription>
            </Alert>
        );
    }
    
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Ref for the scrollable container
    const scrollRef = useRef(null);

    // Get month labels
    const months = [];
    const currentMonth = new Date(oneYearAgo);
    while (currentMonth <= today) {
        months.push(new Date(currentMonth));
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Create array of all dates in the last year
    const dates = [];
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
    }

    // Group dates by week for GitHub-style layout
    const weeks = [];
    let currentWeek = [];
    dates.forEach(date => {
        if (date.getDay() === 0 && currentWeek.length) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(date);
    });
    if (currentWeek.length) weeks.push(currentWeek);

    // Format data based on platform
    const formatData = () => {
        if (!data) return new Map();
        const contributionMap = new Map();

        if (platform === 'leetcode') {
            Object.entries(data).forEach(([timestamp, count]) => {
                const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];
                contributionMap.set(date, count);
            });
        } else {
            data.forEach(({ date, count }) => {
                contributionMap.set(date, count);
            });
        }
        return contributionMap;
    };

    const contributionMap = formatData();
    const maxContributions = Math.max(...Array.from(contributionMap.values(), v => v || 0));

    const getColor = (count) => {
        if (!count) return 'bg-gray-800';
        const intensity = Math.min(1, count / (maxContributions || 1));
        const levels = [
            'bg-gray-800',
            'bg-green-900',
            'bg-green-700',
            'bg-green-500',
            'bg-green-400'
        ];
        const level = Math.ceil(intensity * (levels.length - 1));
        return levels[level];
    };

    const formatTooltip = (date, count) => {
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        return `${count || 0} contributions on ${formattedDate}`;
    };

    const getDayLabel = (index) => {
        const days = ['Mon', 'Wed', 'Fri'];
        return days[index];
    };

    // Scroll to the rightmost edge on mount and when data changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [data]);

    return (
        <Card className="w-full max-w-5xl bg-gray-900 text-gray-100">
            <CardHeader>
                <CardTitle className="text-lg">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)} Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    ref={scrollRef}
                    className="overflow-x-auto"
                >
                    <div className="relative">
                        {/* Month labels */}
                        <div className="flex mb-2 text-sm text-gray-400">
                            <div className="w-8" />
                            {months.map((month, i) => (
                                <div
                                    key={i}
                                    className="flex-1 text-center"
                                    style={{ minWidth: '20px' }}
                                >
                                    {month.toLocaleDateString('en-US', { month: 'short' })}
                                </div>
                            ))}
                        </div>

                        <div className="flex">
                            <div className="pr-2">
                                {[0, 2, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="h-3 text-xs text-gray-400"
                                        style={{ marginTop: i === 0 ? '0' : '9px' }}
                                    >
                                        {getDayLabel(Math.floor(i / 2))}
                                    </div>
                                ))}
                            </div>

                            <div className="inline-grid grid-flow-col gap-1">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="grid grid-rows-7 gap-1">
                                        {week.map(date => {
                                            const dateStr = date.toISOString().split('T')[0];
                                            const count = contributionMap.get(dateStr) || 0;
                                            return (
                                                <div
                                                    key={dateStr}
                                                    className={`w-3 h-3 rounded-sm ${getColor(count)} transition-colors duration-200 hover:opacity-75`}
                                                    title={formatTooltip(date, count)}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex items-center text-sm text-gray-400">
                            <span className="mr-2">Less</span>
                            {[0, 1, 2, 3, 4].map((level) => (
                                <div
                                    key={level}
                                    className={`w-3 h-3 mx-1 rounded-sm ${getColor(level * (maxContributions / 4))}`}
                                />
                            ))}
                            <span className="ml-2">More</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
ActivityHeatmap.propTypes = {
    data: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object
    ]).isRequired,
    platform: PropTypes.string.isRequired
};

export default ActivityHeatmap;