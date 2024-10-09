import React, { useState, useContext } from 'react';
import RoomList from './RoomList';
import MessageList from './MessageList';
import CreateRoomForm from './CreateRoomForm';
import { DashboardContext } from '../context/DashboardContext';
import { useRoomContext } from '../context/RoomContext'; // Import RoomContext

const LeftSlider = ({ isRoomsListVisible, setIsRoomsListVisible }) => {
    const [refreshRooms, setRefreshRooms] = useState(false);
    const [isCreateRoomVisible, setCreateRoomVisible] = useState(false);
    const { activeSection } = useContext(DashboardContext);
    const { setSelectedRoom } = useRoomContext(); // Use RoomContext

    const handleRoomSelection = (room) => {
        setSelectedRoom(room); // Set selected room from context
        setIsRoomsListVisible(false);
    };

    return (
        <>
            <div
                className={`absolute left-full top-0 h-full w-48 bg-gray-800 p-3 transition-transform duration-300 ease-in-out transform ${isRoomsListVisible ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    boxShadow: isRoomsListVisible ? '5px 0 10px rgba(0,0,0,0.1)' : 'none',
                }}
            >
                {/* Conditional rendering based on active section */}
                {activeSection === 'rooms' ? (
                    <RoomList
                        setCreateRoomVisible={setCreateRoomVisible}
                        setRefreshRooms={setRefreshRooms}
                        refreshRooms={refreshRooms}
                        onRoomClick={handleRoomSelection} // Handle room click
                    />
                ) : (
                    <MessageList />
                )}
            </div>

            {/* Modal for creating a new room */}
            {isCreateRoomVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="relative w-full max-w-lg">
                        <CreateRoomForm
                            onClose={() => setCreateRoomVisible(false)}
                            onRoomCreated={() => {
                                setCreateRoomVisible(false);
                                setRefreshRooms(prev => !prev); // Refresh room list
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default LeftSlider;
