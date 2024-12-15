import React, { createContext, useState, useContext, useEffect } from 'react';
import { getLeaderboard } from '../api/authApi';
import { useRoomContext } from '../context/RoomContext';
import { useAuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LeaderboardContext = createContext();

export const LeaderboardProvider = ({ children }) => {
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
    const [highlightedUserId, setHighlightedUserId] = useState(null);

    const limitOptions = [10, 20, 50, 100];

    const fetchLeaderboard = async (pageNum = page) => {
        if (!selectedRoom) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getLeaderboard(selectedRoom.roomId, sortBy, limit, pageNum);

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
    }, [selectedRoom?.roomId, sortBy, limit]);


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
                const data = await getLeaderboard(selectedRoom.roomId, sortBy, totalCount, currentPage);
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
        setLimit,
        setPage,
        handleSort,
        handleShowMyPlace,
        fetchLeaderboard,
        setHighlightedUserId,
        searchUser
    };

    return (
        <LeaderboardContext.Provider value={contextValue}>
            {children}
        </LeaderboardContext.Provider>
    );
};

export const useLeaderboardContext = () => {
    const context = useContext(LeaderboardContext);
    if (!context) {
        throw new Error('useLeaderboardContext must be used within a LeaderboardProvider');
    }
    return context;
};
