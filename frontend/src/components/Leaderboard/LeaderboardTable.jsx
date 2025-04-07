import { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

export const LeaderboardTable = ({ 
    users = [], 
    page, 
    limit, 
    highlightedUserId, 
    onProfileClick,
    isLoading = false,
    error = null,
    sortBy = 'platforms.leetcode.totalQuestionsSolved',
    onSort = () => {},
    platform
}) => {
    const [sortConfig, setSortConfig] = useState({
        key: sortBy,
        direction: 'desc'
    });

    // Platform-specific column configurations
    const columnConfig = {
        leetcode: [
            { key: 'platforms.leetcode.totalQuestionsSolved', label: 'Total Solved' },
            { key: 'platforms.leetcode.questionsSolvedByDifficulty.easy', label: 'Easy', className: 'text-green-400' },
            { key: 'platforms.leetcode.questionsSolvedByDifficulty.medium', label: 'Medium', className: 'text-yellow-400' },
            { key: 'platforms.leetcode.questionsSolvedByDifficulty.hard', label: 'Hard', className: 'text-red-400' },
            { key: 'platforms.leetcode.attendedContestsCount', label: 'Contests' },
            { key: 'platforms.leetcode.contestRating', label: 'Rating' }
        ],
        codeforces: [
            { key: 'platforms.codeforces.currentRating', label: 'Current Rating' },
            { key: 'platforms.codeforces.maxRating', label: 'Max Rating' },
            { key: 'platforms.codeforces.rank', label: 'Rank' },
            { key: 'platforms.codeforces.maxRank', label: 'Max Rank' },
            { key: 'platforms.codeforces.contribution', label: 'Contribution' }
        ]
    };

    // Handle sort toggle
    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
        if (onSort) {
            onSort(key, direction);
        }
    };

    // Get sort indicator
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' 
            ? <ChevronUp className="h-4 w-4 ml-1" /> 
            : <ChevronDown className="h-4 w-4 ml-1" />;
    };

    // Get cell value safely
    const getCellValue = (user, key) => {
        const keys = key.split('.');
        let value = user;
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) return 0;
        }
        return value;
    };

    // Handle error display
    if (error) {
        return (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-lg text-center">
                <p>Failed to load leaderboard data</p>
                <p className="text-sm text-red-500 mt-2">{error}</p>
            </div>
        );
    }

    // Handle loading state
    if (isLoading && (!users || users.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="large" className="mb-4" />
                <p className="text-gray-400">Loading leaderboard data...</p>
            </div>
        );
    }

    // Display empty state
    if (!users || users.length === 0) {
        return (
            <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                <p className="text-gray-400">No data available in leaderboard</p>
            </div>
        );
    }

    // Only show top users in first page display
    const displayUsers = page === 1 ? users.slice(3) : users;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-800 text-left">
                        <th className="p-2 w-16">Place</th>
                        <th className="p-2">Person</th>
                        {columnConfig[platform].map(column => (
                            <th 
                                key={column.key}
                                className="p-2 cursor-pointer hover:bg-gray-700"
                                onClick={() => handleSort(column.key)}
                            >
                                <div className="flex items-center">
                                    {column.label}
                                    {getSortIcon(column.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayUsers.map((user, index) => {
                        const platformUsername = user.platforms?.[platform]?.username || 'Not Connected';
                        const rank = (page - 1) * limit + index + (page === 1 ? 4 : 1);
                        
                        return (
                            <tr
                                key={user._id}
                                id={`user-row-${user._id}`}
                                className={`border-b border-gray-700 transition-colors duration-300 hover:bg-gray-800/50
                                    ${user._id === highlightedUserId ? 'bg-blue-900/20 hover:bg-blue-900/30' : ''}`}
                            >
                                <td className="p-2 text-center">{rank}</td>
                                <td className="p-2">
                                    <div className="flex items-center">
                                        <div className="relative group">
                                            <img
                                                src={user.profilePicture || "/default-avatar.png"}
                                                alt={user.fullName}
                                                className="w-8 h-8 bg-gray-700 rounded-full mr-3 object-cover cursor-pointer border border-gray-600 group-hover:border-blue-500 transition-all"
                                                onClick={() => platformUsername !== 'Not Connected' && onProfileClick(user.username)}
                                            />
                                            {platformUsername !== 'Not Connected' && (
                                                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowUpRight className="h-3 w-3 text-blue-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-200">
                                                {user.fullName}
                                            </div>
                                            <div className={`text-xs ${platformUsername === 'Not Connected' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {platformUsername}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                {columnConfig[platform].map(column => (
                                    <td key={column.key} className={`p-2 ${column.className || 'text-white'}`}>
                                        {getCellValue(user, column.key)}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                    {isLoading && (
                        <tr>
                            <td colSpan={columnConfig[platform].length + 2} className="p-4 text-center">
                                <div className="flex justify-center items-center">
                                    <Spinner size="small" className="mr-2" />
                                    <span className="text-gray-400">Loading more data...</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

LeaderboardTable.propTypes = {
    users: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
        fullName: PropTypes.string.isRequired,
        profilePicture: PropTypes.string,
        platforms: PropTypes.shape({
            leetcode: PropTypes.object,
            codeforces: PropTypes.object
        })
    })),
    page: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    highlightedUserId: PropTypes.string,
    onProfileClick: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    sortBy: PropTypes.string,
    onSort: PropTypes.func,
    platform: PropTypes.oneOf(['leetcode', 'codeforces']).isRequired
};