import React from 'react';
import { Trophy, Book, Medal, Layout, Users, User, Award, Star, Code2, Github, TrendingUp } from 'lucide-react';

export const PlatformCard = ({ platform, stats, icon: Icon, color, className = '' }) => {
    const profileUrl = stats.username
        ? {
            LeetCode: `https://leetcode.com/${stats.username}`,
            Codeforces: `https://codeforces.com/profile/${stats.username}`,
            GitHub: `https://github.com/${stats.username}`,
        }[platform] || "#"
        : "#"; // Default to "#" if no username

    return (
        <div
            className={`relative p-3 sm:p-6 rounded-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-lg ${className}`}
            onClick={() => profileUrl !== "#" && window.open(profileUrl, "_blank")}
        >
            <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-indigo-600 to-violet-600"></div>

            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />}
                <h3 className="text-lg sm:text-xl font-bold text-white">{platform}</h3>
            </div>

            <div className="space-y-2 sm:space-y-4">
                <div className="flex items-center space-x-1 sm:space-x-2">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    <span className="text-xs sm:text-sm text-gray-300">@{stats.username || 'Not connected'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {stats.metrics.map((metric, index) => (
                        <div
                            key={index}
                            className="bg-gray-800 p-2 sm:p-4 rounded-lg text-center border border-gray-700 hover:border-indigo-500 transition-all"
                        >
                            {/* metric.icon is already sized below */}
                            {React.cloneElement(metric.icon, { className: metric.icon.props.className.replace('h-5', 'h-4 sm:h-5').replace('w-5', 'w-4 sm:w-5') })}
                            <div className="text-base sm:text-xl font-bold mt-1 sm:mt-2 text-white">{metric.value}</div>
                            <div className="text-xs text-gray-400">{metric.label}</div>
                        </div>
                    ))}
                </div>

                {stats.additionalContent && (
                    <div className="mt-2 sm:mt-4">{stats.additionalContent}</div>
                )}
            </div>

            <div className="absolute bottom-0 right-0 opacity-10">
                {Icon && <Icon className="w-16 h-16 sm:w-24 sm:h-24 text-white" />}
            </div>
        </div>
    );
};


export const getPlatformStats = (user) => ({
    leetcode: {
        username: user?.platforms?.leetcode?.username,
        metrics: [
            {
                icon: <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mx-auto" />,
                value: user?.platforms?.leetcode?.contestRating || 0,
                label: 'Contest Rating'
            },
            {
                icon: <Book className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mx-auto" />,
                value: user?.platforms?.leetcode?.totalQuestionsSolved || 0,
                label: 'Problems Solved'
            },
            {
                icon: <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 mx-auto" />,
                value: user?.platforms?.leetcode?.attendedContestsCount || 0,
                label: 'Contests'
            }
        ],
        additionalContent: (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-2 sm:mt-4">
                <div className="text-center p-2 sm:p-3 bg-gray-800 border border-green-500 rounded-lg">
                    <div className="text-base sm:text-lg font-semibold text-green-400">
                        {user?.platforms?.leetcode?.questionsSolvedByDifficulty?.easy || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">Easy</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-800 border border-yellow-500 rounded-lg">
                    <div className="text-base sm:text-lg font-semibold text-yellow-400">
                        {user?.platforms?.leetcode?.questionsSolvedByDifficulty?.medium || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">Medium</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-800 border border-red-500 rounded-lg">
                    <div className="text-base sm:text-lg font-semibold text-red-400">
                        {user?.platforms?.leetcode?.questionsSolvedByDifficulty?.hard || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">Hard</div>
                </div>
            </div>
        )
    },
    codeforces: {
        username: user?.platforms?.codeforces?.username,
        metrics: [
            {
                icon: <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mx-auto" />,
                value: user?.platforms?.codeforces?.currentRating || 0,
                label: 'Current Rating'
            },
            {
                icon: <Award className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mx-auto" />,
                value: user?.platforms?.codeforces?.maxRating || 0,
                label: 'Max Rating'
            },
            {
                icon: <Star className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 mx-auto" />,
                value: user?.platforms?.codeforces?.contribution || 0,
                label: 'Contribution'
            }
        ],
        additionalContent: (
            <div className="text-center p-2 sm:p-4 bg-gray-800 border border-gray-600 rounded-lg mt-2 sm:mt-4 hover:border-indigo-500 transition-all">
                <div className="text-base sm:text-lg font-semibold text-white">
                    {user?.platforms?.codeforces?.rank || 'Unrated'}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">Current Rank</div>
            </div>
        )
    },
    github: {
        username: user?.platforms?.github?.username,
        metrics: [
            {
                icon: <Layout className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 mx-auto" />,
                value: user?.platforms?.github?.publicRepos || 0,
                label: 'Repositories'
            },
            {
                icon: <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mx-auto" />,
                value: user?.platforms?.github?.followers || 0,
                label: 'Followers'
            },
            {
                icon: <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mx-auto" />,
                value: user?.platforms?.github?.following || 0,
                label: 'Following'
            }
        ]
    }
});