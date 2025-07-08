import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';

export const useUserDashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const navigate = useNavigate();

    // Fetch user profile
    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await ApiService.get('users/profile');
            setUser(response.data);

            // Check if we should show the verification modal
            if (response.data?.email) {
                const modalShown = sessionStorage.getItem(`platform_usernameCheck_${response.data.email}`);
                if (!modalShown) {
                    setShowVerificationModal(true);
                }
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);

            // Handle different error scenarios
            if (err.response?.status === 404) {
                navigate('/404');
                return;
            }

            // Extract error message from API response
            const errorMessage = err.response?.data?.message ||
                err.message ||
                'Failed to fetch user profile. Please try again later.';

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Refresh platform data
    const refreshPlatformData = useCallback(async () => {
        try {
            setRefreshing(true);
            setError(null);

            const response = await ApiService.put('users/platform/refresh');

            // Update user data if the API returns updated user info
            if (response.data?.user) {
                setUser(response.data.user);
            } else {
                // If no user data returned, refetch the profile
                await fetchProfile();
            }

            return response.data;
        } catch (err) {
            console.error('Error refreshing platform data:', err);

            // Extract error message from API response
            const errorMessage = err.response?.data?.message ||
                err.message ||
                'Failed to refresh platform data. Please try again later.';

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setRefreshing(false);
        }
    }, [fetchProfile]);

    // Close verification modal
    const closeVerificationModal = useCallback(() => {
        if (user?.email) {
            sessionStorage.setItem(`platform_usernameCheck_${user.email}`, 'true');
        }
        setShowVerificationModal(false);
    }, [user?.email]);

    // Initialize on mount
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Clear error when user changes
    useEffect(() => {
        if (user) {
            setError(null);
        }
    }, [user]);

    return {
        // State
        user,
        loading,
        refreshing,
        error,
        showVerificationModal,

        // Actions
        fetchProfile,
        refreshPlatformData,
        closeVerificationModal,

        // Computed values
        isProfileComplete: user?.isProfileComplete || false,
        hasPlatforms: user?.platforms && Object.values(user.platforms).some(platform => platform?.username),

        // Error handling
        clearError: () => setError(null),
    };
};