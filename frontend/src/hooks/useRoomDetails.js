import { useState, useEffect } from 'react';
import axios from 'axios';

const useRoomDetails = (roomId) => {
    const [roomDetails, setRoomDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRoomDetails = async () => {
        if (!roomId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/api/rooms/${roomId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
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