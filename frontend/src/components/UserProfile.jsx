import React, { useState, useEffect } from 'react';
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
    GitBranch,
    Github,
    Layout,
    Users,
    Linkedin,
    Twitter
} from 'lucide-react';
import ApiService from '../services/ApiService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

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

const SocialLinks = ({ socialNetworks }) => {
    const { linkedin, twitter } = socialNetworks || {};

    if (!linkedin && !twitter) return null;

    return (
        <div className="flex space-x-4">
            {linkedin && (
                <a
                    href={`https://www.linkedin.com/in/${linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                >
                    <Linkedin className="h-5 w-5" />
                </a>
            )}
            {twitter && (
                <a
                    href={`https://twitter.com/${twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-500"
                >
                    <Twitter className="h-5 w-5" />
                </a>
            )}
        </div>
    );
};


const ProfileHeader = ({ user }) => (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
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
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <h2 className="text-2xl font-bold text-gray-900">{user?.fullName || 'Unknown User'}</h2>
                            <SocialLinks socialNetworks={user?.socialNetworks} />
                        </div>
                        <p className="text-gray-500">@{user?.username || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                        <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">{user?.email || 'Email not available'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <GitBranch className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">
                                Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown Date'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const username = window.location.pathname.split('/').pop();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await ApiService.get(`/u/${username}`);
                setUser(response.data);
            } catch (err) {
                if (err.response?.status === 404) {
                    navigate('/404');
                } else {
                    setError('Failed to fetch user profile. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username, navigate]);

    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (error) return <div className="text-center p-8">{error}</div>;
    if (!user) return <div className="text-center p-8">User not found</div>;

    const leetcodeStats = {
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
    };

    const codeforcesStats = {
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
    };

    const githubStats = {
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
    };

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            <ProfileHeader user={user} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <PlatformCard
                    platform="GitHub"
                    stats={githubStats}
                    icon={Github}
                    color="text-gray-700"
                />
            </div>
        </div>
    );
};

export default UserProfile;