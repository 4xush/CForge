import { useNavigate } from 'react-router-dom';
import { Code2, Github } from 'lucide-react';
import { useMemo, useCallback } from 'react';
import { ProfileHeader } from './pulicUser/ProfileHeader';
import { PlatformCard, getPlatformStats } from './pulicUser/PlatformCards';
import ActivityHeatmap from '../components/Profile/ActivityHeatmap';
import { useHeatmapData } from '../hooks/useHeatmapData';
import { useUserProfile } from '../hooks/useUserProfile';

const UserProfile = () => {
    const navigate = useNavigate();
    const username = window.location.pathname.split('/').pop();

    // Memoize the onNotFound callback to prevent infinite re-renders
    const handleNotFound = useCallback(() => {
        navigate('/404');
    }, [navigate]);

    const {
        user,
        loading: userLoading,
        error: userError
    } = useUserProfile(username, {
        onNotFound: handleNotFound
    });

    const {
        data: heatmapData,
        loading: heatmapLoading,
        error: heatmapError
    } = useHeatmapData(username);

    // Memoize the heatmap data to prevent unnecessary re-renders
    const memoizedHeatmapData = useMemo(() => {
        if (!heatmapData) return null;
        
        return {
            leetcode: heatmapData.leetcode ? { ...heatmapData.leetcode } : null,
            github: heatmapData.github ? { ...heatmapData.github } : null,
            codeforces: heatmapData.codeforces ? { ...heatmapData.codeforces } : null
        };
    }, [heatmapData]);

    if (userLoading || heatmapLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    if (userError) return <div className="text-center p-8">{userError}</div>;
    if (heatmapError) return <div className="text-center p-8">Failed to load activity data</div>;
    if (!user) return <div className="text-center p-8">User not found</div>;

    const platformStats = getPlatformStats(user);

    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-8">
            <ProfileHeader user={user} />

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
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

            <div className="grid grid-cols-1 gap-3 sm:gap-6">
                {memoizedHeatmapData?.leetcode && Object.keys(memoizedHeatmapData.leetcode).length > 0 && (
                    <div className="flex justify-center overflow-x-auto">
                        <ActivityHeatmap
                            data={memoizedHeatmapData.leetcode}
                            platform="leetcode"
                        />
                    </div>
                )}
                {memoizedHeatmapData?.github && Object.keys(memoizedHeatmapData.github).length > 0 && (
                    <div className="flex justify-center overflow-x-auto">
                        <ActivityHeatmap
                            data={memoizedHeatmapData.github}
                            platform="github"
                        />
                    </div>
                )}
                {memoizedHeatmapData?.codeforces && Object.keys(memoizedHeatmapData.codeforces).length > 0 && (
                    <div className="flex justify-center overflow-x-auto">
                        <ActivityHeatmap
                            data={memoizedHeatmapData.codeforces}
                            platform="codeforces"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;