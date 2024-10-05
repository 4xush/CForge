import React from 'react';
import { Search } from 'lucide-react';

const CodingDashboard = () => {
    const topUsers = [
        { id: 1, name: 'ANDREW GARFIELD', username: '@codeayush_', globalRanking: '2151510', contestRating: '1500', solved: 307, total: 3263, easy: 150, medium: 150, hard: 19 },
        { id: 2, name: 'ANDREW GARFIELD', username: '@codeayush_', globalRanking: '2151510', contestRating: '1500', solved: 307, total: 3263, easy: 150, medium: 150, hard: 19 },
        { id: 3, name: 'ANDREW GARFIELD', username: '@codeayush_', globalRanking: '2151510', contestRating: '1500', solved: 307, total: 3263, easy: 150, medium: 150, hard: 19 },
    ];

    const tableData = [
        { place: 4, name: 'Dunkirk', totalSolved: 319, easy: 150, medium: 150, hard: 19, contestRating: 1500, globalRanking: 2050450 },
        { place: 5, name: 'Dunkirk', totalSolved: 319, easy: 150, medium: 150, hard: 19, contestRating: 1500, globalRanking: 2050450 },
        { place: 6, name: 'Dunkirk', totalSolved: 319, easy: 150, medium: 150, hard: 19, contestRating: 1500, globalRanking: 2050450 },
        { place: 7, name: 'Dunkirk', totalSolved: 319, easy: 150, medium: 150, hard: 19, contestRating: 1500, globalRanking: 2050450 },
        { place: 8, name: 'Dunkirk', totalSolved: 319, easy: 150, medium: 150, hard: 19, contestRating: 1500, globalRanking: 2050450 },
    ];

    const CircularProgress = ({ solved, total }) => {
        const radius = 30;
        const strokeWidth = 4;
        const normalizedRadius = radius - strokeWidth / 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - (solved / total) * circumference;

        return (
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                <circle
                    stroke="#4a5568"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke="#48bb78"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <text
                    x="50%"
                    y="50%"
                    dy=".3em"
                    textAnchor="middle"
                    className="text-xl font-bold fill-current"
                    transform={`rotate(90 ${radius} ${radius})`}
                >
                    {solved}
                </text>
            </svg>
        );
    };

    return (
        <div className="bg-gray-900 text-white p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                    <button className="bg-gray-700 px-3 py-1 rounded text-sm">Total problem</button>
                    <button className="bg-gray-800 px-3 py-1 rounded text-sm">Contest Rating</button>
                    <button className="bg-gray-800 px-3 py-1 rounded text-sm">Ranking</button>
                </div>
                <div className="flex space-x-2">
                    {/* <button className="bg-gray-700 px-3 py-1 rounded text-sm">7D</button>
                    <button className="bg-gray-800 px-3 py-1 rounded text-sm">1 month</button>
                    <button className="bg-gray-800 px-3 py-1 rounded text-sm">Seasonal</button> */}
                    <button className="bg-gray-800 px-3 py-1 rounded text-sm">Show my place</button>
                    <button className="bg-gray-800 px-3 py-1 rounded flex items-center text-sm">
                        <Search size={14} />
                        <span className="ml-1">Search</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                {topUsers.map((user, index) => (
                    <div key={user.id} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
                        <div className="flex items-center justify-between w-full mb-2">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-600 rounded-full mr-2"></div>
                                <div>
                                    <h3 className="font-bold text-sm">{user.name}</h3>
                                    <p className="text-gray-400 text-xs">{user.username}</p>
                                </div>
                            </div>
                            <span className="text-xl font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex justify-between w-full text-xs mb-2">
                            <div>
                                <p className="text-gray-400">Global Ranking</p>
                                <p className="font-bold">{user.globalRanking}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400">Contest Rating</p>
                                <p className="font-bold">{user.contestRating}</p>
                            </div>
                        </div>
                        <div className="my-2">
                            <CircularProgress solved={user.solved} total={user.total} />
                            <p className="text-center text-xs text-gray-400 mt-1">/{user.total} Solved</p>
                        </div>
                        <div className="flex justify-between w-full text-xs">
                            <div>
                                <p className="text-yellow-400">EASY</p>
                                <p className="font-bold">{user.easy}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-green-400">MEDIUM</p>
                                <p className="font-bold">{user.medium}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-red-400">HARD</p>
                                <p className="font-bold">{user.hard}</p>
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
                        <th className="p-2">Contest Rating</th>
                        <th className="p-2">Global Ranking</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row) => (
                        <tr key={row.place} className="border-b border-gray-700">
                            <td className="p-2">{row.place}</td>
                            <td className="p-2 flex items-center">
                                <div className="w-6 h-6 bg-gray-600 rounded-full mr-2"></div>
                                {row.name}
                            </td>
                            <td className="p-2">{row.totalSolved}</td>
                            <td className="p-2">{row.easy}</td>
                            <td className="p-2">{row.medium}</td>
                            <td className="p-2">{row.hard}</td>
                            <td className="p-2">{row.contestRating}</td>
                            <td className="p-2">{row.globalRanking}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CodingDashboard;