import React, { useContext } from 'react';
import { RoomContext } from '../context/RoomContext';
import { Plus } from 'lucide-react';

const RoomList = ({ setRoomFormVisible }) => {
    const { rooms, setSelectedRoom } = useContext(RoomContext);

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
    };

    return (
        <>
            <h2 className="text-lg mb-3 flex items-center">Rooms</h2>
            {rooms.map((room, index) => (
                <div
                    key={room.id || index}
                    className="flex items-center mb-2 cursor-pointer"
                    onClick={() => handleRoomClick(room)}
                >
                    <img src={`https://avatar.iran.liara.run/username?username=[${room.name}]`} alt={room.name} className="w-6 h-6 rounded-full mr-2" />
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
