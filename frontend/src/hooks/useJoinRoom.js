import { useState } from 'react';
import api from '../config/api';

const useJoinRoom = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const joinRoom = async (roomId) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await api.post(`/rooms/${roomId}/join`);
            setSuccess(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while joining the room');
        } finally {
            setLoading(false);
        }
    };

    return { joinRoom, loading, error, success };
};

export default useJoinRoom;