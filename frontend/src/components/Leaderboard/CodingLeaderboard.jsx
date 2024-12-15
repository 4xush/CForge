import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useLeaderboardContext } from '../../context/LeaderboardContext';
import { useAuthContext } from '../../context/AuthContext';
import { TopUserCard } from './TopUserCard';
import SortButton from './SortButton';
import Pagination from './Pagination';
import { LeaderboardTable } from './LeaderboardTable';
import toast from 'react-hot-toast';

const CodingLeaderboard = () => {
    const {
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
        setHighlightedUserId,
        searchUser
    } = useLeaderboardContext();

    const { authUser } = useAuthContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchInput, setShowSearchInput] = useState(false);

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
            {loading && <div className="text-white text-center">Loading...</div>}
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
        </div>
    );
};

export default CodingLeaderboard;

