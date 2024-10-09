import { useState } from 'react';
import axios from 'axios';
import { useRoomContext } from '../context/RoomContext';
import useRoomDetails from './useRoomDetails';

const useTopBar = () => {
    const { selectedRoom, setSelectedRoom } = useRoomContext();
    const [showMenu, setShowMenu] = useState(false);
    const [showRoomDetails, setShowRoomDetails] = useState(false);
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

    // Check if selectedRoom exists before passing roomId
    const { roomDetails, loading, error } = useRoomDetails(selectedRoom?.roomId || null);

    const toggleMenu = () => setShowMenu(!showMenu);

    const handleRoomDetailsClick = () => {
        setShowRoomDetails(true);
        setShowMenu(false);
    };

    const handleLeaveRoomClick = () => {
        setShowLeaveConfirmation(true);
        setShowMenu(false);
    };

    const handleLeaveRoom = async () => {
        if (!selectedRoom?.roomId) {
            return { success: false, message: "No room selected." };
        }

        const token = localStorage.getItem('token');
        if (!token) {
            return { success: false, message: "Authentication failed. Please log in." };
        }

        try {
            await axios.post(`http://localhost:5000/api/rooms/${selectedRoom.roomId}/leave`, null, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSelectedRoom(null);
            setShowLeaveConfirmation(false);
            return { success: true, message: "You have successfully left the room." };
        } catch (error) {
            console.error('Error leaving room:', error);
            setShowLeaveConfirmation(false);
            return { success: false, message: "Failed to leave the room. Please try again." };
        }
    };

    return {
        selectedRoom,
        roomDetails,
        loading,
        error,
        showMenu,
        showRoomDetails,
        showLeaveConfirmation,
        toggleMenu,
        handleRoomDetailsClick,
        handleLeaveRoomClick,
        handleLeaveRoom,
        setShowRoomDetails,
        setShowLeaveConfirmation,
    };
};

export default useTopBar;
