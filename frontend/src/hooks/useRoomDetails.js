import { useState, useEffect } from 'react';
import api from '../config/api';

const useRoomDetails = (roomId) => {
    const [roomDetails, setRoomDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRoomDetails = async () => {
        if (!roomId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/rooms/${roomId}`);
            setRoomDetails(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch room details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomDetails();
    }, [roomId]);

    return { roomDetails, loading, error, refetch: fetchRoomDetails };
};

export default useRoomDetails;