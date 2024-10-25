import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getLeaderboard } from '../api';
import { useRoomContext } from '../context/RoomContext';
import CircularProgress from './CircularProgress';

const CodingDashboard = () => {
    const { selectedRoom } = useRoomContext();
    const [users, setUsers] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [sortBy, setSortBy] = useState('platforms.leetcode.totalQuestionsSolved');
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

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
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                    <button
                        className={`px-3 py-1 rounded text-sm ${sortBy === 'platforms.leetcode.totalQuestionsSolved' ? 'bg-gray-700' : 'bg-gray-800'}`}
                        onClick={() => handleSort('platforms.leetcode.totalQuestionsSolved')}
                    >
                        Total problems
                    </button>
                    <button
                        className={`px-3 py-1 rounded text-sm ${sortBy === 'platforms.leetcode.contestRating' ? 'bg-gray-700' : 'bg-gray-800'}`}
                        onClick={() => handleSort('platforms.leetcode.contestRating')}
                    >
                        Contest Rating
                    </button>
                    <button
                        className={`px-3 py-1 rounded text-sm ${sortBy === 'platforms.leetcode.attendedContestsCount' ? 'bg-gray-700' : 'bg-gray-800'}`}
                        onClick={() => handleSort('platforms.leetcode.attendedContestsCount')}
                    >
                        Attended Contests
                    </button>
                </div>
                <div className="flex space-x-2">
                    <button className="bg-gray-800 px-3 py-1 rounded text-sm">Show my place</button>
                    <button className="bg-gray-800 px-3 py-1 rounded flex items-center text-sm">
                        <Search size={14} />
                        <span className="ml-1">Search</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                {topUsers.map((user, index) => (
                    <div key={user._id} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
                        <div className="flex items-center justify-between w-full mb-2">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-600 rounded-full mr-2"></div>
                                <div>
                                    <h3 className="font-bold text-sm">{user.Fullname}</h3>
                                    <p className="text-gray-400 text-xs">@{user.username}</p>
                                </div>
                            </div>
                            <span className="text-xl font-bold">#{index + 1}</span>
                        </div>
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
                        <div className="my-2">
                            <CircularProgress
                                solved={user.platforms.leetcode.totalQuestionsSolved}
                                total={3263}
                            />
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
                    </div>
                ))}
            </div>

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
                        <tr key={user._id} className="border-b border-gray-700">
                            <td className="p-2">{(page - 1) * limit + index + 1}</td>
                            <td className="p-2 flex items-center">
                                <div className="w-6 h-6 bg-gray-600 rounded-full mr-2"></div>
                                {user.Fullname}
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

            <div className="mt-4 flex justify-between items-center">
                <button
                    className="bg-gray-800 px-3 py-1 rounded text-sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                >
                    Previous
                </button>
                <span>Page {page} of {Math.ceil(totalCount / limit)}</span>
                <button
                    className="bg-gray-800 px-3 py-1 rounded text-sm"
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={page * limit >= totalCount}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default CodingDashboard;