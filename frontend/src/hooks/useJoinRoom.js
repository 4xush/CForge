import { useState } from 'react';
import api from '../config/api';

const useJoinRoom = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const joinRoom = async (roomId) => {
        const formattedRoomId = roomId.trim().toLowerCase();

        if (!formattedRoomId) {
            setError('Room ID cannot be empty');
            return null;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await api.post(`/rooms/${formattedRoomId}/join`);
            setSuccess(response.data.message);
            return response.data;
        } catch (err) {
            let errorMessage;
            if (err.response && err.response.status === 404) {
                errorMessage = 'Room not found. Please check the Room ID and try again.';
            } else {
                errorMessage = err.response?.data?.message || 'An error occurred while joining the room';
            }
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { joinRoom, loading, error, success };
};

export default useJoinRoom;

