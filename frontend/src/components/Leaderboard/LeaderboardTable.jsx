import React from 'react';

export const LeaderboardTable = ({ users, page, limit, highlightedUserId }) => {
    const displayUsers = page === 1 ? users.slice(3) : users;

    return (
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
                {displayUsers.map((user, index) => (
                    <tr
                        key={user._id}
                        id={`user-row-${user._id}`}
                        className={`border-b border-gray-700 transition-colors duration-300 
                            ${user._id === highlightedUserId ? 'bg-gray-700' : ''} `}
                    >
                        <td className="p-2">{page === 1 ? (index + 4) : ((page - 1) * limit + index + 1)}</td>
                        <td className="p-2 flex items-center">
                            <img
                                src={user.profilePicture || "/default-avatar.png"}
                                alt={user.fullName}
                                className="w-6 h-6 bg-gray-600 rounded-full mr-2 object-cover"
                            />
                            <span>
                                {user.fullName}
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
};