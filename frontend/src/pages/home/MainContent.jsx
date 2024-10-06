import React from 'react';
import Leaderboard from '../../components/Leaderboard';
import Chat from '../../components/Chat';

const MainContent = ({ activeTab, setActiveTab, isMobile }) => {
    return (
        <div className="flex-1 flex flex-col bg-gray-900">
            <div className="bg-gray-800 py-2 px-4 flex items-center justify-between border-b border-gray-700">
                <div>
                    <h2 className="text-lg font-bold text-gray-300">CODE SOMETIMES</h2>
                    <p className="text-xs text-gray-500">15 Members</p>
                </div>
            </div>
            <div className="flex border-b border-gray-700">
                <button
                    className={`px-4 py-1 text-sm ${activeTab === 'leaderboard' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('leaderboard')}
                >
                    Leaderboard
                </button>
                <button
                    className={`px-4 py-1 text-sm ${activeTab === 'chat' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('chat')}
                >
                    Chat
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
                {activeTab === 'leaderboard' ? <Leaderboard isMobile={isMobile} /> : <Chat />}
            </div>
        </div>
    );
};

export default MainContent;
