import React from 'react';
import { UserStats } from './UserStats';

export const TopUserCard = ({ user, index, isHighlighted, onProfileClick }) => {
    return (
        <div className={`bg-gray-800 p-4 rounded-lg flex flex-col items-center transition-colors duration-300
      ${isHighlighted ? 'ring-2 ring-blue-500 bg-gray-700' : ''}`}
        >
            <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center">
                    <img
                        src={user.profilePicture || "/default-avatar.png"}
                        alt={user.fullName}
                        className="w-8 h-8 bg-gray-600 rounded-full mr-2 object-cover cursor-pointer"
                        onClick={() => onProfileClick(user.username)}
                    />
                    <div>
                        <h3 className="font-bold text-sm">
                            {user.fullName}
                        </h3>
                        <p className="text-gray-400 text-xs">@{user.platforms.leetcode.username}</p>
                    </div>
                </div>
                <span className="text-xl font-bold">#{index + 1}</span>
            </div>
            <UserStats user={user} />
        </div>
    );
};