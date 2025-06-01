import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainContent from '../components/MainContent';
import ChatWithWebSocket from '../components/Messages/ChatWithWebSocket';
import { useRoomContext } from '../context/RoomContext';
import { WebSocketProvider } from '../context/WebSocketContext';
import { Spinner } from '../components/ui/Spinner';
import { AlertCircle } from 'lucide-react';

const RoomChat = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { loadCurrentRoomDetails, currentRoomDetails, currentRoomLoading, currentRoomError } = useRoomContext();

    useEffect(() => {
        if (roomId) {
            loadCurrentRoomDetails(roomId);
        }
    }, [roomId, loadCurrentRoomDetails]);

    // Handle errors by showing an error message with option to go back
    if (currentRoomError) {
        return (
            <MainContent>
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-6 max-w-md text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Room</h2>
                        <p className="text-gray-400 mb-6">{currentRoomError}</p>
                        <button
                            onClick={() => navigate('/rooms')}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                        >
                            Back to Rooms
                        </button>
                    </div>
                </div>
            </MainContent>
        );
    }

    // Loading state
    if (currentRoomLoading && !currentRoomDetails) {
        return (
            <MainContent>
                <div className="flex flex-col items-center justify-center h-full">
                    <Spinner size="lg" />
                    <p className="text-gray-400 mt-4">Loading room...</p>
                </div>
            </MainContent>
        );
    }

    return (
        <WebSocketProvider>
            <MainContent>
                <ChatWithWebSocket />
            </MainContent>
        </WebSocketProvider>
    );
};

export default RoomChat;