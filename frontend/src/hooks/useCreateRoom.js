import { useState } from 'react';
import axios from 'axios';

const useCreateRoom = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const createRoom = async (formData) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('token'); // Get the JWT token from localStorage

            if (!token) {
                throw new Error('No token found. Please log in.');
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`, // Include JWT token in the Authorization header
                },
            };

            const response = await axios.post('/api/rooms/create', formData, config);

            setSuccess('Room created successfully!');
            console.log('Room created:', response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    return { createRoom, loading, error, success };
};

export default useCreateRoom;
