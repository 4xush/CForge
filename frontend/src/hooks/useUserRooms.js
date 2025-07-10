import { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

const useUserRooms = (refreshRooms) => {
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await ApiService.get('/rooms');
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