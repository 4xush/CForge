import React, { useContext, useEffect } from 'react';
import { useRoomContext } from '../context/RoomContext'; // Adjust the import path as needed
import { Link } from 'react-router-dom';
import InviteModal from '../components/InviteRoomJoin/InviteModal';

const RoomComponent = () => {
    const { rooms, loading, error, refreshRoomList } = useRoomContext();

    // Refresh room list on component mount
    useEffect(() => {
        refreshRoomList();
    }, [refreshRoomList]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 text-red-500">
                {error}
            </div>
        );
    }

    return (

        <div className="bg-gray-900 min-h-screen p-8 text-white">
            <InviteModal />
            <h1 className="text-3xl font-bold mb-8">Your Rooms</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.length > 0 ? (
                    rooms.map((room) => (
                        <div
                            key={room._id}
                            className="bg-gray-800 rounded-lg shadow-lg p-6 hover:bg-gray-700 transition-colors"
                        >
                            <h2 className="text-xl font-semibold mb-2">{room.name}</h2>
                            <p className="text-gray-400 mb-4">{room.description || 'No description provided.'}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">
                                    {room.isPublic ? 'Public' : 'Private'}
                                </span>
                                <Link
                                    to={`/rooms/${room.roomId}/leaderboard`}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                                >
                                    Enter Room
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-gray-400">You haven't joined any rooms yet.</div>
                )}
            </div>
        </div>
    );
};

export default RoomComponent;