// components/Leaderboard/TopUserCard.jsx
import React from 'react';

export const TopUserCard = ({ user, index, isHighlighted, isCurrentUser }) => {
    return (
        <div className={`p-4 rounded-lg ${isHighlighted ? 'bg-gray-700' : 'bg-gray-800'} 
      ${isCurrentUser ? 'border-2 border-green-500' : ''}`}>
            <div className="flex items-center space-x-3">
                <img
                    src={user.profilePicture || "/default-avatar.png"}
                    alt={user.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                    <h3 className="font-semibold">
                        {user.fullName}
                        {isCurrentUser && <span className="ml-2 text-xs text-green-400">(You)</span>}
                    </h3>
                    <p className="text-sm text-gray-400">Rank #{index + 1}</p>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                    <p className="text-gray-400">Total Solved</p>
                    <p className="font-medium">{user.platforms.leetcode.totalQuestionsSolved}</p>
                </div>
                <div>
                    <p className="text-gray-400">Contest Rating</p>
                    <p className="font-medium">{user.platforms.leetcode.contestRating}</p>
                </div>
            </div>
        </div>
    );
};