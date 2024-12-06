import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getLeaderboard } from '../api';
import { useRoomContext } from '../context/RoomContext';
import { useAuthContext } from '../context/AuthContext';
import CircularProgress from './ui/CircularProgress';
import SortButton from './Leaderboard/SortButton';
import Pagination from './Leaderboard/Pagination';
import toast from 'react-hot-toast';

const CodingDashboard = () => {
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

    // Auto-highlight current user on initial load and data updates
    useEffect(() => {
        if (authUser && users.length > 0) {
            const currentUserInLeaderboard = users.find(
                user => user.platforms.leetcode.username === authUser.platforms.leetcode.username
            );
            if (currentUserInLeaderboard) {
                setHighlightedUserId(currentUserInLeaderboard._id);
            }
        }
    }, [users, authUser]);

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
            toast.error(err.message || "Failed to load leaderboard");
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

        const myUser = users.find(user =>
            user.platforms.leetcode.username === authUser.platforms.leetcode.username
        );

        if (myUser) {
            setHighlightedUserId(myUser._id);
            // Calculate which page the user is on
            const userIndex = users.findIndex(u => u._id === myUser._id);
            const targetPage = Math.floor(userIndex / limit) + 1;

            if (targetPage !== page) {
                setPage(targetPage);
            } else {
                // If already on correct page, just scroll to the user
                const element = document.getElementById(`user-row-${myUser._id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
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
            // Scroll to the highlighted row
            const element = document.getElementById(`user-row-${foundUser._id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            toast.error("User not found");
        }
    };

    const isCurrentUser = (user) => {
        return authUser && user.platforms.leetcode.username === authUser.platforms.leetcode.username;
    };

    if (!selectedRoom) {
        return <div className="text-white text-center">Please select a room</div>;
    }

    if (loading) {
        return <div className="text-white text-center">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="bg-gray-900 text-white">
            {/* Sort options and Search */}
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

            {/* Top users section */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                {topUsers.map((user, index) => (
                    <TopUserCard
                        key={user._id}
                        user={user}
                        index={index}
                        isHighlighted={user._id === highlightedUserId}
                        isCurrentUser={isCurrentUser(user)}
                    />
                ))}
            </div>

            {/* Conditionally render the full table */}
            {users.length > 3 && (
                <>
                    <LeaderboardTable
                        users={users}
                        page={page}
                        limit={limit}
                        highlightedUserId={highlightedUserId}
                        isCurrentUser={isCurrentUser}
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

// Component definitions remain the same but with updated isCurrentUser prop usage
const TopUserCard = ({ user, index, isHighlighted, isCurrentUser }) => (
    <div className={`bg-gray-800 p-4 rounded-lg flex flex-col items-center transition-colors duration-300 
        ${isHighlighted ? 'ring-2 ring-blue-500 bg-gray-700' : ''} 
        ${isCurrentUser ? 'ring-2 ring-green-500' : ''}`}>
        <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center">
                <img
                    src={user.profilePicture || "/default-avatar.png"}
                    alt={user.fullName}
                    className="w-8 h-8 bg-gray-600 rounded-full mr-2 object-cover"
                />
                <div>
                    <h3 className="font-bold text-sm">
                        {user.fullName}
                        {isCurrentUser && <span className="ml-2 text-xs text-green-400">(You)</span>}
                    </h3>
                    <p className="text-gray-400 text-xs">@{user.platforms.leetcode.username}</p>
                </div>
            </div>
            <span className="text-xl font-bold">#{index + 1}</span>
        </div>
        <UserStats user={user} />
    </div>
);

const UserStats = ({ user }) => (
    <>
        <div className="flex justify-between w-full text-xs mb-2">
            <div>
                <p className="text-gray-400">Attended Contests</p>
                <p className="font-bold">{user.platforms.leetcode.attendedContestsCount}</p>
            </div>
            <div className="text-right">
                <p className="text-gray-400">Contest Rating</p>
                <p className="font-bold">{user.platforms.leetcode.contestRating}</p>
            </div>
        </div>
        <div>
            <CircularProgress solved={user.platforms.leetcode.totalQuestionsSolved} total={3263} />
            <p className="text-center text-xs text-gray-400 mt-1">
                /3263 Solved
            </p>
        </div>
        <div className="flex justify-between w-full text-xs">
            <div>
                <p className="text-yellow-400">EASY</p>
                <p className="font-bold">{user.platforms.leetcode.questionsSolvedByDifficulty.easy}</p>
            </div>
            <div className="text-center">
                <p className="text-green-400">MEDIUM</p>
                <p className="font-bold">{user.platforms.leetcode.questionsSolvedByDifficulty.medium}</p>
            </div>
            <div className="text-right">
                <p className="text-red-400">HARD</p>
                <p className="font-bold">{user.platforms.leetcode.questionsSolvedByDifficulty.hard}</p>
            </div>
        </div>
    </>
);
const LeaderboardTable = ({ users, page, limit, highlightedUserId, isCurrentUser }) => (
    <table className="w-full text-sm">
        <thead>
            <tr className="bg-gray-800 text-left">
                <th className="p-2">Place</th>
                <th className="p-2">Person</th>
                <th className="p-2">Total Solved</th>
                <th className="p-2">EASY</th>
                <th className="p-2">MEDIUM</th>
                <th className="p-2">HARD</th>
                <th className="p-2">Attended Contests</th>
                <th className="p-2">Contest Rating</th>
            </tr>
        </thead>
        <tbody>
            {users.map((user, index) => (
                <tr
                    key={user._id}
                    id={`user-row-${user._id}`}
                    className={`border-b border-gray-700 transition-colors duration-300 
                        ${user._id === highlightedUserId ? 'bg-gray-700' : ''} 
                        ${isCurrentUser(user) ? 'bg-green-900/20' : ''}`}
                >
                    <td className="p-2">{(page - 1) * limit + index + 1}</td>
                    <td className="p-2 flex items-center">
                        <img
                            src={user.profilePicture || "/default-avatar.png"}
                            alt={user.fullName}
                            className="w-6 h-6 bg-gray-600 rounded-full mr-2 object-cover"
                        />
                        <span>
                            {user.fullName}
                            {isCurrentUser(user) && (
                                <span className="ml-2 text-xs text-green-400">(You)</span>
                            )}
                        </span>
                    </td>
                    <td className="p-2">{user.platforms.leetcode.totalQuestionsSolved}</td>
                    <td className="p-2">{user.platforms.leetcode.questionsSolvedByDifficulty.easy}</td>
                    <td className="p-2">{user.platforms.leetcode.questionsSolvedByDifficulty.medium}</td>
                    <td className="p-2">{user.platforms.leetcode.questionsSolvedByDifficulty.hard}</td>
                    <td className="p-2">{user.platforms.leetcode.attendedContestsCount}</td>
                    <td className="p-2">{user.platforms.leetcode.contestRating}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

export default CodingDashboard;