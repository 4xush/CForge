import React, { useState } from 'react';
import { Plus, PanelRightIcon } from 'lucide-react';
import profileImage from '../../assets/logo.png';
import useUserRooms from '../../hooks/useUserRooms';
import CreateRoomForm from '../CreateRoomForm';  // Import CreateRoomForm

const LeftSlider = ({ isRoomsListVisible, toggleRoomsList }) => {
    const { rooms, error } = useUserRooms();
    const [isCreateRoomVisible, setCreateRoomVisible] = useState(false); // State to manage the modal visibility

    const handleAddRoomClick = (e) => {
        e.stopPropagation(); // Prevent this click from affecting other components
        setCreateRoomVisible(true); // Show the CreateRoomForm when "Add Rooms" is clicked
        toggleRoomsList(false); // Close the slider when opening the form
    };

    const handleCloseCreateRoom = () => {
        setCreateRoomVisible(false); // Close the form
    };

    return (
        <>
            {/* Left Slider Section */}
            <div
                className={`absolute left-full top-0 h-full w-48 bg-gray-800 p-3 transition-transform duration-300 ease-in-out transform ${isRoomsListVisible ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{
                    boxShadow: isRoomsListVisible ? '5px 0 10px rgba(0,0,0,0.1)' : 'none',
                }}
            >
                <h2 className="text-lg mb-3 flex items-center">
                    <PanelRightIcon className="mr-2" size={18} />
                    Rooms
                </h2>

                {/* Show error if any */}
                {error && <div className="text-red-500">Error: {error}</div>}

                {/* Display fetched rooms */}
                {rooms.length > 0 ? (
                    rooms.map((room, index) => (
                        <div key={index} className="flex items-center mb-2">
                            <img src={profileImage} alt={room.name} className="w-6 h-6 rounded-full mr-2" />
                            <span className="text-sm">{room.name}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-gray-400">No rooms available</div>
                )}

                <button className="mt-3 flex items-center text-orange-500 text-sm" onClick={handleAddRoomClick}>
                    <Plus className="mr-2" size={16} />
                    Add Rooms
                </button>
            </div>

            {/* Create Room Modal */}
            {isCreateRoomVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="relative w-full max-w-lg">
                        <div className="absolute top-0 right-0 p-2">
                            <button
                                className="text-gray-400 hover:text-white"
                                onClick={handleCloseCreateRoom}  // Close button
                            >
                                &times;
                            </button>
                        </div>
                        <CreateRoomForm />
                    </div>
                </div>
            )}
        </>
    );
};

export default LeftSlider;
