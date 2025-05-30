import { useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useRoomContext } from '../../context/RoomContext';
import toast from 'react-hot-toast';
import { getLeaderboard, refreshLeetcodeLeaderboard, refreshCodeforcesLeaderboard } from '../../api/leaderboardApi';
import { TopUserCard } from './TopUserCard';
import Pagination from './Pagination';
import { LeaderboardTable } from './LeaderboardTable';
import PublicUserProfileModal from '../PublicUserProfileModal';

const CodingLeaderboard = () => {
    const { authUser } = useAuthContext();
    const { currentRoomDetails, currentRoomLoading } = useRoomContext();
    const [users, setUsers] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [selectedPlatform, setSelectedPlatform] = useState('leetcode');
    const [sortBy, setSortBy] = useState('platforms.leetcode.totalQuestionsSolved');
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [highlightedUserId, setHighlightedUserId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: null });
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const limitOptions = [10, 20, 50, 100];

    const platformSortOptions = {
        leetcode: [
            { value: 'platforms.leetcode.totalQuestionsSolved', label: 'Total problems' },
            { value: 'platforms.leetcode.contestRating', label: 'Contest Rating' },
            { value: 'platforms.leetcode.attendedContestsCount', label: 'Attended Contests' }
        ],
        codeforces: [
            { value: 'platforms.codeforces.currentRating', label: 'Current Rating' },
            { value: 'platforms.codeforces.maxRating', label: 'Max Rating' },
            { value: 'platforms.codeforces.contribution', label: 'Contribution' }
        ]
    };

    const fetchLeaderboard = async (pageNum = page) => {
        if (!currentRoomDetails?.roomId) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getLeaderboard(
                currentRoomDetails.roomId,
                sortBy,
                limit,
                pageNum,
                selectedPlatform
            );

            if (pageNum === 1) {
                setUsers(data.members);
                setTopUsers(data.members.slice(0, 3));
            } else {
                setUsers(prevUsers => [...prevUsers, ...data.members]);
            }

            setTotalCount(data.totalCount);
        } catch (err) {
            setError(err.message || "An error occurred while fetching the leaderboard");
            toast.error(err.message || "Failed to load leaderboard");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!currentRoomDetails?.roomId) return;

        setLoading(true);
        try {
            const refreshFunction = selectedPlatform === 'leetcode' 
                ? refreshLeetcodeLeaderboard 
                : refreshCodeforcesLeaderboard;
            
            const result = await refreshFunction(currentRoomDetails.roomId);
            toast.success(`${selectedPlatform === 'leetcode' ? 'LeetCode' : 'Codeforces'} stats update completed successfully`);

            if (result.results) {
                if (result.results.success.length > 0) {
                    toast.success(`Updated stats for ${result.results.success.length} members`);
                }
                if (result.results.failed.length > 0) {
                    toast.error(`Failed to update ${result.results.failed.length} members`);
                }
            }

            await fetchLeaderboard(1);
        } catch (err) {
            toast.error(err.message || `Failed to update ${selectedPlatform === 'leetcode' ? 'LeetCode' : 'Codeforces'} stats`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentRoomDetails?.roomId && !currentRoomLoading) {
            fetchLeaderboard(1);
        }
    }, [currentRoomDetails?.roomId, currentRoomLoading, sortBy, limit, selectedPlatform]);

    const handleSort = (newSortBy) => {
        setSortBy(newSortBy);
        setPage(1);
        setDropdownOpen(false);
    };

    const handleShowMyPlace = () => {
        if (highlightedUserId) {
            setHighlightedUserId(null);
            return;
        }

        if (!authUser) {
            toast.error("Please login to use this feature");
            return;
        }

        const myUser = users.find(user => {
            if (selectedPlatform === 'leetcode') {
                return user.platforms?.leetcode?.username === authUser.platforms?.leetcode?.username;
            } else {
                return user.platforms?.codeforces?.username === authUser.platforms?.codeforces?.username;
            }
        });

        if (myUser) {
            setHighlightedUserId(myUser._id);
            const userIndex = users.findIndex(u => u._id === myUser._id);
            const targetPage = Math.floor(userIndex / limit) + 1;

            if (targetPage !== page) {
                setPage(targetPage);
                fetchLeaderboard(targetPage);
            } else {
                const element = document.getElementById(`user-row-${myUser._id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        } else {
            toast.error(`You are not in the current ${selectedPlatform === 'leetcode' ? 'LeetCode' : 'Codeforces'} leaderboard`);
        }
    };

    const searchUser = async (searchTerm) => {
        if (!currentRoomDetails?.roomId) return null;
        setLoading(true);
        setError(null);
        let allUsers = [];
        let currentPage = 1;
        const searchTermLower = searchTerm.toLowerCase();

        try {
            const maxPages = Math.ceil(totalCount / limit);
            while (currentPage <= maxPages) {
                const data = await getLeaderboard(currentRoomDetails.roomId, sortBy, limit, currentPage, selectedPlatform);
                allUsers = [...allUsers, ...data.members];

                const foundUser = data.members.find(user => {
                    const platformUsername = selectedPlatform === 'leetcode'
                        ? user.platforms?.leetcode?.username
                        : user.platforms?.codeforces?.username;

                    return user.fullName.toLowerCase().includes(searchTermLower) ||
                        (platformUsername && platformUsername.toLowerCase().includes(searchTermLower));
                });

                if (foundUser) {
                    const userIndex = allUsers.findIndex(u => u._id === foundUser._id);
                    const targetPage = Math.floor(userIndex / limit) + 1;

                    setUsers(allUsers.slice(0, targetPage * limit));
                    setPage(targetPage);

                    setHighlightedUserId(foundUser._id);
                    setTimeout(() => {
                        const element = document.getElementById(`user-row-${foundUser._id}`);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 100);

                    return foundUser._id;
                }

                if (allUsers.length >= totalCount) {
                    break;
                }
                currentPage++;
            }
            toast.error("User not found");
            return null;
        } catch (err) {
            setError(err.message || "An error occurred while searching");
            toast.error(err.message || "Failed to search user");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (event) => {
        event.preventDefault();
        if (searchQuery.trim() === '') {
            toast.error("Please enter a search term");
            return;
        }
        await searchUser(searchQuery);
    };

    const handleProfileClick = (username) => {
        setProfileModal({
            isOpen: true,
            username: username
        });
    };

    const closeProfileModal = () => {
        setProfileModal({ isOpen: false, username: null });
    };

    const handlePlatformChange = (newPlatform) => {
        const defaultSort = platformSortOptions[newPlatform][0].value;
        setSelectedPlatform(newPlatform);
        setSortBy(defaultSort);
        setPage(1);
    };

    if (currentRoomLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-400">Loading room details...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center p-4 font-medium">Error loading leaderboard: {error}</div>;
    }

    return (
        <div className="bg-gray-900 text-white h-full flex flex-col">
            {/* Main content with proper scrolling */}
            <div className="flex flex-col h-full overflow-hidden">
                {/* Fixed Headers */}
                <div className="bg-gray-900 border-b border-gray-800 pb-2">
                    {/* Platform selectors and controls row */}
                    <div className="flex justify-between items-center px-2">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePlatformChange('leetcode')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedPlatform === 'leetcode'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                LeetCode
                            </button>
                            <button
                                onClick={() => handlePlatformChange('codeforces')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedPlatform === 'codeforces'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                Codeforces
                            </button>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Sort Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="bg-gray-800 px-3 py-1.5 rounded flex items-center text-sm hover:bg-gray-700 transition-colors w-40 justify-between"
                                >
                                    <span className="truncate">
                                        {platformSortOptions[selectedPlatform].find(opt => opt.value === sortBy)?.label || 'Sort by'}
                                    </span>
                                    <ChevronDown size={16} className={`ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-1 w-40 bg-gray-800 rounded-md shadow-lg z-10 border border-gray-700">
                                        <div>
                                            {platformSortOptions[selectedPlatform].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        handleSort(option.value);
                                                        setDropdownOpen(false);
                                                    }}
                                                    className={`block w-full text-left px-4 py-2 text-sm rounded-md ${sortBy === option.value
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-300 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="bg-gray-800 px-3 py-1.5 rounded flex items-center text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin mr-1" : "mr-1"} />
                                <span>Update Stats</span>
                            </button>

                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="bg-gray-800 px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors h-[32px]"
                            >
                                {limitOptions.map(option => (
                                    <option key={option} value={option}>
                                        {option} per page
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={handleShowMyPlace}
                                className={`px-3 py-1.5 rounded text-sm transition-colors ${highlightedUserId
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                {highlightedUserId ? 'Clear highlight' : 'Show my place'}
                            </button>

                            <form onSubmit={handleSearch} className="flex items-center relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search user..."
                                    className="bg-gray-800 px-3 py-1.5 rounded-l text-sm focus:outline-none w-64"
                                    onFocus={(e) => e.target.placeholder = ''}
                                    onBlur={(e) => e.target.placeholder = 'Search user...'}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-12 text-gray-400 hover:text-white"
                                    >
                                        ×
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="bg-gray-700 px-3 py-2 rounded-r flex items-center justify-center text-sm hover:bg-gray-600 transition-colors w-10"
                                    disabled={loading}
                                >
                                    <Search size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            <p className="ml-4 text-gray-400">Loading leaderboard...</p>
                        </div>
                    ) : (
                        <>
                            {/* Top Users */}
                            {topUsers.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    {topUsers.map((user, index) => (
                                        <TopUserCard
                                            key={user._id}
                                            user={user}
                                            index={index}
                                            isHighlighted={user._id === highlightedUserId}
                                            onProfileClick={handleProfileClick}
                                            platform={selectedPlatform}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Table */}
                            {users.length > 0 ? (
                                <div className="bg-gray-800 rounded-lg overflow-hidden">
                                    <LeaderboardTable
                                        users={users}
                                        page={page}
                                        limit={limit}
                                        highlightedUserId={highlightedUserId}
                                        onProfileClick={handleProfileClick}
                                        platform={selectedPlatform}
                                        sortBy={sortBy}
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-16 text-gray-400 bg-gray-800 rounded-lg">
                                    <p className="text-lg font-medium">No users found</p>
                                    <p className="text-sm mt-2">No data available for {selectedPlatform === 'leetcode' ? 'LeetCode' : 'Codeforces'} leaderboard</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Fixed Footer */}
                <div className="bg-gray-900 border-t border-gray-800 p-3">
                    <Pagination
                        page={page}
                        totalCount={totalCount}
                        limit={limit}
                        setPage={setPage}
                    />
                </div>
            </div>

            {/* Profile Modal */}
            <PublicUserProfileModal
                username={profileModal.username}
                isOpen={profileModal.isOpen}
                onClose={closeProfileModal}
            />
        </div>
    );
};

export default CodingLeaderboard;