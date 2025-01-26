import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Github } from 'lucide-react';
import ApiService from '../services/ApiService';
import { ProfileHeader } from './profile/ProfileHeader';
import { PlatformCard, getPlatformStats } from './profile/PlatformCards';
import ActivityHeatmap from './profile/ActivityHeatmap';
import { useHeatmapData } from '../hooks/useHeatmapData';
import LeetCodeDashboard from '../components/profile/LeetCodeDashboard';

const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-medium rounded-lg transition-colors ${active
            ? 'bg-yellow-100 text-yellow-700'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
    >
        {children}
    </button>
);


const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();
    const username = window.location.pathname.split('/').pop();
    const { data: heatmapData, loading: heatmapLoading, error: heatmapError } = useHeatmapData(username);

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

    if (loading || heatmapLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    const leetcodeData = user.platforms.leetcode;
    // console.log(leetcodeData);
    if (error) return <div className="text-center p-8">{error}</div>;
    if (heatmapError) return <div className="text-center p-8">Failed to load activity data</div>;
    if (!user) return <div className="text-center p-8">User not found</div>;

    const platformStats = getPlatformStats(user);

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-8">
            <ProfileHeader user={user} />

            <div className="flex space-x-4 mb-6">
                <TabButton
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </TabButton>
                <TabButton
                    active={activeTab === 'leetcode'}
                    onClick={() => setActiveTab('leetcode')}
                >
                    LeetCode Stats
                </TabButton>
            </div>

            {activeTab === 'overview' ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <PlatformCard
                            platform="LeetCode"
                            stats={platformStats.leetcode}
                            icon={Code2}
                            color="text-yellow-500"
                        />
                        <PlatformCard
                            platform="Codeforces"
                            stats={platformStats.codeforces}
                            icon={Code2}
                            color="text-red-500"
                        />
                        <PlatformCard
                            platform="GitHub"
                            stats={platformStats.github}
                            icon={Github}
                            color="text-gray-700"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {heatmapData?.leetcode && Object.keys(heatmapData.leetcode).length > 0 && (
                            <div className="flex justify-center">
                                <ActivityHeatmap
                                    data={heatmapData.leetcode}
                                    platform="leetcode"
                                />
                            </div>
                        )}
                        {heatmapData?.github && heatmapData.github.length > 0 && (
                            <div className="flex justify-center">
                                <ActivityHeatmap
                                    data={heatmapData.github}
                                    platform="github"
                                />
                            </div>
                        )}
                        {heatmapData?.codeforces && heatmapData.codeforces.length > 0 && (
                            <div className="flex justify-center">
                                <ActivityHeatmap
                                    data={heatmapData.codeforces}
                                    platform="codeforces"
                                />
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <LeetCodeDashboard leetcodeData={leetcodeData} />
                </div>
            )}
        </div>
    );
};

export default UserProfile;