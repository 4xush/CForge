import { useState } from 'react';
import api from '../config/api';

const useLeaveRoom = (selectedRoom, setSelectedRoom, setShowLeaveConfirmation) => {
  const [loading, setLoading] = useState(false);

  const handleLeaveRoom = async () => {
    if (!selectedRoom?.roomId) {
      return { success: false, message: "No room selected." };
    }

    setLoading(true);
    try {
      await api.delete(`/rooms/${selectedRoom.roomId}/leave`);
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