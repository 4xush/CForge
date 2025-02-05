import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Code2, Github, RotateCw, User, Trophy, ChevronDown,
    BarChart2, RefreshCw, Calendar, Star
} from 'lucide-react';
import ApiService from '../services/ApiService';
import { ProfileHeader } from './Profile/ProfileHeader';
import { PlatformCard, getPlatformStats } from './Profile/PlatformCards';
import ActivityHeatmap from './Profile/ActivityHeatmap';
import { useHeatmapData } from '../hooks/useHeatmapData';
import LeetCodeDashboard from './Profile/LeetCodeDashboard';

const TabButton = ({ active, onClick, icon: Icon, children }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl 
            transition-all duration-300 ease-in-out transform hover:scale-105
            ${active
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }
        `}
    >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
    </button>
);

const RefreshButton = ({ onClick, refreshing }) => (
    <button
        onClick={onClick}
        disabled={refreshing}
        className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            transition-all duration-300 ease-in-out transform hover:scale-105
            ${refreshing
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg'
            }
        `}
    >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
    </button>
);

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    const fetchProfile = async () => {
        try {
            const response = await ApiService.get('users/profile');
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

    useEffect(() => {
        fetchProfile();
    }, [navigate]);

    const { data: heatmapData, loading: heatmapLoading, error: heatmapError } = useHeatmapData(user?.username);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await ApiService.put('users/platform/refresh');
            await fetchProfile();
        } catch (err) {
            setError('Failed to refresh platform data. Please try again later.');
        } finally {
            setRefreshing(false);
        }
    };

    const combinedLoading = loading || heatmapLoading;

    if (combinedLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900">
                <div className="animate-pulse">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"></div>
                </div>
            </div>
        );
    }

    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
    if (!user) return <div className="text-center p-8 text-gray-400">User not found</div>;
    if (heatmapError) return <div className="text-center p-8 text-red-500">Failed to load activity data</div>;

    const leetcodeData = user.platforms.leetcode;
    const platformStats = getPlatformStats(user);

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-7xl mx-auto bg-gray-800 overflow-hidden">
                <div className="p-4">
                    <ProfileHeader user={user} />

                    <div className="mt-8 mb-6 flex justify-between items-center">
                        <div className="flex space-x-4">
                            <TabButton
                                active={activeTab === 'overview'}
                                onClick={() => setActiveTab('overview')}
                                icon={BarChart2}
                            >
                                Overview
                            </TabButton>
                            <TabButton
                                active={activeTab === 'leetcode'}
                                onClick={() => setActiveTab('leetcode')}
                                icon={Code2}
                            >
                                LeetCode Stats
                            </TabButton>
                        </div>

                        <RefreshButton
                            onClick={handleRefresh}
                            refreshing={refreshing}
                        />
                    </div>

                    {activeTab === 'overview' ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <PlatformCard
                                    platform="LeetCode"
                                    stats={platformStats.leetcode}
                                    icon={Code2}
                                    color="text-yellow-500"
                                    className="bg-gray-800 border border-gray-700 transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                                />
                                <PlatformCard
                                    platform="Codeforces"
                                    stats={platformStats.codeforces}
                                    icon={Code2}
                                    color="text-red-500"
                                    className="bg-gray-800 border border-gray-700 transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                                />
                                <PlatformCard
                                    platform="GitHub"
                                    stats={platformStats.github}
                                    icon={Github}
                                    color="text-blue-400"
                                    className="bg-gray-800 border border-gray-700 transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {[
                                    { platform: 'leetcode', data: heatmapData?.leetcode },
                                    { platform: 'github', data: heatmapData?.github },
                                    { platform: 'codeforces', data: heatmapData?.codeforces }
                                ].map(({ platform, data }) =>
                                    data && Object.keys(data).length > 0 && (
                                        <div
                                            key={platform}
                                            className="bg-gray-800 border border-gray-700 rounded-xl shadow-md p-6 transform transition-all duration-300 hover:shadow-xl"
                                        >
                                            <h3 className="text-lg font-semibold mb-4 text-gray-200 capitalize">
                                                {platform} Activity
                                            </h3>
                                            <ActivityHeatmap
                                                data={data}
                                                platform={platform}
                                            />
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg overflow-hidden">
                            <LeetCodeDashboard
                                leetcodeData={leetcodeData}
                                nestedUsername={user?.username}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;