import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Spinner } from '../ui/Spinner'; // Assuming a Spinner component

export const LeaderboardTable = ({
    users = [],
    page,
    limit,
    highlightedUserId,
    onProfileClick,
    platform,
    sortBy,
    sortDirection,
    onSort, // Function to call when a column header is clicked for sorting
    isLoading = false, // Indicates if new data is being loaded (e.g., for "loading more" UX)
    error = null,
}) => {

    const columnConfigBase = {
        rank: { key: 'rank', label: '#', sortable: false, className: "w-12 text-center" },
        person: { key: 'person', label: 'Person', sortable: false, className: "min-w-[200px]" },
    };

    // Corrected platformColumns with accurate sortable flags
    const platformColumns = {
        leetcode: [
            { key: 'platforms.leetcode.totalQuestionsSolved', label: 'Total Solved', sortable: true },
            { key: 'platforms.leetcode.questionsSolvedByDifficulty.easy', label: 'Easy', sortable: false, className: 'text-green-400 text-center w-20' },
            { key: 'platforms.leetcode.questionsSolvedByDifficulty.medium', label: 'Medium', sortable: false, className: 'text-yellow-400 text-center w-20' },
            { key: 'platforms.leetcode.questionsSolvedByDifficulty.hard', label: 'Hard', sortable: false, className: 'text-red-400 text-center w-20' },
            { key: 'platforms.leetcode.attendedContestsCount', label: 'Contests', sortable: true, className: 'text-center w-24' },
            { key: 'platforms.leetcode.contestRating', label: 'Rating', sortable: true, className: 'text-center w-24' },
        ],
        codeforces: [
            { key: 'platforms.codeforces.currentRating', label: 'Rating', sortable: true, className: 'text-center w-24' },
            { key: 'platforms.codeforces.maxRating', label: 'Max Rating', sortable: true, className: 'text-center w-24' },
            { key: 'platforms.codeforces.rank', label: 'Rank', sortable: false, className: 'text-center w-24 capitalize' },
            { key: 'platforms.codeforces.maxRank', label: 'Max Rank', sortable: false, className: 'text-center w-24 capitalize' },
            { key: 'platforms.codeforces.contribution', label: 'Contribution', sortable: true, className: 'text-center w-24' },
        ]
    };

    const currentColumns = [
        columnConfigBase.rank,
        columnConfigBase.person,
        ...platformColumns[platform]
    ];

    const getSortIcon = (columnKey) => {
        // Only show active sort icon if the column is indeed the one being sorted by
        if (sortBy !== columnKey) return <ChevronDown className="h-4 w-4 ml-1 opacity-30" />;
        return sortDirection === 'asc'
            ? <ChevronUp className="h-4 w-4 ml-1 text-blue-400" />
            : <ChevronDown className="h-4 w-4 ml-1 text-blue-400" />;
    };

    const getCellValue = (user, key) => {
        if (!key.startsWith('platforms.')) return null;
        const keys = key.split('.');
        let value = user;
        for (const k of keys) {
            value = value?.[k];
            // Ensure 0 is returned for undefined/null numeric stats, and original value for non-numeric (like rank strings)
            if (value === undefined || value === null) {
                // For numeric fields that are missing, return 0. For strings, might return 'N/A' or similar.
                // The specific fields like 'easy', 'medium', 'hard', 'totalQuestionsSolved', etc., are numeric.
                // 'rank' and 'maxRank' are strings.
                const numericKeys = [
                    'totalQuestionsSolved', 'easy', 'medium', 'hard',
                    'attendedContestsCount', 'contestRating', 'currentRating',
                    'maxRating', 'contribution'
                ];
                if (numericKeys.some(nk => key.endsWith(nk))) {
                    return 0;
                }
                return 'N/A'; // For non-numeric missing data like rank if it's not present
            }
        }
        if ((key === 'platforms.codeforces.rank' || key === 'platforms.codeforces.maxRank') && typeof value === 'string') {
            return value.split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
        }
        return value;
    };

    const displayUsers = page === 1 ? users.slice(3) : users;

    if (error && displayUsers.length === 0) {
        return (
            <div className="bg-red-900/20 text-red-400 p-6 rounded-lg text-center">
                <p className="font-semibold">Error Displaying Data</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }

    if (isLoading && displayUsers.length === 0 && !error) {
        return (
            <div className="flex flex-col items-center justify-center py-10">
                <p className="text-gray-400">Fetching leaderboard...</p>
            </div>
        );
    }

    if (!isLoading && displayUsers.length === 0 && !error) {
        return null; // Parent shows "No users found"
    }

    return (
        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-md">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                    <tr>
                        {currentColumns.map(column => (
                            <th
                                key={column.key}
                                scope="col"
                                className={`px-4 py-3 ${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-gray-700' : 'cursor-default'}`} // Added cursor-default for non-sortable
                                onClick={column.sortable ? () => onSort(column.key) : undefined}
                                aria-sort={column.sortable && sortBy === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                            >
                                <div className="flex items-center">
                                    {column.label}
                                    {/* Show sort icon only if the column is sortable */}
                                    {column.sortable && getSortIcon(column.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayUsers.map((user, index) => {
                        const platformData = user.platforms?.[platform];
                        const platformUsername = platformData?.username || 'N/A';
                        const rank = (page - 1) * limit + index + (page === 1 ? 4 : 1);

                        return (
                            <tr
                                key={user._id}
                                id={`user-row-${user._id}`}
                                className={`border-b border-gray-700 transition-colors duration-200 hover:bg-gray-750
                                    ${user._id === highlightedUserId ? 'bg-blue-900/30 hover:bg-blue-900/40 ring-1 ring-blue-600' : 'odd:bg-gray-800 even:bg-gray-850'}`}
                            >
                                <td className={`px-4 py-3 ${currentColumns[0].className || ''}`}>{rank}</td>
                                <td className={`px-4 py-3 ${currentColumns[1].className || ''}`}>
                                    <div className="flex items-center">
                                        <div className="relative group flex-shrink-0">
                                            <button
                                                onClick={() => onProfileClick(user.username)}
                                                className="focus:outline-none"
                                                title={`View ${user.fullName}'s profile`}
                                            >
                                                <img
                                                    src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`}
                                                    alt={user.fullName}
                                                    className="w-9 h-9 bg-gray-700 rounded-full mr-3 object-cover border-2 border-gray-600 group-hover:border-blue-500 transition-all hover:scale-105"
                                                />
                                            </button>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => onProfileClick(user.username)}
                                                className="font-medium text-gray-100 truncate max-w-[150px] sm:max-w-xs text-left hover:underline hover:text-blue-400 transition-colors"
                                                title={`View ${user.fullName}'s profile`}
                                            >
                                                {user.fullName}
                                            </button>
                                            <div className={`text-xs ${platformUsername === 'N/A' ? 'text-gray-500' : 'text-blue-400'}`}>
                                                {platformUsername}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                {platformColumns[platform].map(column => (
                                    <td key={column.key} className={`px-4 py-3 ${column.className || 'text-white'}`}>
                                        {getCellValue(user, column.key)}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                    {isLoading && displayUsers.length > 0 && (
                        <tr>
                            <td colSpan={currentColumns.length} className="p-4 text-center">
                                <div className="flex justify-center items-center text-gray-400">
                                    <Spinner size="small" className="mr-2" />
                                    <span>Loading data...</span>
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
        username: PropTypes.string.isRequired,
        profilePicture: PropTypes.string,
        platforms: PropTypes.object
    })),
    page: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    highlightedUserId: PropTypes.string,
    onProfileClick: PropTypes.func.isRequired,
    platform: PropTypes.oneOf(['leetcode', 'codeforces']).isRequired,
    sortBy: PropTypes.string.isRequired,
    sortDirection: PropTypes.oneOf(['asc', 'desc']).isRequired,
    onSort: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
};