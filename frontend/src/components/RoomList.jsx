// src/components/RoomList.jsx
import React from 'react';
import useUserRooms from '../hooks/useUserRooms';
import { Plus } from 'lucide-react';

const RoomList = ({ setCreateRoomVisible, setRefreshRooms, refreshRooms, onRoomClick }) => {
    const { rooms, error } = useUserRooms(refreshRooms);
    const personDP = 'https://avatar.iran.liara.run/username?username=[firstname+lastname]';
    return (
        <>
            <h2 className="text-lg mb-3 flex items-center">
                Rooms
            </h2>

            {error && <div className="text-red-500">Error: {error}</div>}

            {rooms.length > 0 ? (
                rooms.map((room) => (
                    <div
                        key={room.id}
                        className="flex items-center mb-2 cursor-pointer"
                        onClick={() => onRoomClick(room)} // Notify parent on room click
                    >
                        <img src={personDP} alt={room.name} className="w-6 h-6 rounded-full mr-2" />
                        <span className="text-sm">{room.name}</span>
                    </div>
                ))
            ) : (
                <div className="text-sm text-gray-400">No rooms available</div>
            )}

            <button className="mt-3 flex items-center text-orange-500 text-sm" onClick={() => setCreateRoomVisible(true)}>
                <Plus className="mr-2" size={16} />
                Add Rooms
            </button>
        </>
    );
};

export default RoomList;
