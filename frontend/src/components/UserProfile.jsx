import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import {
    Camera,
    Award,
    Book,
    Code2,
    Trophy,
    Medal,
    Star,
    User,
    Mail,
    GitBranch
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const PlatformCard = ({ platform, stats, icon: Icon, color }) => (
    <Card className="w-full">
        <CardHeader className="flex flex-row items-center space-x-2">
            <Icon className={`h-6 w-6 ${color}`} />
            <CardTitle className="text-xl">{platform}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {/* Username Section */}
                <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">@{stats.username || 'Not connected'}</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stats.metrics.map((metric, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                            {metric.icon}
                            <div className="text-2xl font-bold mt-2">{metric.value}</div>
                            <div className="text-sm text-gray-600">{metric.label}</div>
                        </div>
                    ))}
                </div>

                {/* Additional Platform-specific Content */}
                {stats.additionalContent}
            </div>
        </CardContent>
    </Card>
);

const ProfileHeader = ({ user }) => (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Profile Picture */}
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 p-1">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            {user?.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Camera className="h-12 w-12 text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{user?.fullName}</h2>
                        <p className="text-gray-500">@{user?.username}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                        <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">{user?.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <GitBranch className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Joined {new Date().getFullYear()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);

const UserInfo = () => {
    const { authUser } = useAuthContext();

    const leetcodeStats = {
        username: authUser?.platforms?.leetcode?.username,
        metrics: [
            {
                icon: <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />,
                value: authUser?.platforms?.leetcode?.contestRating || 0,
                label: 'Contest Rating'
            },
            {
                icon: <Book className="h-5 w-5 text-blue-500 mx-auto" />,
                value: authUser?.platforms?.leetcode?.totalQuestionsSolved || 0,
                label: 'Problems Solved'
            },
            {
                icon: <Medal className="h-5 w-5 text-purple-500 mx-auto" />,
                value: authUser?.platforms?.leetcode?.attendedContestsCount || 0,
                label: 'Contests'
            }
        ],
        additionalContent: (
            <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">
                        {authUser?.platforms?.leetcode?.questionsSolvedByDifficulty?.easy || 0}
                    </div>
                    <div className="text-sm text-gray-600">Easy</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-semibold text-yellow-600">
                        {authUser?.platforms?.leetcode?.questionsSolvedByDifficulty?.medium || 0}
                    </div>
                    <div className="text-sm text-gray-600">Medium</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-semibold text-red-600">
                        {authUser?.platforms?.leetcode?.questionsSolvedByDifficulty?.hard || 0}
                    </div>
                    <div className="text-sm text-gray-600">Hard</div>
                </div>
            </div>
        )
    };

    // Placeholder stats for future platforms
    const codeforcesStats = {
        username: null,
        metrics: [
            {
                icon: <Star className="h-5 w-5 text-gray-400 mx-auto" />,
                value: '-',
                label: 'Rating'
            },
            {
                icon: <Code2 className="h-5 w-5 text-gray-400 mx-auto" />,
                value: '-',
                label: 'Problems'
            },
            {
                icon: <Trophy className="h-5 w-5 text-gray-400 mx-auto" />,
                value: '-',
                label: 'Contests'
            }
        ],
        additionalContent: (
            <div className="text-center py-4 text-gray-500">
                Platform not connected
            </div>
        )
    };

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            {/* Profile Header */}
            <ProfileHeader user={authUser} />

            {/* Coding Platforms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlatformCard
                    platform="LeetCode"
                    stats={leetcodeStats}
                    icon={Code2}
                    color="text-yellow-500"
                />
                <PlatformCard
                    platform="Codeforces"
                    stats={codeforcesStats}
                    icon={Code2}
                    color="text-red-500"
                />
            </div>
        </div>
    );
};

export default UserInfo;