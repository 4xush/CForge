import { useState, useEffect } from 'react';
import axios from 'axios';

const useUserRooms = () => {
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRooms = async () => {
            const token = localStorage.getItem('token'); // Get the JWT from localStorage or sessionStorage

            try {
                const response = await axios.get('/api/rooms', {
                    headers: {
                        Authorization: `Bearer ${token}`,  // Include the JWT token in the request headers
                    },
                });

                setRooms(response.data.rooms);  // Assuming the API response contains a `rooms` field
            } catch (err) {
                setError('Failed to fetch rooms');
            }
        };

        fetchRooms();
    }, []);

    return { rooms, error };
};

export default useUserRooms;
