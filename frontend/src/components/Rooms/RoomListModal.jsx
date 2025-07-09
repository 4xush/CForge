import { useState, useEffect } from 'react';
import { X, Users, Calendar, ChevronRight } from 'lucide-react';
import { useRoomContext } from '../../context/RoomContext';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const RoomListModal = ({ isOpen, onClose }) => {
    const { rooms, currentRoomDetails } = useRoomContext();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRooms, setFilteredRooms] = useState(rooms);

    useEffect(() => {
        if (searchTerm) {
            setFilteredRooms(
                rooms.filter(room =>
                    room.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredRooms(rooms);
        }
    }, [searchTerm, rooms]);

    const handleRoomClick = (room) => {
        navigate(`/rooms/${room.roomId}/leaderboard`);
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            {/* Modal positioned for both mobile and desktop */}
            <div 
                className={`
                    w-full max-w-md mx-auto
                    max-h-[80vh] md:max-h-[70vh]
                    bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900
                    border border-gray-700/50 rounded-xl shadow-2xl
                    transform transition-all duration-300 ease-out
                    ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
                    flex flex-col
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <Users className="text-orange-500" size={18} />
                        <h2 className="text-lg font-semibold text-white">All Rooms</h2>
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                            {rooms.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors duration-200 group"
                    >
                        <X className="text-gray-400 group-hover:text-white" size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-700/30 flex-shrink-0">
                    <input
                        type="text"
                        placeholder="Search rooms..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg 
                                 text-white placeholder-gray-400 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50
                                 transition-all duration-200"
                    />
                </div>

                {/* Room List - Scrollable with fixed height */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-2 space-y-1">
                        {filteredRooms.length > 0 ? (
                            filteredRooms.map((room, index) => (
                                <button
                                    key={room.id || index}
                                    onClick={() => handleRoomClick(room)}
                                    className={`
                                        w-full p-3 rounded-lg text-left transition-all duration-200
                                        hover:bg-gray-700/50 hover:scale-[1.02] hover:shadow-lg
                                        group relative overflow-hidden
                                        ${currentRoomDetails?.roomId === room.roomId
                                            ? 'bg-gradient-to-r from-orange-600/20 to-orange-500/10 border border-orange-500/30' 
                                            : 'bg-gray-700/20 hover:bg-gray-700/40'
                                        }
                                    `}
                                >
                                    {/* Active room indicator */}
                                    {currentRoomDetails?.roomId === room.roomId && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full" />
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <span className={`
                                                    text-sm font-medium truncate
                                                    ${currentRoomDetails?.roomId === room.roomId 
                                                        ? 'text-orange-300' 
                                                        : 'text-white group-hover:text-orange-300'
                                                    }
                                                `}>
                                                    {room.name}
                                                </span>
                                                {currentRoomDetails?.roomId === room.roomId && (
                                                    <span className="text-xs text-orange-400 font-medium">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Room metadata */}
                                            <div className="flex items-center space-x-3 mt-1">
                                                {room.memberCount && (
                                                    <div className="flex items-center space-x-1">
                                                        <Users className="text-gray-400" size={12} />
                                                        <span className="text-xs text-gray-400">
                                                            {room.memberCount}
                                                        </span>
                                                    </div>
                                                )}
                                                {room.createdAt && (
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="text-gray-400" size={12} />
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(room.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <ChevronRight 
                                            className={`
                                                transition-all duration-200 group-hover:translate-x-1
                                                ${currentRoomDetails?.roomId === room.roomId 
                                                    ? 'text-orange-400' 
                                                    : 'text-gray-400 group-hover:text-orange-400'
                                                }
                                            `} 
                                            size={14} 
                                        />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Users className="mx-auto text-gray-500 mb-2" size={32} />
                                <p className="text-gray-400 text-sm">
                                    {searchTerm ? 'No rooms found' : 'No rooms available'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700/30 flex-shrink-0">
                    <div className="text-center">
                        <span className="text-xs text-gray-400">
                            {filteredRooms.length} of {rooms.length} rooms
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

RoomListModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default RoomListModal;
