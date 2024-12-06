import { useContext, useState } from 'react';
import api from '../config/api';
import { RoomContext } from '../context/RoomContext';

const useLeaveRoom = () => {
  const { selectedRoom, setSelectedRoom, refreshRoomList } = useContext(RoomContext);
  const [loading, setLoading] = useState(false);

  const handleLeaveRoom = async () => {
    if (!selectedRoom?.roomId) {
      return { success: false, message: "No room selected." };
    }

    setLoading(true);
    try {
      await api.delete(`/rooms/${selectedRoom.roomId}/leave`);
      setSelectedRoom(null);  
      refreshRoomList(); 
      return { success: true, message: "You have successfully left the room." };
    } catch (error) {
      console.error('Error leaving room:', error.response?.data?.message || "Unexpected error");
      return { success: false, message: "Failed to leave the room. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  return { handleLeaveRoom, loading };
};

export default useLeaveRoom;
