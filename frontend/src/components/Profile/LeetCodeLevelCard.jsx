import React, { useState } from 'react';
import { Trophy, CodeIcon, Star, Award, TrendingUp, Target, CheckCircle } from 'lucide-react';

const UserLevelCard = ({ leetcodeData }) => {
    const {
        questionsSolvedByDifficulty: { easy, medium, hard },
        username,
        totalQuestionsSolved,
        attendedContestsCount,
        contestRating,
    } = leetcodeData;

    const [activeTab, setActiveTab] = useState('overview');

    // Calculate weighted points
    const weightedPoints = easy * 0.5 + medium * 1 + hard * 2;

    const levels = [
        { name: 'Newbie', min: 0, max: 50, color: 'bg-blue-300', description: "You're just getting started. Focus on understanding problem-solving basics." },
        { name: 'Beginner', min: 51, max: 150, color: 'bg-green-300', description: "You're making progress! Try exploring problems of medium difficulty to level up." },
        { name: 'Intermediate', min: 151, max: 350, color: 'bg-yellow-300', description: "Well done! You've built a solid base. Keep working on a mix of medium and hard problems." },
        { name: 'Proficient', min: 351, max: 600, color: 'bg-orange-300', description: "Great work! You've proven your ability to tackle diverse problems. Dive deeper into hard topics to keep growing." },
        { name: 'Expert', min: 601, max: 900, color: 'bg-red-300', description: "Amazing! You're solving advanced problems. You're among the top coders—push further with consistent practice." },
        { name: 'Master', min: 901, max: Infinity, color: 'bg-purple-600', hardRequirement: 50, description: "Exceptional! Your ability to solve hard and diverse problems showcases true mastery. You're at the peak of coding skills!" }
    ];

    const currentLevel = levels.find(level =>
        weightedPoints >= level.min && weightedPoints <= level.max
    );

    const renderLevelProgression = () => {
        return levels.map((level, index) => {
            let progress = 0;
            let isCurrentLevel = false;
            let isLevelCompleted = false;

            if (weightedPoints >= level.min && weightedPoints <= level.max) {
                isCurrentLevel = true;
                const prevLevelMax = index > 0 ? levels[index - 1].max : 0;
                const totalLevelRange = level.max - prevLevelMax;
                progress = ((weightedPoints - prevLevelMax) / totalLevelRange) * 100;
            } else if (weightedPoints > level.max) {
                progress = 100;
                isLevelCompleted = true;
            }

            // Special condition for Master level
            if (level.name === 'Master') {
                progress = level.hardRequirement
                    ? Math.min((hard / level.hardRequirement) * 100, 100)
                    : progress;
                isLevelCompleted = hard >= level.hardRequirement;
            }

            return (
                <div key={level.name} className="flex items-center mb-3 relative">
                    <div className="w-24 mr-4">
                        <p className={`text-sm font-semibold ${isCurrentLevel ? 'text-purple-700' : 'text-gray-500'}`}>
                            {level.name}
                        </p>
                    </div>
                    <div className="flex-grow bg-gray-200 rounded-full h-3 mr-2">
                        <div
                            className={`h-3 rounded-full ${level.color}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="w-12 text-right flex items-center justify-end">
                        <span className="text-xs text-gray-600 mr-2">
                            {progress.toFixed(0)}%
                        </span>
                        {isLevelCompleted && (
                            <CheckCircle
                                size={18}
                                className="text-green-500"
                                strokeWidth={2.5}
                            />
                        )}
                    </div>
                </div>
            );
        });
    };

    const renderProgressionImpact = () => {
        const nextLevel = levels[levels.indexOf(currentLevel) + 1] || levels[levels.length - 1];
        const pointsToNextLevel = nextLevel.max - weightedPoints;

        // More precise progress percentage calculation
        const progressPercentage = ((weightedPoints - currentLevel.min) /
            (currentLevel.max - currentLevel.min)) * 100;

        return (
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-purple-700 mb-2">Current Level Progress</p>
                        <div className="bg-white rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-purple-600 h-full rounded-full"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-purple-500 mt-1">
                            {progressPercentage.toFixed(0)}% through {currentLevel.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-purple-700 mb-2">Points to Next Level</p>
                        <div className="bg-white p-3 rounded-lg">
                            <p className="text-xl font-bold text-purple-800">
                                {pointsToNextLevel > 0 ? pointsToNextLevel.toFixed(1) : 'Level Completed!'}
                            </p>
                            <p className="text-xs text-purple-500">
                                {nextLevel.name} awaits!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 bg-white p-4 rounded-lg">
                    <p className="text-sm text-purple-700 mb-2">Recommended Next Steps</p>
                    <ul className="list-disc list-inside text-xs text-gray-700">
                        <li>Focus on {nextLevel.name === 'Master' ? 'hard' : 'medium'} difficulty problems</li>
                        <li>Aim to solve {Math.ceil(pointsToNextLevel / 2)} more problems</li>
                        <li>Participate in coding contests</li>
                    </ul>
                </div>
            </div>
        );
    };

    const calculateTotalStats = () => {
        return {
            totalEasy: easy,
            totalMedium: medium,
            totalHard: hard,
            totalSolved: easy + medium + hard,
            totalWeightedPoints: weightedPoints
        };
    };

    const totalStats = calculateTotalStats();

    return (
        <div className="max-w-4xl mx-auto bg-purple-100 shadow-2xl rounded-2xl overflow-hidden grid grid-cols-3 gap-0">
            <div className="col-span-2 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-purple-700 flex items-center">
                            <CodeIcon className="mr-3 text-purple-500" size={32} />
                            {username}
                        </h2>
                        <p className="text-gray-500 text-lg">Coding Journey Tracker</p>
                    </div>
                    <Trophy color="#FFD700" size={50} />
                </div>

                <div className="flex mb-4 border-b">
                    <button
                        className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'progress' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('progress')}
                    >
                        Progress Details
                    </button>
                </div>

                {activeTab === 'overview' ? (
                    <>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-gray-500">Total Solved</p>
                                <p className="text-2xl font-bold text-purple-700">{totalQuestionsSolved}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-gray-500">Contests</p>
                                <p className="text-2xl font-bold text-green-700">{attendedContestsCount}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-gray-500">Rating</p>
                                <p className="text-2xl font-bold text-blue-700">{contestRating}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-green-200 p-3 rounded-lg">
                                <p className="text-green-600 font-bold">Easy</p>
                                <p className="text-xl">{easy}</p>
                            </div>
                            <div className="bg-yellow-200 p-3 rounded-lg">
                                <p className="text-yellow-600 font-bold">Medium</p>
                                <p className="text-xl">{medium}</p>
                            </div>
                            <div className="bg-red-200 p-3 rounded-lg">
                                <p className="text-red-600 font-bold">Hard</p>
                                <p className="text-xl">{hard}</p>
                            </div>
                        </div>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            Weighted Points: <span className="font-bold text-purple-700">{weightedPoints.toFixed(1)}</span>
                        </div>
                    </>
                ) : (
                    renderProgressionImpact()
                )}
            </div>

            <div className="col-span-1 bg-gradient-to-br from-purple-200 to-purple-400 text-white p-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-2xl font-bold">Level Progression</h4>
                    <Award size={40} className="text-yellow-300" />
                </div>
                {renderLevelProgression()}

                {currentLevel.name === 'Master' && (
                    <div className="mt-6 bg-purple-700 rounded-lg p-4 shadow-lg">
                        <h5 className="text-xl font-bold mb-3 flex items-center">
                            <Star className="mr-2 text-yellow-300" />
                            Master Level Achieved!
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-sm text-purple-200">Total Solved</p>
                                <p className="font-bold">{totalStats.totalSolved}</p>
                            </div>
                            <div>
                                <p className="text-sm text-purple-200">Weighted Points</p>
                                <p className="font-bold">{totalStats.totalWeightedPoints.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserLevelCard;