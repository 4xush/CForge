import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Code2, Github, RotateCw, Trophy, ChevronDown,
    BarChart2, RefreshCw, Calendar, Star, Zap, Award, TrendingUp
} from 'lucide-react';
import ApiService from '../services/ApiService';
import { ProfileHeader } from './Profile/ProfileHeader';
import { PlatformCard, getPlatformStats } from './Profile/PlatformCards';
import ActivityHeatmap from './Profile/ActivityHeatmap';
import { useHeatmapData } from '../hooks/useHeatmapData';
import LeetCodeDashboard from './Profile/LeetCodeDashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/Button';

const TabButton = ({ active, onClick, icon: Icon, children }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl 
            transition-all duration-300 ease-in-out transform hover:scale-105
            ${active
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
            }
        `}
    >
        {Icon && <Icon className="w-5 h-5" />}
        {children}
    </button>
);

const RefreshButton = ({ onClick, refreshing }) => (
    <button
        onClick={onClick}
        disabled={refreshing}
        className={`
            flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold
            transition-all duration-300 ease-in-out transform hover:scale-105
            ${refreshing
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg'
            }
        `}
    >
        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
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
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-purple">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"></div>
                    </div>
                    <p className="text-gray-300 font-medium">Loading profile data...</p>
                </div>
            </div>
        );
    }

    if (error) return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-purple">
            <div className="bg-gray-800 border border-red-500 rounded-xl p-8 max-w-lg text-center">
                <div className="text-red-500 text-xl font-bold mb-4">Error Loading Profile</div>
                <p className="text-gray-300">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition-all"
                >
                    Try Again
                </button>
            </div>
        </div>
    );

    if (!user) return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-purple">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-lg text-center">
                <div className="text-gray-300 text-xl font-bold mb-4">User Not Found</div>
                <p className="text-gray-400">The requested profile could not be located.</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition-all"
                >
                    Return Home
                </button>
            </div>
        </div>
    );
    if (!user.isProfileComplete) {
        return (<Dialog>
            <DialogContent>
                <DialogTitle>Complete Your Profile</DialogTitle>
                <p>Please complete your profile by adding your LeetCode profile in the settings.</p>
                <Button onClick={navigate('/settings?tab=platforms')}>Complete Profile</Button>
            </DialogContent>
        </Dialog>);
    }

    if (heatmapError) return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-purple">
            <div className="bg-gray-800 border border-yellow-500 rounded-xl p-8 max-w-lg text-center">
                <div className="text-yellow-500 text-xl font-bold mb-4">Activity Data Unavailable</div>
                <p className="text-gray-300">Failed to load activity history. Your profile information is still available.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition-all"
                >
                    Try Again
                </button>
            </div>
        </div>
    );

    const leetcodeData = user.platforms.leetcode;
    const platformStats = getPlatformStats(user);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="mb-8">
                    <ProfileHeader user={user} />
                </div>
                <div className="mt-8 mb-6">
                    <h1 className="text-3xl font-bold text-white">Welcome, {user.fullName}!</h1>
                    <p className="text-gray-400 mt-2">Here are your coding details and activity stats:</p>
                </div>
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap gap-4">
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
                                icon={Trophy}
                                color="text-yellow-400"
                                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-indigo-500"
                            />
                            <PlatformCard
                                platform="Codeforces"
                                stats={platformStats.codeforces}
                                icon={Award}
                                color="text-red-500"
                                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-indigo-500"
                            />
                            <PlatformCard
                                platform="GitHub"
                                stats={platformStats.github}
                                icon={Github}
                                color="text-blue-400"
                                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-indigo-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {[
                                { platform: 'leetcode', data: heatmapData?.leetcode, icon: Code2, color: 'text-yellow-400' },
                                { platform: 'github', data: heatmapData?.github, icon: Github, color: 'text-blue-400' },
                                { platform: 'codeforces', data: heatmapData?.codeforces, icon: TrendingUp, color: 'text-red-500' }
                            ].map(({ platform, data, icon: Icon, color }) =>
                                data && Object.keys(data).length > 0 && (
                                    <div
                                        key={platform}
                                        className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl hover:border-indigo-500"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <Icon className={`w-6 h-6 ${color}`} />
                                            <h3 className="text-xl font-bold text-white capitalize">
                                                {platform} Activity
                                            </h3>
                                        </div>
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
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:border-indigo-500">
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex items-center gap-3">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                                <h3 className="text-xl font-bold text-white">
                                    LeetCode Dashboard
                                </h3>
                            </div>
                        </div>
                        <LeetCodeDashboard
                            leetcodeData={leetcodeData}
                            nestedUsername={user?.username}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;