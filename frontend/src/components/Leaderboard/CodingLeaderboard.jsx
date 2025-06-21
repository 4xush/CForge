import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronDown, X } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useRoomContext } from '../../context/RoomContext';
import toast from 'react-hot-toast';
import { getLeaderboard, refreshLeetcodeLeaderboard, refreshCodeforcesLeaderboard } from '../../api/leaderboardApi';
import { TopUserCard } from './TopUserCard';
import Pagination from './Pagination'; // Your Pagination component
import { LeaderboardTable } from './LeaderboardTable';
import PublicUserProfileModal from '../PublicUserProfileModal';
import { Spinner } from '../ui/Spinner';

const CodingLeaderboard = () => {
    const { authUser } = useAuthContext();
    const { currentRoomDetails, currentRoomLoading } = useRoomContext();
    const [users, setUsers] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [selectedPlatform, setSelectedPlatform] = useState('leetcode');

    const platformSortOptions = {
        leetcode: [
            { value: 'platforms.leetcode.totalQuestionsSolved', label: 'Total Problems' },
            { value: 'platforms.leetcode.contestRating', label: 'Contest Rating' },
            { value: 'platforms.leetcode.attendedContestsCount', label: 'Attended Contests' },
            { value: 'platforms.leetcode.questionsSolvedByDifficulty.easy', label: 'Easy Solved' },
            { value: 'platforms.leetcode.questionsSolvedByDifficulty.medium', label: 'Medium Solved' },
            { value: 'platforms.leetcode.questionsSolvedByDifficulty.hard', label: 'Hard Solved' },
        ],
        codeforces: [
            { value: 'platforms.codeforces.currentRating', label: 'Current Rating' },
            { value: 'platforms.codeforces.maxRating', label: 'Max Rating' },
            { value: 'platforms.codeforces.contribution', label: 'Contribution' },
        ]
    };

    const [sortBy, setSortBy] = useState(platformSortOptions.leetcode[0].value);
    const [sortDirection, setSortDirection] = useState('desc');
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshingStats, setRefreshingStats] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [highlightedUserId, setHighlightedUserId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: null });
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const limitOptions = [10, 20, 50, 100];

    const fetchLeaderboardData = useCallback(async (pageNum = 1, currentSortBy = sortBy, currentLimit = limit, currentPlatform = selectedPlatform, currentSortDirection = sortDirection) => {
        if (!currentRoomDetails?.roomId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getLeaderboard(
                currentRoomDetails.roomId, currentSortBy, currentLimit, pageNum, currentPlatform // Add currentSortDirection if API supports
            );
            setUsers(data.members);
            if (pageNum === 1) setTopUsers(data.members.slice(0, 3));
            setTotalCount(data.totalCount);
            setPage(pageNum);
        } catch (err) {
            setError(err.message || "An error occurred");
            toast.error(err.message || "Failed to load leaderboard");
            setUsers([]); setTopUsers([]); setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [currentRoomDetails?.roomId, sortBy, limit, selectedPlatform, sortDirection]);

    useEffect(() => {
        if (currentRoomDetails?.roomId && !currentRoomLoading) {
            fetchLeaderboardData(1, sortBy, limit, selectedPlatform, sortDirection);
        }
    }, [currentRoomDetails?.roomId, currentRoomLoading, sortBy, limit, selectedPlatform, sortDirection, fetchLeaderboardData]);

    const handlePageChange = (newPage) => {
        setHighlightedUserId(null);
        fetchLeaderboardData(newPage, sortBy, limit, selectedPlatform, sortDirection);
    };

    const handleRefresh = async () => {
        if (!currentRoomDetails?.roomId) return;
        setRefreshingStats(true); setError(null);
        try {
            const refreshFn = selectedPlatform === 'leetcode' ? refreshLeetcodeLeaderboard : refreshCodeforcesLeaderboard;
            const result = await refreshFn(currentRoomDetails.roomId);
            if (result?.skipReason === "RECENT_UPDATE") {
                const nextTime = result?.nextUpdateAvailable ? new Date(result.nextUpdateAvailable).toLocaleString() : 'later';
                toast.info(`${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} stats recently updated. Try ${nextTime !== 'later' ? `after ${nextTime}` : 'later'}.`);
            } else {
                toast.success(`${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} stats update initiated.`);
                if (result?.updateResults?.success?.length) toast.success(`Updated: ${result.updateResults.success.length}`);
                if (result?.updateResults?.failed?.length) toast.error(`Failed: ${result.updateResults.failed.length}`);
                await fetchLeaderboardData(1, sortBy, limit, selectedPlatform, sortDirection);
            }
        } catch (err) {
            if (err?.status === 429 && err?.nextUpdateAvailable) {
                toast.error(`Rate limit. Try after ${new Date(err.nextUpdateAvailable).toLocaleString()}`);
            } else {
                toast.error(err?.message || `Failed to update ${selectedPlatform} stats`);
            }
        } finally {
            setRefreshingStats(false);
        }
    };

    const handleSortChange = (newSortBy, newDirection) => {
        setSortBy(newSortBy); setSortDirection(newDirection); setPage(1); setDropdownOpen(false);
    };

    const handleTableSort = (key) => {
        const newDirection = sortBy === key && sortDirection === 'desc' ? 'asc' : 'desc';
        handleSortChange(key, newDirection);
    };

    const handleLimitChange = (newLimit) => {
        setLimit(newLimit); setPage(1);
    };

    const searchAndHighlightUser = useCallback(async (searchTerm, isMyPlaceSearch = false) => {
        if (!currentRoomDetails?.roomId) return;
        setLoading(true); setError(null);
        const searchTermLower = searchTerm.toLowerCase();
        let userFound = false;
        try {
            const maxPages = (totalCount > 0 && limit > 0) ? Math.ceil(totalCount / limit) : 1;
            for (let currentPageIdx = 1; currentPageIdx <= maxPages; currentPageIdx++) {
                const data = await getLeaderboard(currentRoomDetails.roomId, sortBy, limit, currentPageIdx, selectedPlatform, sortDirection);
                const foundUser = data.members.find(user => {
                    const pUser = selectedPlatform === 'leetcode' ? user.platforms?.leetcode?.username : user.platforms?.codeforces?.username;
                    return user.fullName.toLowerCase().includes(searchTermLower) || (pUser && pUser.toLowerCase().includes(searchTermLower));
                });
                if (foundUser) {
                    setUsers(data.members); setPage(currentPageIdx);
                    if (currentPageIdx === 1) setTopUsers(data.members.slice(0, 3));
                    setHighlightedUserId(foundUser._id); userFound = true;
                    setTimeout(() => document.getElementById(`user-row-${foundUser._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                    break;
                }
                if (data.members.length < limit && currentPageIdx < maxPages) break;
            }
            if (!userFound) {
                toast.error(isMyPlaceSearch ? `Your ${selectedPlatform} profile not found.` : "User not found");
                setHighlightedUserId(null);
                if (!isMyPlaceSearch) fetchLeaderboardData(1);
            }
        } catch (err) {
            setError(err.message || "Search error"); toast.error(err.message || "Failed to search");
        } finally {
            setLoading(false);
        }
    }, [currentRoomDetails?.roomId, totalCount, limit, sortBy, selectedPlatform, sortDirection, fetchLeaderboardData]);


    const handleShowMyPlace = useCallback(async () => {
        if (highlightedUserId) { setHighlightedUserId(null); return; }
        if (!authUser) { toast.error("Please login."); return; }
        const authPlatformUsername = selectedPlatform === 'leetcode' ? authUser.platforms?.leetcode?.username : authUser.platforms?.codeforces?.username;
        if (!authPlatformUsername) { toast.error(`Your ${selectedPlatform} username not set.`); return; }
        await searchAndHighlightUser(authPlatformUsername, true);
    }, [highlightedUserId, authUser, selectedPlatform, searchAndHighlightUser]);

    const handleSearchSubmit = async (event) => {
        event.preventDefault();
        if (searchQuery.trim() === '') { toast.error("Enter search term."); return; }
        setHighlightedUserId(null);
        await searchAndHighlightUser(searchQuery);
    };

    const handleProfileClick = (username) => setProfileModal({ isOpen: true, username });
    const closeProfileModal = () => setProfileModal({ isOpen: false, username: null });

    const handlePlatformChange = (newPlatform) => {
        setSelectedPlatform(newPlatform);
        setSortBy(platformSortOptions[newPlatform][0].value);
        setSortDirection('desc'); setPage(1); setHighlightedUserId(null);
    };

    if (currentRoomLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /><p className="ml-4 text-gray-400">Loading room...</p></div>;
    }

    const isMyPlaceHighlighted = highlightedUserId && users.some(u => u._id === highlightedUserId && (selectedPlatform === 'leetcode' ? u.platforms?.leetcode?.username === authUser?.platforms?.leetcode?.username : u.platforms?.codeforces?.username === authUser?.platforms?.codeforces?.username));

    return (
        <div className="bg-gray-900 text-white h-full flex flex-col">
            <div className="flex flex-col h-full overflow-hidden">
                {/* Fixed Headers */}
                <div className="bg-gray-900 border-b border-gray-800 p-2 md:px-3">
                    {/* Main control row: Platform selectors on left, other controls on right for desktop */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                        {/* Platform Selectors */}
                        <div className="flex-shrink-0 flex space-x-2">
                            <button
                                onClick={() => handlePlatformChange('leetcode')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedPlatform === 'leetcode' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                LeetCode
                            </button>
                            <button
                                onClick={() => handlePlatformChange('codeforces')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedPlatform === 'codeforces' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                Codeforces
                            </button>
                        </div>

                        {/* Other Controls and Search: wrap on mobile, single line on desktop */}
                        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 flex-grow"> {/* flex-grow helps search take space */}
                            {/* Sort Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="bg-gray-800 px-3 py-1.5 rounded flex items-center text-sm hover:bg-gray-700 transition-colors w-40 sm:w-auto justify-between"
                                    aria-haspopup="true" aria-expanded={dropdownOpen}
                                >
                                    <span className="truncate max-w-[100px] sm:max-w-none">
                                        {platformSortOptions[selectedPlatform].find(opt => opt.value === sortBy)?.label || 'Sort by'}
                                    </span>
                                    <ChevronDown size={16} className={`ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-1 w-40 sm:w-48 bg-gray-800 rounded-md shadow-lg z-20 border border-gray-700">
                                        {platformSortOptions[selectedPlatform].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleSortChange(option.value, 'desc')}
                                                className={`block w-full text-left px-4 py-2 text-sm rounded-md ${sortBy === option.value ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={refreshingStats || loading}
                                className="bg-gray-800 px-3 py-1.5 rounded flex items-center text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                                <RefreshCw size={14} className={(refreshingStats || loading) ? "animate-spin mr-1" : "mr-1"} />
                                <span>Update Stats</span>
                            </button>

                            <select
                                value={limit}
                                onChange={(e) => handleLimitChange(Number(e.target.value))}
                                className="bg-gray-800 px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors h-[32px] appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 whitespace-nowrap"
                                aria-label="Users per page"
                            >
                                {limitOptions.map(option => <option key={option} value={option}>{option} per page</option>)}
                            </select>

                            <button
                                onClick={handleShowMyPlace}
                                className={`px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${isMyPlaceHighlighted ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                {isMyPlaceHighlighted ? 'Clear Highlight' : 'Show My Place'}
                            </button>

                            {/* Search Form */}
                            <form onSubmit={handleSearchSubmit} className="flex items-center relative flex-grow md:flex-grow-0 md:w-auto min-w-[200px] sm:min-w-[250px] md:max-w-xs">
                                <input
                                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search user..."
                                    className="bg-gray-800 px-3 py-1.5 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                                    aria-label="Search user"
                                />
                                {searchQuery && (
                                    <button
                                        type="button" onClick={() => { setSearchQuery(''); fetchLeaderboardData(1); }}
                                        className="absolute right-10 text-gray-400 hover:text-white p-1" aria-label="Clear search"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="bg-blue-600 px-2.5 py-2 rounded-r-md flex items-center justify-center text-sm hover:bg-blue-700 transition-colors w-10 disabled:opacity-50"
                                    disabled={loading && !!searchQuery} aria-label="Submit search"
                                >
                                    {(loading && !!searchQuery) ? <Spinner size="sm" /> : <Search size={16} />}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-2 md:p-4">
                    {loading && users.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-64"><Spinner size="lg" /><p className="ml-4 mt-2 text-gray-400">Loading...</p></div>
                    ) : error && users.length === 0 ? (
                        <div className="text-red-500 text-center p-4 font-medium bg-red-900/10 rounded-lg">Error: {error}</div>
                    ) : (
                        <>
                            {page === 1 && topUsers.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                                    {topUsers.map((user, index) => (
                                        <TopUserCard key={user._id} user={user} index={index} isHighlighted={user._id === highlightedUserId} onProfileClick={handleProfileClick} platform={selectedPlatform} />
                                    ))}
                                </div>
                            )}
                            <LeaderboardTable users={users} page={page} limit={limit} highlightedUserId={highlightedUserId} onProfileClick={handleProfileClick} platform={selectedPlatform} sortBy={sortBy} sortDirection={sortDirection} onSort={handleTableSort} isLoading={loading && users.length > 0} error={error && users.length > 0 ? error : null} />
                            {users.length === 0 && !loading && !error && (
                                <div className="text-center py-16 text-gray-400 bg-gray-800/50 rounded-lg">
                                    <p className="text-lg font-medium">No users found</p>
                                    <p className="text-sm mt-2">No data for {selectedPlatform} leaderboard with current filters. {searchQuery && "Try different search."}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Fixed Footer */}
                <div className="bg-gray-900 border-t border-gray-800 p-2">
                    {/* Passing props as expected by your Pagination component */}
                    <Pagination
                        page={page}
                        totalCount={totalCount}
                        limit={limit}
                        setPage={handlePageChange} // handlePageChange takes the new page number
                    />
                </div>
            </div>

            <PublicUserProfileModal username={profileModal.username} isOpen={profileModal.isOpen} onClose={closeProfileModal} />
        </div>
    );
};

export default CodingLeaderboard;