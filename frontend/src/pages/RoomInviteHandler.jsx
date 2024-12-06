import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RoomInviteHandler = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const { authUser, isLoading } = useAuthContext();

    useEffect(() => {
        if (!isLoading) {
            handleInviteLink();
        }
    }, [isLoading, inviteCode]);

    const handleInviteLink = async () => {
        // Get the current invite code or check for a pending one
        const currentInviteCode = inviteCode || localStorage.getItem('app-pendingInviteCode');

        // Validate invite code
        if (!currentInviteCode) {
            toast.error('Invalid invite link');
            navigate('/dashboard');
            return;
        }

        if (!authUser) {
            // Store invite code for after login
            localStorage.setItem('app-pendingInviteCode', currentInviteCode);
            toast.error('Please login to join the room');
            navigate('/login', {
                state: {
                    redirectUrl: `/rooms/join/${currentInviteCode}`,
                    inviteCode: currentInviteCode // Store in state as backup
                }
            });
            return;
        }

        try {
            // Clear any pending invite code
            localStorage.removeItem('app-pendingInviteCode');

            // If user is logged in, redirect to dashboard with invite code
            navigate('/dashboard', {
                state: {
                    inviteCode: currentInviteCode,
                    showInviteModal: true
                },
                replace: true // Use replace to prevent back navigation to invite link
            });
        } catch (error) {
            console.error('Error handling invite link:', error);
            toast.error('Failed to process invite link');
            navigate('/dashboard');
        }
    };

    if (isLoading) {
        return null;
    }

    return null;
};

export default RoomInviteHandler;