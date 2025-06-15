import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Code2, Github, Trophy,
    BarChart2, RefreshCw, Award, TrendingUp,
    AlertCircle, X
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuthContext } from '../context/AuthContext';
import { ProfileHeader } from './Profile/ProfileHeader';
import { PlatformCard, getPlatformStats } from './Profile/PlatformCards';
import ActivityHeatmap from './Profile/ActivityHeatmap';
import { useHeatmapData } from '../hooks/useHeatmapData';
import LeetCodeDashboard from './Profile/LeetCodeDashboard';

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

TabButton.propTypes = {
    active: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType.isRequired,
    children: PropTypes.node.isRequired
};

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

RefreshButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    refreshing: PropTypes.bool.isRequired
};

const PlatformVerificationModal = ({ user, onClose }) => {
    const navigate = useNavigate();
    const platformUsernames = {
        leetcode: user?.platforms?.leetcode?.username,
        codeforces: user?.platforms?.codeforces?.username,
        github: user?.platforms?.github?.username
    };

    const getPlatformIcon = (platform) => {
        switch (platform) {
            case 'leetcode':
                return <Code2 className="w-5 h-5 text-yellow-400" />;
            case 'codeforces':
                return <TrendingUp className="w-5 h-5 text-red-500" />;
            case 'github':
                return <Github className="w-5 h-5 text-blue-400" />;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-yellow-400" />
                        <h2 className="text-xl font-bold text-white">Verify Your Platform Usernames</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-gray-400 mb-6">
                    Please verify your coding platform usernames to ensure accurate stats tracking.
                </p>

                <div className="space-y-3 mb-6">
                    {Object.entries(platformUsernames).map(([platform, username]) => (
                        <div
                            key={platform}
                            className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                {getPlatformIcon(platform)}
                                <div>
                                    <p className="text-white font-medium capitalize">{platform}</p>
                                    <p className="text-sm text-gray-400">
                                        {username || 'Not set'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/settings?tab=platforms')}
                                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                            >
                                {username ? 'Update' : 'Add'}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    >
                        Remind me later
                    </button>
                </div>
            </div>
        </div>
    );
};

PlatformVerificationModal.propTypes = {
    user: PropTypes.shape({
        email: PropTypes.string,
        platforms: PropTypes.shape({
            leetcode: PropTypes.shape({
                username: PropTypes.string
            }),
            codeforces: PropTypes.shape({
                username: PropTypes.string
            }),
            github: PropTypes.shape({
                username: PropTypes.string
            })
        })
    }),
    onClose: PropTypes.func.isRequired
};

// Error boundary component for heatmap
const HeatmapErrorBoundary = ({ children, platform, error, onRetry }) => {
    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-32 text-center p-4">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-red-400 font-bold mb-1">
                    Failed to load {platform} activity
                </p>
                <p className="text-gray-400 text-sm mb-3">
                    Unable to fetch activity data
                </p>
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return children;
};

HeatmapErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    platform: PropTypes.string.isRequired,
    error: PropTypes.string,
    onRetry: PropTypes.func.isRequired
};

const UserProfile = () => {
    // Use AuthContext instead of making separate API calls
    const { authUser: user, isLoading: authLoading, refreshPlatformData } = useAuthContext();

    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const navigate = useNavigate();

    // Check if verification modal should be shown
    useEffect(() => {
        if (user?.email) {
            const modalShown = localStorage.getItem(`platform_usernameCheck_${user.email}`);
            if (!modalShown) {
                setShowVerificationModal(true);
            }
        }
    }, [user?.email]);

    // Modified heatmap data hook call
    const { 
        data: heatmapData, 
        loading: heatmapLoading, 
        error: heatmapError,
        refetch: refetchHeatmap
    } = useHeatmapData(user?.username);

    // Use AuthContext's refreshPlatformData method
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // Try to refresh platform data first
            await refreshPlatformData(true);
            // Retry heatmap
            refetchHeatmap();
        } catch (err) {
            console.error('Failed to refresh platform data:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleHeatmapRetry = () => {
        refetchHeatmap();
    };

    const handleCloseVerificationModal = () => {
        if (user?.email) {
            localStorage.setItem(`platform_usernameCheck_${user.email}`, 'true');
        }
        setShowVerificationModal(false);
    };

    // Handle auth loading state
    if (authLoading) {
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

    // Handle case where user is not authenticated
    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-purple">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-lg text-center">
                    <div className="text-gray-300 text-xl font-bold mb-4">Authentication Required</div>
                    <p className="text-gray-400">Please log in to view your profile.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl text-white font-bold transition-all"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // Handle incomplete profile
    if (!user.isProfileComplete) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-yellow-400" />
                            <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
                        </div>
                    </div>
                    <p className="text-gray-400 mb-6">
                        Please complete your profile by adding your LeetCode profile in the settings.
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => navigate('/settings?tab=platforms')}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-lg text-white font-medium transition-colors"
                        >
                            Complete Profile
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const leetcodeData = user.platforms?.leetcode;
    const platformStats = getPlatformStats(user);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple">
            {showVerificationModal && (
                <PlatformVerificationModal
                    user={user}
                    onClose={handleCloseVerificationModal}
                />
            )}
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="mb-8">
                    <ProfileHeader user={user} />
                </div>
                
                <div className="mt-8 mb-6">
                    <h1 className="text-3xl font-bold text-white">Welcome, {user.fullName}!</h1>
                    <p className="text-gray-400 mt-2">
                        Below are your coding details and activity statistics. 
                        Click the 'Refresh Data' button to retrieve the most recent updates.
                    </p>
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
                        <TabButton
                            active={activeTab === 'contests'}
                            onClick={() => navigate('/contests-central')}
                            icon={Trophy}
                        >
                            Contests Central
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
                            ].map(({ platform, data, icon: Icon, color }) => (
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
                                    
                                    <HeatmapErrorBoundary 
                                        platform={platform}
                                        error={heatmapError}
                                        onRetry={handleHeatmapRetry}
                                    >
                                        {heatmapLoading ? (
                                            <div className="flex justify-center items-center h-32">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 relative">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full animate-ping opacity-75"></div>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"></div>
                                                    </div>
                                                    <p className="text-gray-300 font-medium">Loading {platform} activity...</p>
                                                </div>
                                            </div>
                                        ) : data && Object.keys(data).length > 0 ? (
                                            <ActivityHeatmap
                                                data={data}
                                                platform={platform}
                                            />
                                        ) : (
                                            <div className="flex justify-center items-center h-32">
                                                <p className="text-gray-400">No activity data available for {platform}.</p>
                                            </div>
                                        )}
                                    </HeatmapErrorBoundary>
                                </div>
                            ))}
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