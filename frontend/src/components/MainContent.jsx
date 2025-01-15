import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import TopBar from './TopBar';

const MainContent = ({ children }) => {
    const location = useLocation();
    const { roomId } = useParams();
    const isLeaderboardActive = location.pathname.endsWith('/leaderboard');
    const isChatActive = location.pathname.endsWith('/chat');

    return (
        <div className="flex-1 flex flex-col h-screen bg-gray-900">
            {/* Fixed header section */}
            <div className="flex-none">
                <TopBar roomId={roomId} />

                <div className="flex border-b border-gray-700 bg-gray-900 ">
                    <Link
                        to={`/rooms/${roomId}/leaderboard`}
                        className={`px-4 py-1 text-sm hover:bg-gray-800 transition-colors duration-200 ${isLeaderboardActive
                            ? 'text-blue-500 border-b-2 border-blue-500'
                            : 'text-gray-500'
                            }`}
                    >
                        Leaderboard
                    </Link>
                    <Link
                        to={`/rooms/${roomId}/chat`}
                        className={`px-4 py-1 text-sm hover:bg-gray-800 transition-colors duration-200 ${isChatActive
                            ? 'text-blue-500 border-b-2 border-blue-500'
                            : 'text-gray-500'
                            }`}
                    >
                        Chat
                    </Link>
                </div>
            </div>

            {/* Content area - takes remaining height */}
            <div className="flex-1 p-4 overflow-hidden bg-gray-900">
                {children}
            </div>
        </div>
    );
};

export default MainContent;
