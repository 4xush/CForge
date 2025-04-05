import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardHeader, CardContent } from '../ui/card';
import { AlertCircle } from 'lucide-react';

const PlatformStatsCard = ({ platform, stats, icon: Icon, color, isLoading, error, onRetry }) => {
    // Create appropriate URL
    const profileUrl = stats?.username
        ? {
            LeetCode: `https://leetcode.com/${stats.username}`,
            Codeforces: `https://codeforces.com/profile/${stats.username}`,
            GitHub: `https://github.com/${stats.username}`,
        }[platform] || "#"
        : "#";

    // Different states of the card
    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader className="space-y-2">
                    <div className="flex items-center space-x-2">
                        {Icon && <Icon className={`h-6 w-6 ${color}`} />}
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-24" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                                <Skeleton className="h-6 w-16 mx-auto mt-2" />
                                <Skeleton className="h-4 w-12 mx-auto mt-1" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full bg-red-900/10 border-red-500/30">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {Icon && <Icon className="h-6 w-6 text-red-400 mr-2" />}
                            <h3 className="text-lg font-medium text-white">{platform}</h3>
                        </div>
                        <div className="flex items-center text-red-400">
                            <AlertCircle className="h-5 w-5 mr-1" />
                            <span className="text-sm">Connection Error</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-300 mb-4">
                        We couldn't load your {platform} stats. This could be due to:
                    </p>
                    <ul className="text-sm text-gray-400 list-disc pl-5 mb-4">
                        <li>Network connection issues</li>
                        <li>Invalid or changed username</li>
                        <li>Platform API unavailable</li>
                    </ul>
                    <button 
                        onClick={onRetry}
                        className="w-full text-white bg-gray-700 hover:bg-gray-600 py-2 rounded-md transition-colors"
                    >
                        Retry
                    </button>
                </CardContent>
            </Card>
        );
    }

    // Normal render with actual data
    return (
        <Card 
            className="w-full cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => profileUrl !== "#" && window.open(profileUrl, "_blank")}
        >
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {Icon && <Icon className={`h-6 w-6 ${color} mr-2`} />}
                        <h3 className="text-lg font-medium text-white">{platform}</h3>
                    </div>
                    <span className="text-sm text-gray-400">@{stats.username}</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4">
                    {Object.entries(stats).map(([key, value]) => {
                        if (key === 'username') return null;
                        return (
                            <div key={key} className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-white">{value}</div>
                                <div className="text-sm text-gray-400 mt-1">
                                    {key.split(/(?=[A-Z])/).join(' ')}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default PlatformStatsCard; 