// components/Leaderboard/CodingDashboard.jsx
import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../../api.js';
import { useRoomContext } from '../../context/RoomContext.jsx';
import { useAuthContext } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { TopUserCard } from './TopUserCard';
import { SearchBar } from './SearchBar';
import { LeaderboardTable } from './LeaderboardTable';
import SortButton from './SortButton';
import Pagination from './Pagination';

export const CodingDashboard = () => {
    const { selectedRoom } = useRoomContext();
    const { authUser } = useAuthContext();
    const [users, setUsers] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [sortBy, setSortBy] = useState('platforms.leetcode.totalQuestionsSolved');
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedUserId, setHighlightedUserId] = useState(null);
    const [showSearchInput, setShowSearchInput] = useState(false);

    useEffect(() => {
        if (selectedRoom) {
            fetchLeaderboard();
        }
    }, [selectedRoom?.roomId, sortBy, limit, page]);

    const fetchLeaderboard = async () => {
        if (!selectedRoom) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getLeaderboard(selectedRoom.roomId, sortBy, limit, page);
            setUsers(data.members);
            setTopUsers(data.members.slice(0, 3));
            setTotalCount(data.totalCount);
        } catch (err) {
            setError(err.message || "An error occurred while fetching the leaderboard");
        }
        setLoading(false);
    };

    const handleSort = (newSortBy) => {
        setSortBy(newSortBy);
        setPage(1);
    };

    const handleShowMyPlace = () => {
        if (!authUser) {
            toast.error("Please login to use this feature");
            return;
        }

        const myIndex = users.findIndex(user => user._id === authUser._id);
        if (myIndex !== -1) {
            setHighlightedUserId(authUser._id);
            const element = document.getElementById(`user-row-${authUser._id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            toast.error("You are not in the current leaderboard");
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        const searchTerm = searchQuery.toLowerCase();
        const foundUser = users.find(user =>
            user.fullName.toLowerCase().includes(searchTerm) ||
            user.platforms.leetcode.username.toLowerCase().includes(searchTerm)
        );

        if (foundUser) {
            setHighlightedUserId(foundUser._id);
            const element = document.getElementById(`user-row-${foundUser._id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            toast.error("User not found");
        }
    };

    if (!selectedRoom) return <div className="text-white text-center">Please select a room</div>;
    if (loading) return <div className="text-white text-center">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;

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
                <div className="flex space-x-2">
                    {authUser && (
                        <button
                            onClick={handleShowMyPlace}
                            className="bg-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                        >
                            Show my place
                        </button>
                    )}
                    <SearchBar
                        showSearchInput={showSearchInput}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        handleSearch={handleSearch}
                        setShowSearchInput={setShowSearchInput}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                {topUsers.map((user, index) => (
                    <TopUserCard
                        key={user._id}
                        user={user}
                        index={index}
                        isHighlighted={user._id === highlightedUserId}
                        isCurrentUser={authUser && user._id === authUser._id}
                    />
                ))}
            </div>

            {users.length > 3 && (
                <>
                    <LeaderboardTable
                        users={users}
                        page={page}
                        limit={limit}
                        highlightedUserId={highlightedUserId}
                        currentUserId={authUser?._id}
                    />
                    <Pagination
                        page={page}
                        totalCount={totalCount}
                        limit={limit}
                        setPage={setPage}
                    />
                </>
            )}
        </div>
    );
};

export default CodingDashboard;