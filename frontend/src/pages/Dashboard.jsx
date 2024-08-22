import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Settings, HelpCircle, Plus, Bell, Menu } from 'lucide-react';
import profileImage from '../assets/logo.png'; // Adjust the path accordingly

const CForgeUI = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // State to manage the active tab
    const [leaderboardData, setLeaderboardData] = useState([]);

    // Function to fetch leaderboard data from the backend
    const fetchLeaderboardData = async () => {
        try {
            const response = await fetch('/api/leaderboard'); // Adjust the endpoint
            const data = await response.json();
            setLeaderboardData(data);
        } catch (error) {
            console.error('Error fetching leaderboard data:', error);
        }
    };

    // Fetch leaderboard data when the tab is changed to 'leaderboard'
    useEffect(() => {
        if (activeTab === 'leaderboard') {
            fetchLeaderboardData();
        }
    }, [activeTab]);

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-300">
            {/* Mobile Menu Button */}
            <button
                className="md:hidden p-4 text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <Menu />
            </button>

            {/* Left Sidebar */}
            <div className={`w-full md:w-64 bg-gray-800 p-4 flex flex-col ${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
                <h1 className="text-2xl font-bold mb-8 text-white">CForge</h1>
                <div className="flex-1">
                    <div className="flex items-center mb-4 text-purple-500">
                        <MessageSquare className="mr-2" />
                        <span>Rooms</span>
                        <span className="ml-auto bg-green-500 text-xs px-2 rounded-full">08</span>
                    </div>
                    <div className="flex items-center mb-4 text-blue-500">
                        <MessageSquare className="mr-2" />
                        <span>Messages</span>
                        <span className="ml-auto bg-pink-500 text-xs px-2 rounded-full">68</span>
                    </div>
                    <div className="flex items-center mb-4">
                        <Settings className="mr-2" />
                        <span>Settings</span>
                        <span className="ml-auto bg-purple-500 text-xs px-2 rounded-full">15</span>
                    </div>
                </div>
                <div className="mt-auto flex items-center">
                    <HelpCircle className="mr-2" />
                    <span>Help</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="bg-gray-800 p-4 flex items-center">
                    <div className="flex-1 mx-4">
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                        />
                    </div>
                    <img src="/api/placeholder/40/40" alt="User" className="w-10 h-10 rounded-full" />
                    <span className="ml-2 hidden md:inline">Mark Wood</span>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col md:flex-row">
                    {/* Rooms List */}
                    <div className="w-full md:w-64 bg-gray-800 p-4">
                        <h2 className="text-xl mb-4 flex items-center">
                            <MessageSquare className="mr-2" />
                            Rooms
                        </h2>
                        {['Room1', 'Room2'].map((name, index) => (
                            <div key={index} className="flex items-center mb-2">
                                <img src={profileImage} alt={name} className="w-8 h-8 rounded-full mr-2" />
                                <span>{name}</span>
                            </div>
                        ))}
                        <button className="mt-4 flex items-center text-orange-500">
                            <Plus className="mr-2" />
                            Add Rooms
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col bg-gray-900">
                        <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
                            <div>
                                <h2 className="text-xl font-bold text-gray-300">CODE SOMETIMES</h2>
                                <p className="text-sm text-gray-500">15 Members</p>
                            </div>
                            <div className="flex items-center">
                                <Search className="mr-4 text-gray-500" />
                                <Bell className="text-gray-500" />
                            </div>
                        </div>
                        <div className="flex border-b border-gray-700">
                            <button
                                className={`px-4 py-2 ${activeTab === 'chat' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                                onClick={() => setActiveTab('chat')}
                            >
                                Chat
                            </button>
                            <button
                                className={`px-4 py-2 ${activeTab === 'leaderboard' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                                onClick={() => setActiveTab('leaderboard')}
                            >
                                Leaderboard
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
                            {activeTab === 'chat' ? (
                                <>
                                    {/* Chat Messages */}
                                    <div className="flex items-start mb-4">
                                        <img src="/api/placeholder/40/40" alt="Jessica" className="w-10 h-10 rounded-full mr-3" />
                                        <div>
                                            <div className="flex items-center">
                                                <span className="font-semibold text-gray-300 mr-2">Jessica</span>
                                                <span className="text-xs text-gray-500">09:45 AM</span>
                                            </div>
                                            <p className="bg-gray-800 rounded-lg p-3 inline-block">Hi everyone, I'm excited to be here for our demo chat! 🎉</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start mb-4">
                                        <img src="/api/placeholder/40/40" alt="Emily" className="w-10 h-10 rounded-full mr-3" />
                                        <div>
                                            <div className="flex items-center">
                                                <span className="font-semibold text-gray-300 mr-2">Emily</span>
                                                <span className="text-xs text-gray-500">09:46 AM</span>
                                            </div>
                                            <p className="bg-gray-800 rounded-lg p-3 inline-block">Hey Jessica, great to see you here! Looking forward to our discussion.</p>
                                        </div>
                                    </div>
                                    <div className="text-center text-sm text-gray-500 my-2">Today</div>
                                    <div className="flex items-start mb-4">
                                        <img src="/api/placeholder/40/40" alt="Ryan" className="w-10 h-10 rounded-full mr-3" />
                                        <div>
                                            <div className="flex items-center">
                                                <span className="font-semibold text-gray-300 mr-2">Ryan</span>
                                                <span className="text-xs text-gray-500">09:46 AM</span>
                                            </div>
                                            <p className="bg-gray-800 rounded-lg p-3 inline-block">Hi Jessica and Emily! Glad to join the conversation.</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Leaderboard */}
                                    <h2 className="text-xl font-bold text-gray-300 mb-4">Leaderboard</h2>
                                    <div className="bg-gray-800 p-4 rounded-lg">
                                        {leaderboardData.length === 0 ? (
                                            <p className="text-gray-500">Loading...</p>
                                        ) : (
                                            <ul>
                                                {leaderboardData.map((entry, index) => (
                                                    <li key={index} className="flex items-center mb-2">
                                                        <span className="text-gray-300 mr-2">{index + 1}.</span>
                                                        <span className="text-gray-300">{entry.username}</span>
                                                        <span className="ml-auto text-gray-500">{entry.score}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-full md:w-64 bg-gray-800 p-4">
                        <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                            #
                        </div>
                        <h2 className="text-xl mb-2">Code Sometimes</h2>
                        <p className="text-sm mb-4">15 Members</p>
                        <p className="text-sm mb-4">
                            This channel is your space to collaborate, brainstorm, and discuss all things design-related with your fellow...
                            <span className="text-blue-500">More</span>
                        </p>
                        <h3 className="text-lg mb-2">Group Members</h3>
                        {['Person1', 'Person2'].map((name, index) => (
                            <div key={index} className="flex items-center mb-2">
                                <img src={profileImage} alt={name} className="w-6 h-6 rounded-full mr-2" />
                                <span>{name}</span>
                            </div>
                        ))}
                        <button className="mt-4 flex items-center text-orange-500">
                            <Plus className="mr-2" />
                            Add Member
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CForgeUI;
