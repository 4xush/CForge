import { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

export default function useMyReview(isAuthUser) {
    const [myReview, setMyReview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthUser) return;
        setLoading(true);
        ApiService.get('/reviews/my-review')
            .then(res => {
                if (res.data.success) setMyReview(res.data.data);
                else setMyReview(null);
            })
            .catch(e => setError(e.response?.data?.message || 'Error fetching your review'))
            .finally(() => setLoading(false));
    }, [isAuthUser]);

    return { myReview, setMyReview, loading, error };
}
