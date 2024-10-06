import { useState, useEffect } from 'react';
import axios from 'axios';

const useUserRooms = (refreshRooms) => {
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRooms = async () => {
            const token = localStorage.getItem('token');

            try {
                const response = await axios.get('/api/rooms', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setRooms(response.data.rooms);
            } catch (err) {
                setError('Failed to fetch rooms');
            }
        };

        fetchRooms();
    }, [refreshRooms]); // Refetch rooms when refreshRooms changes

    return { rooms, error };
};

export default useUserRooms;
