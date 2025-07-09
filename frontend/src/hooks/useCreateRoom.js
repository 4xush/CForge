import { useState } from 'react';
import { useRoomContext } from '../context/RoomContext';
import api from '../config/api';

const useCreateRoom = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { refreshRoomList } = useRoomContext();

    const createRoom = async (formData) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await api.post('/rooms/create', formData);
            setSuccess('Room created successfully!');
            
            // Immediately refresh the room list
            try {
                await refreshRoomList(true);
            } catch (refreshError) {
                console.error('Failed to refresh room list after creation:', refreshError);
            }
            
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create room');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createRoom, loading, error, success };
};

export default useCreateRoom;
