import React, { useState, useContext } from 'react';
import RoomList from './RoomList';
import MessageList from './MessageList';
import RoomFormContainer from './RoomForm';
import { DashboardContext } from '../context/DashboardContext';
import { useRoomContext } from '../context/RoomContext';

const LeftSlider = ({ isRoomsListVisible, setIsRoomsListVisible }) => {
    const [isRoomFormVisible, setRoomFormVisible] = useState(false);
    const { activeSection } = useContext(DashboardContext);
    const { setSelectedRoom, refreshRoomList } = useRoomContext(); // Access refreshRoomList directly

    const handleRoomSelection = (room) => {
        setSelectedRoom(room);
        setIsRoomsListVisible(false);
    };

    const handleRoomCreatedOrJoined = () => {
        setRoomFormVisible(false);
        refreshRoomList(); // Trigger room list refresh
    };

    return (
        <>
            <div
                className={`absolute left-full top-0 h-full w-48 bg-gray-800 p-3 transition-transform duration-300 ease-in-out transform ${isRoomsListVisible ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    boxShadow: isRoomsListVisible ? '5px 0 10px rgba(0,0,0,0.1)' : 'none',
                }}
            >
                {activeSection === 'rooms' ? (
                    <RoomList
                        setRoomFormVisible={setRoomFormVisible}
                        onRoomClick={handleRoomSelection}
                    />
                ) : (
                    <MessageList />
                )}
            </div>
            {isRoomFormVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="relative w-full max-w-lg">
                        <RoomFormContainer
                            onClose={() => setRoomFormVisible(false)}
                            onRoomCreated={handleRoomCreatedOrJoined}
                            onRoomJoined={handleRoomCreatedOrJoined}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default LeftSlider;
