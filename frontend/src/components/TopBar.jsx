import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, X, LogOut } from 'lucide-react';
import RoomDetails from './RoomDetails';
import { useRoomContext } from '../context/RoomContext';
import useRoomDetails from '../hooks/useRoomDetails';
import ConfirmDialog from './ui/ConfirmDialog';
import { showToast } from '../utils/toast';
import useLeaveRoom from '../hooks/useLeaveRoom';

const TopBar = ({ setRefreshRooms }) => { // Accept setRefreshRooms as a prop
    const { selectedRoom, setSelectedRoom } = useRoomContext();
    const [showMenu, setShowMenu] = useState(false);
    const [showRoomDetails, setShowRoomDetails] = useState(false);
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
    const menuRef = useRef(null);
    const roomDetailsRef = useRef(null);

    const { roomDetails, loading, error } = useRoomDetails(selectedRoom?.roomId);
    const { handleLeaveRoom } = useLeaveRoom(selectedRoom, setSelectedRoom, setShowLeaveConfirmation);

    const toggleMenu = () => setShowMenu(!showMenu);

    const handleRoomDetailsClick = () => {
        setShowRoomDetails(true);
        setShowMenu(false);
    };

    const handleLeaveRoomClick = () => {
        setShowLeaveConfirmation(true);
        setShowMenu(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                roomDetailsRef.current &&
                !roomDetailsRef.current.contains(event.target)
            ) {
                setShowRoomDetails(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowRoomDetails]);

    const onLeaveRoom = async () => {
        const result = await handleLeaveRoom();
        showToast({
            title: result.success ? "Room Left" : "Error",
            description: result.message,
            variant: result.success ? "success" : "destructive",
        });

        if (result.success) {
            setRefreshRooms(prev => !prev); // Trigger room list refresh on success
        }
    };

    return (
        <div className="bg-gray-800 py-0.75 px-4 flex items-center justify-between border-b border-gray-700 relative">
            <div>
                <h2 className="text-lg font-bold text-gray-300">
                    {selectedRoom ? selectedRoom.name : 'No Room Selected'}
                </h2>
                <p className="text-xs text-gray-500">
                    {roomDetails ? `${roomDetails.members.length} Members` : '0 Members'}
                </p>
            </div>
            {!showRoomDetails && (
                <button onClick={toggleMenu} className="text-gray-300">
                    <MoreVertical size={24} />
                </button>
            )}
            {showMenu && (
                <div ref={menuRef} className="absolute right-4 top-12 w-40 bg-gray-700 text-gray-300 rounded-lg shadow-lg z-10">
                    <ul>
                        <li
                            className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer"
                            onClick={handleRoomDetailsClick}
                        >
                            Room Details
                        </li>
                        <li
                            className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer text-red-400 flex items-center"
                            onClick={handleLeaveRoomClick}
                        >
                            <LogOut size={16} className="mr-2" />
                            Leave Room
                        </li>
                    </ul>
                </div>
            )}
            {showRoomDetails && selectedRoom && (
                <div
                    ref={roomDetailsRef}
                    className="fixed right-0 top-0 h-full w-64 bg-gray-800 text-gray-300 shadow-lg z-20 transition-transform duration-300 ease-in-out transform translate-x-0"
                >
                    <button
                        onClick={() => setShowRoomDetails(false)}
                        className="absolute top-2 right-2 text-gray-300"
                    >
                        <X size={24} />
                    </button>
                    <RoomDetails roomDetails={roomDetails} loading={loading} error={error} />
                </div>
            )}
            <ConfirmDialog
                isOpen={showLeaveConfirmation}
                onClose={() => setShowLeaveConfirmation(false)}
                onConfirm={onLeaveRoom}
                title="Leave Room"
                message="Are you sure you want to leave this room? You'll need to be invited back to rejoin."
            />
        </div>
    );
};

export default TopBar;
