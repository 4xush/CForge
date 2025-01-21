// src/components/profile/PlatformCards.jsx
import React from 'react';
import { Trophy, Book, Medal, Layout, Users, User, Award, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const PlatformCard = ({ platform, stats, icon: Icon, color }) => (
    <Card className="w-full">
        <CardHeader className="flex flex-row items-center space-x-2">
            <Icon className={`h-6 w-6 ${color}`} />
            <CardTitle className="text-xl">{platform}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">@{stats.username || 'Not connected'}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stats.metrics.map((metric, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                            {metric.icon}
                            <div className="text-2xl font-bold mt-2">{metric.value}</div>
                            <div className="text-sm text-gray-600">{metric.label}</div>
                        </div>
                    ))}
                </div>
                {stats.additionalContent}
            </div>
        </CardContent>
    </Card>
);

export const getPlatformStats = (user) => ({
    leetcode: {
        username: user?.platforms?.leetcode?.username,
        metrics: [
            {
                icon: <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />,
                value: user?.platforms?.leetcode?.contestRating || 0,
                label: 'Contest Rating'
            },
            {
                icon: <Book className="h-5 w-5 text-blue-500 mx-auto" />,
                value: user?.platforms?.leetcode?.totalQuestionsSolved || 0,
                label: 'Problems Solved'
            },
            {
                icon: <Medal className="h-5 w-5 text-purple-500 mx-auto" />,
                value: user?.platforms?.leetcode?.attendedContestsCount || 0,
                label: 'Contests'
            }
        ],
        additionalContent: (
            <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">
                        {user?.platforms?.leetcode?.questionsSolvedByDifficulty?.easy || 0}
                    </div>
                    <div className="text-sm text-gray-600">Easy</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-semibold text-yellow-600">
                        {user?.platforms?.leetcode?.questionsSolvedByDifficulty?.medium || 0}
                    </div>
                    <div className="text-sm text-gray-600">Medium</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-semibold text-red-600">
                        {user?.platforms?.leetcode?.questionsSolvedByDifficulty?.hard || 0}
                    </div>
                    <div className="text-sm text-gray-600">Hard</div>
                </div>
            </div>
        )
    },
    codeforces: {
        username: user?.platforms?.codeforces?.username,
        metrics: [
            {
                icon: <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />,
                value: user?.platforms?.codeforces?.currentRating || 0,
                label: 'Current Rating'
            },
            {
                icon: <Award className="h-5 w-5 text-blue-500 mx-auto" />,
                value: user?.platforms?.codeforces?.maxRating || 0,
                label: 'Max Rating'
            },
            {
                icon: <Star className="h-5 w-5 text-purple-500 mx-auto" />,
                value: user?.platforms?.codeforces?.contribution || 0,
                label: 'Contribution'
            }
        ],
        additionalContent: (
            <div className="text-center p-4 bg-gray-50 rounded-lg mt-4">
                <div className="text-lg font-semibold text-gray-700">
                    {user?.platforms?.codeforces?.rank || 'Unrated'}
                </div>
                <div className="text-sm text-gray-600">Current Rank</div>
            </div>
        )
    },
    github: {
        username: user?.platforms?.github?.username,
        metrics: [
            {
                icon: <Layout className="h-5 w-5 text-gray-700 mx-auto" />,
                value: user?.platforms?.github?.publicRepos || 0,
                label: 'Repositories'
            },
            {
                icon: <Users className="h-5 w-5 text-blue-500 mx-auto" />,
                value: user?.platforms?.github?.followers || 0,
                label: 'Followers'
            },
            {
                icon: <User className="h-5 w-5 text-green-500 mx-auto" />,
                value: user?.platforms?.github?.following || 0,
                label: 'Following'
            }
        ]
    }
});

export { PlatformCard };