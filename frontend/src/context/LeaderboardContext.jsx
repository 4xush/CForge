import React, { createContext, useState, useContext, useEffect } from 'react';
import { getLeaderboard } from '../api/authApi';
import { useRoomContext } from '../context/RoomContext';
import { useAuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Create the LeaderboardContext
const LeaderboardContext = createContext();

// LeaderboardProvider Component
export const LeaderboardProvider = ({ children }) => {
    const { selectedRoom } = useRoomContext();
    const { authUser } = useAuthContext();

    // State for leaderboard data
    const [users, setUsers] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [sortBy, setSortBy] = useState('platforms.leetcode.totalQuestionsSolved');
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [highlightedUserId, setHighlightedUserId] = useState(null);

    // Limit options for dropdown
    const limitOptions = [10, 20, 50, 100];

    // Fetch leaderboard data
    const fetchLeaderboard = async () => {
        if (!selectedRoom) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getLeaderboard(selectedRoom.roomId, sortBy, limit, page);

            // Set all users
            setUsers(data.members);

            // Only set top users for the first page
            if (page === 1) {
                setTopUsers(data.members.slice(0, 3));
            } else {
                setTopUsers([]);
            }

            setTotalCount(data.totalCount);
        } catch (err) {
            setError(err.message || "An error occurred while fetching the leaderboard");
            toast.error(err.message || "Failed to load leaderboard");
        }
        setLoading(false);
    };

    // Effect to fetch leaderboard when dependencies change
    useEffect(() => {
        if (selectedRoom) {
            fetchLeaderboard();
        }
    }, [selectedRoom?.roomId, sortBy, limit, page]);

    // Effect to highlight current user
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

    // Context value
    const contextValue = {
        users,
        topUsers,
        sortBy,
        limit,
        page,
        loading,
        error,
        totalCount,
        highlightedUserId,
        limitOptions,

        // Methods
        setLimit,
        setPage,
        handleSort,
        handleShowMyPlace,
        fetchLeaderboard,
        setHighlightedUserId
    };

    return (
        <LeaderboardContext.Provider value={contextValue}>
            {children}
        </LeaderboardContext.Provider>
    );
};

// Custom hook to use the LeaderboardContext
export const useLeaderboardContext = () => {
    const context = useContext(LeaderboardContext);
    if (!context) {
        throw new Error('useLeaderboardContext must be used within a LeaderboardProvider');
    }
    return context;
};