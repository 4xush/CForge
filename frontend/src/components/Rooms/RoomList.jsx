import React, { useContext, useState } from 'react';
import { RoomContext } from '../../context/RoomContext';
import { Plus, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoomList = ({ setRoomFormVisible }) => {
    const { rooms, selectedRoom, setSelectedRoom } = useContext(RoomContext);
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const visibleRooms = isExpanded ? rooms : rooms.slice(0, 2);
    const hasMoreRooms = rooms.length > 2;

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
        navigate(`/rooms/${room.roomId}/leaderboard`); // Navigate to the room's ID endpoint
    };

    return (
        <div className="pl-6 relative">
            {/* Main vertical branch */}
            <div className="absolute left-3 top-0 bottom-0 border-l-2 border-dotted border-orange-500/50" />

            {/* Room list with branching connections */}
            <div className="space-y-4">
                {visibleRooms.map((room, index) => (
                    <div key={room.id || index} className="relative">
                        {/* Horizontal branch to room */}
                        <div className="absolute left-0 top-1/2 w-4 border-t-2 border-dotted border-orange-500/50 -translate-y-1/2" />
                        <button
                            onClick={() => handleRoomClick(room)}
                            className={`ml-6 flex items-center inline-block w-auto space-x-2 px-2 rounded-xl 
                                transition-colors duration-200 ${selectedRoom?.roomId === room.roomId
                                    ? 'bg-orange-600 text-white' // Highlight selected room
                                    : 'bg-gray-700/50 hover:bg-orange-500/20 text-white'
                                }`}
                        >
                            <span className="text-sm">{room.name}</span>
                        </button>
                    </div>
                ))}

                {/* Expand/Collapse button */}
                {hasMoreRooms && (
                    <div className="relative">
                        <div className="absolute left-0 top-1/2 w-4 border-t-2 border-dotted border-orange-500/50 -translate-y-1/2" />
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="ml-6 flex items-center space-x-2 "
                        >
                            <ChevronDown
                                className={`text-orange-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                size={16}
                            />
                            <span className="text-sm text-orange-500">
                                {isExpanded ? 'Show Less' : `Show ${rooms.length - 2} More`}
                            </span>
                        </button>
                    </div>
                )}

                {/* Create/Join Room button */}
                <div className="relative pb-2">
                    <div className="absolute left-0 top-1/2 w-4 border-t-2 border-dotted border-orange-500/50 -translate-y-1/2" />
                    <button
                        className="ml-6 flex items-center space-x-2 px-3 py-1.5 rounded-xl 
                            bg-gray-700/50 hover:bg-orange-500/20 transition-colors duration-200"
                        onClick={() => setRoomFormVisible(true)}
                    >
                        <Plus className="text-orange-500" size={16} />
                        <span className="text-sm text-orange-500">Create or Join Room</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomList;
