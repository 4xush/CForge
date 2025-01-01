import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import TopBar from './TopBar';
import { useRoomContext } from '../context/RoomContext';

const MainContent = ({ children }) => {
    const { refreshRoomList, selectedRoom } = useRoomContext();
    const location = useLocation();
    const { roomId } = useParams();

    const isLeaderboardActive = location.pathname.endsWith('/leaderboard');
    const isChatActive = location.pathname.endsWith('/chat');

    return (
        <div className="flex-1 flex flex-col bg-gray-900">
            <TopBar setRefreshRooms={refreshRoomList} />
            <div className="flex border-b border-gray-700">
                <Link
                    to={`/rooms/${roomId}/leaderboard`}
                    className={`px-4 py-1 text-sm ${isLeaderboardActive ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                >
                    Leaderboard
                </Link>
                <Link
                    to={`/rooms/${roomId}/chat`}
                    className={`px-4 py-1 text-sm ${isChatActive ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                >
                    Chat
                </Link>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
                {children}
            </div>
        </div>
    );
};

export default MainContent;

