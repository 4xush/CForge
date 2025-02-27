import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { TopUserCard } from './TopUserCard';
import SortButton from './SortButton';
import Pagination from './Pagination';
import { LeaderboardTable } from './LeaderboardTable';
import PublicUserProfileModal from '../PublicUserProfileModal';
import toast from 'react-hot-toast';
import { getLeaderboard } from '../../api/authApi';

const CodingLeaderboard = ({ selectedRoom }) => {
    const { authUser } = useAuthContext();
    const [users, setUsers] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
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

    const fetchLeaderboard = async (pageNum = page) => {
        if (!selectedRoom) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getLeaderboard(selectedRoom.id, sortBy, limit, pageNum);

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
        }
        setLoading(false);
    };

    useEffect(() => {
        if (selectedRoom) {
            fetchLeaderboard(1);
        }
    }, [selectedRoom?.id, sortBy, limit]);

    const handleSort = (newSortBy) => {
        setSortBy(newSortBy);
        setPage(1);
    };

    const handleShowMyPlace = () => {
        if (!authUser) {
            toast.error("Please login to use this feature");
            return;
        }

        const myUser = users.find(user =>
            user.platforms.leetcode.username === authUser.platforms.leetcode.username
        );

        if (myUser) {
            setHighlightedUserId(myUser._id);
            const userIndex = users.findIndex(u => u._id === myUser._id);
            const targetPage = Math.floor(userIndex / limit) + 1;

            if (targetPage !== page) {
                setPage(targetPage);
            } else {
                const element = document.getElementById(`user-row-${myUser._id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        } else {
            toast.error("You are not in the current leaderboard");
        }
    };

    const searchUser = async (searchTerm) => {
        setLoading(true);
        setError(null);
        let allUsers = [];
        let currentPage = 1;
        const searchTermLower = searchTerm.toLowerCase();

        try {
            while (true) {
                const data = await getLeaderboard(selectedRoom.id, sortBy, totalCount, currentPage);
                allUsers = [...allUsers, ...data.members];

                const foundUser = data.members.find(user =>
                    user.fullName.toLowerCase().includes(searchTermLower) ||
                    user.platforms.leetcode.username.toLowerCase().includes(searchTermLower)
                );

                if (foundUser) {
                    const userIndex = allUsers.findIndex(u => u._id === foundUser._id);
                    const targetPage = Math.floor(userIndex / limit) + 1;
                    setPage(targetPage);
                    setUsers(allUsers);
                    return foundUser._id;
                }

                if (data.members.length < totalCount) {
                    currentPage++;
                } else {
                    break;
                }
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
        const foundUserId = await searchUser(searchQuery);
        if (foundUserId) {
            setHighlightedUserId(foundUserId);
            const element = document.getElementById(`user-row-${foundUserId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
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

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="bg-gray-900 text-white">
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                    <SortButton
                        sortBy={sortBy}
                        current="platforms.leetcode.totalQuestionsSolved"
                        handleSort={handleSort}
                        label="Total problems"
                    />
                    <SortButton
                        sortBy={sortBy}
                        current="platforms.leetcode.contestRating"
                        handleSort={handleSort}
                        label="Contest Rating"
                    />
                    <SortButton
                        sortBy={sortBy}
                        current="platforms.leetcode.attendedContestsCount"
                        handleSort={handleSort}
                        label="Attended Contests"
                    />
                </div>
                <div className="flex space-x-2 items-center">
                    <select
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        className="bg-gray-800 px-2 py-1 rounded text-sm"
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
            {!loading && (
                <>
                    {topUsers.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {topUsers.map((user, index) => (
                                <TopUserCard
                                    key={user._id}
                                    user={user}
                                    index={index}
                                    isHighlighted={user._id === highlightedUserId}
                                    onProfileClick={handleProfileClick}
                                />
                            ))}
                        </div>
                    )}
                    {users.length > 0 && (
                        <>
                            <LeaderboardTable
                                users={users}
                                page={page}
                                limit={limit}
                                highlightedUserId={highlightedUserId}
                                onProfileClick={handleProfileClick}
                            />
                            <Pagination
                                page={page}
                                totalCount={totalCount}
                                limit={limit}
                                setPage={setPage}
                            />
                        </>
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