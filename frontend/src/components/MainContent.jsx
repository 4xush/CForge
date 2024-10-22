import React from 'react';
// import Leaderboard from './Leaderboard';
import Leaderboard from './Leaderboard/CodingDashboard';
import Chat from './Chat';
import TopBar from './TopBar';
import { useRoomContext } from '../context/RoomContext';

const MainContent = ({ activeTab, setActiveTab, isMobile }) => {
    const { refreshRoomList } = useRoomContext();
    const { selectedRoom } = useRoomContext();
    return (
        <div className="flex-1 flex flex-col bg-gray-900">
            <TopBar setRefreshRooms={refreshRoomList} /> {/* Pass refreshRoomList to TopBar */}
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
                {activeTab === 'leaderboard' ? <Leaderboard selectedRoom={selectedRoom} isMobile={isMobile} /> : <Chat />}
            </div>
        </div>
    );
};

export default MainContent;
