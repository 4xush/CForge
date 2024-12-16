import React from 'react';

const Leaderboard = () => {
    const leaderboardData = [
        { rank: 1, username: 'CodeMaster', score: 2500 },
        { rank: 2, username: 'AlgoNinja', score: 2450 },
        { rank: 3, username: 'ByteWizard', score: 2400 },
        { rank: 4, username: 'SyntaxSage', score: 2350 },
        { rank: 5, username: 'LogicLegend', score: 2300 },
    ];

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-purple-400">Top Performers</h3>
            <table className="w-full">
                <thead>
                    <tr className="text-left text-gray-400">
                        <th className="pb-2">Rank</th>
                        <th className="pb-2">Username</th>
                        <th className="pb-2">Score</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboardData.map((user) => (
                        <tr key={user.rank} className="border-t border-gray-700">
                            <td className="py-2 text-gray-300">{user.rank}</td>
                            <td className="py-2 text-gray-300">{user.username}</td>
                            <td className="py-2 text-gray-300">{user.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Leaderboard;

