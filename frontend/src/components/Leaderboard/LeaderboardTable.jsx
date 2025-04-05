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
  onSort = () => {}
}) => {
    const [sortConfig, setSortConfig] = useState({
        key: sortBy,
        direction: 'desc'
    });

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
        if (sortConfig.key !== key) {
            return null;
        }
        
        return sortConfig.direction === 'asc' 
            ? <ChevronUp className="h-4 w-4 ml-1" /> 
            : <ChevronDown className="h-4 w-4 ml-1" />;
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
                        <th 
                            className="p-2 cursor-pointer hover:bg-gray-700"
                            onClick={() => handleSort('platforms.leetcode.totalQuestionsSolved')}
                        >
                            <div className="flex items-center">
                                Total Solved
                                {getSortIcon('platforms.leetcode.totalQuestionsSolved')}
                            </div>
                        </th>
                        <th className="p-2">EASY</th>
                        <th className="p-2">MEDIUM</th>
                        <th className="p-2">HARD</th>
                        <th 
                            className="p-2 cursor-pointer hover:bg-gray-700"
                            onClick={() => handleSort('platforms.leetcode.attendedContestsCount')}
                        >
                            <div className="flex items-center">
                                Attended Contests
                                {getSortIcon('platforms.leetcode.attendedContestsCount')}
                            </div>
                        </th>
                        <th 
                            className="p-2 cursor-pointer hover:bg-gray-700"
                            onClick={() => handleSort('platforms.leetcode.contestRating')}
                        >
                            <div className="flex items-center">
                                Contest Rating
                                {getSortIcon('platforms.leetcode.contestRating')}
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {displayUsers.map((user, index) => (
                        <tr
                            key={user._id}
                            id={`user-row-${user._id}`}
                            className={`border-b border-gray-700 transition-colors duration-300 hover:bg-gray-800/50
                                ${user._id === highlightedUserId ? 'bg-blue-900/20 hover:bg-blue-900/30' : ''}`}
                        >
                            <td className="p-2 text-center">
                                {page === 1 ? (index + 4) : ((page - 1) * limit + index + 1)}
                            </td>
                            <td className="p-2">
                                <div className="flex items-center">
                                    <div className="relative group">
                                        <img
                                            src={user.profilePicture || "/default-avatar.png"}
                                            alt={user.fullName}
                                            className="w-8 h-8 bg-gray-700 rounded-full mr-3 object-cover cursor-pointer border border-gray-600 group-hover:border-blue-500 transition-all"
                                            onClick={() => onProfileClick(user.username)}
                                        />
                                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowUpRight className="h-3 w-3 text-blue-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-200 hover:text-blue-400 cursor-pointer" onClick={() => onProfileClick(user.username)}>
                                            {user.fullName}
                                        </div>
                                        <div className="text-xs text-gray-500">@{user.username}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-2 font-medium">{user.platforms.leetcode.totalQuestionsSolved || 0}</td>
                            <td className="p-2">
                                <span className="text-green-400">{user.platforms.leetcode.questionsSolvedByDifficulty?.easy || 0}</span>
                            </td>
                            <td className="p-2">
                                <span className="text-yellow-400">{user.platforms.leetcode.questionsSolvedByDifficulty?.medium || 0}</span>
                            </td>
                            <td className="p-2">
                                <span className="text-red-400">{user.platforms.leetcode.questionsSolvedByDifficulty?.hard || 0}</span>
                            </td>
                            <td className="p-2">{user.platforms.leetcode.attendedContestsCount || 0}</td>
                            <td className="p-2">{user.platforms.leetcode.contestRating || 0}</td>
                        </tr>
                    ))}
                    {isLoading && (
                        <tr>
                            <td colSpan="8" className="p-4 text-center">
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
        username: PropTypes.string.isRequired,
        fullName: PropTypes.string.isRequired,
        profilePicture: PropTypes.string,
        platforms: PropTypes.shape({
            leetcode: PropTypes.shape({
                totalQuestionsSolved: PropTypes.number,
                questionsSolvedByDifficulty: PropTypes.shape({
                    easy: PropTypes.number,
                    medium: PropTypes.number,
                    hard: PropTypes.number
                }),
                attendedContestsCount: PropTypes.number,
                contestRating: PropTypes.number
            })
        })
    })),
    page: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    highlightedUserId: PropTypes.string,
    onProfileClick: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    sortBy: PropTypes.string,
    onSort: PropTypes.func
};