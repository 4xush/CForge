import { useState } from 'react';
import axios from 'axios';

const useLeaveRoom = (selectedRoom, setSelectedRoom, setShowLeaveConfirmation) => {
    const [loading, setLoading] = useState(false);

    const handleLeaveRoom = async () => {
        if (!selectedRoom?.roomId) {
            return { success: false, message: "No room selected." };
        }

        const token = localStorage.getItem('token');
        if (!token) {
            return { success: false, message: "Authentication failed. Please log in." };
        }

        setLoading(true);

        try {
            // Remove the 'null' argument and pass the headers directly
            await axios.delete(`/api/rooms/${selectedRoom.roomId}/leave`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setSelectedRoom(null);
            setShowLeaveConfirmation(false);

            return { success: true, message: "You have successfully left the room." };
        } catch (error) {
            console.error('Error leaving room:', error.response?.data?.message || "Unexpected error");
            setShowLeaveConfirmation(false);
            return { success: false, message: "Failed to leave the room. Please try again." };
        } finally {
            setLoading(false);
        }
    };

    return { handleLeaveRoom, loading };
};

export default useLeaveRoom;
