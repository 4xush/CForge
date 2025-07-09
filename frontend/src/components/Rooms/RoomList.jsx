import { useState } from 'react';
import { useRoomContext } from '../../context/RoomContext';
import { Plus, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import RoomListModal from './RoomListModal';

const RoomList = ({ setRoomFormVisible }) => {
    const { 
        rooms, 
        currentRoomDetails
    } = useRoomContext();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const visibleRooms = rooms.slice(0, 2);
    const hasMoreRooms = rooms.length > 2;

    const handleRoomClick = (room) => {
        navigate(`/rooms/${room.roomId}/leaderboard`);
    };

    const handleShowMoreClick = () => {
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="pl-6 relative">
                {/* Main vertical branch */}
                <div className="absolute left-3 top-0 bottom-0 border-l-2 border-dotted border-orange-500/50" />
                
                {/* Room list with branching connections */}
                <div className="space-y-2">
                    {/* Scrollable container for mobile when expanded */}
                    <div className="space-y-2">
                        {visibleRooms.map((room, index) => (
                            <div key={room.id || index} className="relative">
                                {/* Horizontal branch to room */}
                                <div className="absolute left-0 top-1/2 w-4 border-t-2 border-dotted border-orange-500/50 -translate-y-1/2" />
                                <button
                                    onClick={() => handleRoomClick(room)}
                                    className={`ml-6 flex items-center inline-block w-auto space-x-2 px-2 rounded-xl
                                               transition-colors duration-200 ${
                                        currentRoomDetails?.roomId === room.roomId
                                            ? 'bg-orange-600 text-white' // Highlight selected room
                                            : 'bg-gray-700/50 hover:bg-orange-500/20 text-white'
                                    }`}
                                >
                                    <span className="text-sm">{room.name}</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Show More/Less button */}
                    {hasMoreRooms && (
                        <div className="relative">
                            <div className="absolute left-0 top-1/2 w-4 border-t-2 border-dotted border-orange-500/50 -translate-y-1/2" />
                            <button
                                onClick={handleShowMoreClick}
                                className="ml-6 flex items-center space-x-2 px-2 py-1 rounded-lg
                                         hover:bg-orange-500/10 transition-all duration-200 group"
                            >
                                <ChevronDown
                                    className="text-orange-500 group-hover:text-orange-400 transition-colors"
                                    size={16}
                                />
                                <span className="text-xs text-orange-500 group-hover:text-orange-400 transition-colors">
                                    Show {rooms.length - 2} More
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
                            <span className="text-xs text-orange-500">Create or Join Room</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Room List Modal */}
            <RoomListModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </>
    );
};

RoomList.propTypes = {
    setRoomFormVisible: PropTypes.func.isRequired,
};

export default RoomList;
