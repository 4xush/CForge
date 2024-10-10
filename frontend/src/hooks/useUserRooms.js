import { useState, useEffect } from 'react';
import api from '../config/api';

const useUserRooms = (refreshRooms) => {
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await api.get('/rooms');
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