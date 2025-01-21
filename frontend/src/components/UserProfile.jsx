import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Github } from 'lucide-react';
import ApiService from '../services/ApiService';
import { ProfileHeader } from './profile/ProfileHeader';
import { PlatformCard, getPlatformStats } from './profile/PlatformCards';
import ActivityHeatmap from './profile/ActivityHeatmap';
import { useHeatmapData } from '../hooks/useHeatmapData';

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const username = window.location.pathname.split('/').pop();

    // Now we only need one call to get all heatmap data
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

    if (loading || heatmapLoading) return <div className="text-center p-8">Loading...</div>;
    if (error) return <div className="text-center p-8">{error}</div>;
    if (heatmapError) return <div className="text-center p-8">Failed to load activity data</div>;
    if (!user) return <div className="text-center p-8">User not found</div>;

    const platformStats = getPlatformStats(user);

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            <ProfileHeader user={user} />
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
        </div>
    );
};

export default UserProfile;