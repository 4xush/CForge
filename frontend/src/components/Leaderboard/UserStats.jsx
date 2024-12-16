import React from 'react';
import CircularProgress from '../ui/CircularProgress';
export const UserStats = ({ user }) => {
    return (
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
};