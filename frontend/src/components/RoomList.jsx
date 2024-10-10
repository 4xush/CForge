import React, { useContext } from 'react';
import useUserRooms from '../hooks/useUserRooms';
import { Plus } from 'lucide-react';
import { RoomContext } from '../context/RoomContext';

const RoomList = ({ setRoomFormVisible, setRefreshRooms, refreshRooms }) => {
    const { rooms, error } = useUserRooms(refreshRooms);
    const personDP = 'https://avatar.iran.liara.run/username?username=[firstname+lastname]';
    const { setSelectedRoom } = useContext(RoomContext);

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
    };

    return (
        <>
            <h2 className="text-lg mb-3 flex items-center">
                Rooms
            </h2>
            {error && <div className="text-red-500">Error: {error}</div>}
            {rooms.map((room, index) => (
                <div
                    key={room.id || index}
                    className="flex items-center mb-2 cursor-pointer"
                    onClick={() => handleRoomClick(room)}
                >
                    <img src={personDP} alt={room.name} className="w-6 h-6 rounded-full mr-2" />
                    <span className="text-sm">{room.name}</span>
                </div>
            ))}
            <button
                className="mt-3 flex items-center text-orange-500 text-sm"
                onClick={() => setRoomFormVisible(true)}
            >
                <Plus className="mr-2" size={16} />
                Create or Join Room
            </button>
        </>
    );
};

export default RoomList;