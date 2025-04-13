import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useRoomContext } from '../../context/RoomContext';
import toast from 'react-hot-toast';
import { getLeaderboard, refreshLeaderboard } from '../../api/authApi';
import SortButton from './SortButton';
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
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: null });

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
            const result = await refreshLeaderboard(currentRoomDetails.roomId, selectedPlatform);
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
            const defaultSort = platformSortOptions[selectedPlatform][0].value;
            if (sortBy !== defaultSort) {
                setSortBy(defaultSort);
            } else {
                fetchLeaderboard(1);
            }
        }
    }, [currentRoomDetails?.roomId, currentRoomLoading, sortBy, limit, selectedPlatform]);

    const handleSort = (newSortBy) => {
        setSortBy(newSortBy);
        setPage(1);
    };

    const handleShowMyPlace = () => {
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
        setSelectedPlatform(newPlatform);
        setSortBy(platformSortOptions[newPlatform][0].value);
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
        return <div className="text-red-500 text-center p-4">Error loading leaderboard: {error}</div>;
    }

    return (
        <div className="bg-gray-900 text-white">

            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                    <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => handlePlatformChange('leetcode')}
                            className={`px-3 py-1 rounded-md transition-colors ${
                                selectedPlatform === 'leetcode' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            LeetCode
                        </button>
                        <button
                            onClick={() => handlePlatformChange('codeforces')}
                            className={`px-3 py-1 rounded-md transition-colors ${
                                selectedPlatform === 'codeforces' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            Codeforces
                        </button>
                    </div>

                    <div className="flex space-x-2">
                        {platformSortOptions[selectedPlatform].map((option) => (
                            <SortButton
                                key={option.value}
                                sortBy={sortBy}
                                current={option.value}
                                handleSort={handleSort}
                                label={option.label}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex space-x-2 items-center">
                    {(authUser || currentRoomDetails?.admins?.some(admin => admin.username === authUser?.username)) && (
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="bg-gray-800 px-3 py-1 rounded flex items-center text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            <span className="ml-1">Update {selectedPlatform === 'leetcode' ? 'LeetCode' : 'Codeforces'} Stats</span>
                        </button>
                    )}
                    <select
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        className="bg-gray-800 px-2 py-1 rounded flex items-center text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        {limitOptions.map(option => (
                            <option key={option} value={option}>
                                {option} per page
                            </option>
                        ))}
                    </select>
                    {authUser && (
                        <button
                            onClick={handleShowMyPlace}
                            className="bg-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                        >
                            Show my place
                        </button>
                    )}
                    {highlightedUserId && (
                        <button
                            onClick={() => setHighlightedUserId(null)}
                            className="bg-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                        >
                            Clear highlight
                        </button>
                    )}

                    {showSearchInput ? (
                        <form onSubmit={handleSearch} className="flex items-center">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search user..."
                                className="bg-gray-800 px-3 py-1 rounded-l text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="bg-gray-800 px-3 py-1 rounded-r flex items-center text-sm hover:bg-gray-700 transition-colors"
                                disabled={loading}
                            >
                                <Search size={14} />
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setShowSearchInput(true)}
                            className="bg-gray-800 px-3 py-1 rounded flex items-center text-sm hover:bg-gray-700 transition-colors"
                        >
                            <Search size={14} />
                            <span className="ml-1">Search</span>
                        </button>
                    )}
                </div>
            </div>
            
            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="ml-4 text-gray-400">Loading leaderboard...</p>
                </div>
            ) : (
                <>
                    {topUsers.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    {users.length > 0 ? (
                        <>
                            <LeaderboardTable
                                users={users}
                                page={page}
                                limit={limit}
                                highlightedUserId={highlightedUserId}
                                onProfileClick={handleProfileClick}
                                platform={selectedPlatform}
                                sortBy={sortBy}
                            />
                            <Pagination
                                page={page}
                                totalCount={totalCount}
                                limit={limit}
                                setPage={setPage}
                            />
                        </>
                    ) : (
                         <div className="text-center py-10 text-gray-500">
                            No users found in this leaderboard for {selectedPlatform}.
                        </div>
                    )}
                </>
            )}

            <PublicUserProfileModal
                username={profileModal.username}
                isOpen={profileModal.isOpen}
                onClose={closeProfileModal}
            />
        </div>
    );
};

export default CodingLeaderboard;