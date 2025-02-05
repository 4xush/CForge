import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RoomInviteHandler = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const { authUser, isLoading } = useAuthContext();

    useEffect(() => {
        console.log('RoomInviteHandler - authUser:', authUser);
        console.log('RoomInviteHandler - isLoading:', isLoading);
        console.log('RoomInviteHandler - inviteCode:', inviteCode);

        if (!isLoading) {
            handleInviteLink();
        }
    }, [isLoading, authUser, inviteCode]);

    const handleInviteLink = async () => {
        // Get the current invite code or check for a pending one
        const currentInviteCode = inviteCode || sessionStorage.getItem('app-pendingInviteCode');

        console.log('Current Invite Code:', currentInviteCode);

        // Validate invite code
        if (!currentInviteCode) {
            toast.error('Invalid invite link');
            navigate('/rooms');
            return;
        }

        if (!authUser) {
            // Store invite code for after login
            sessionStorage.setItem('app-pendingInviteCode', currentInviteCode);
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
            sessionStorage.removeItem('app-pendingInviteCode');

            // If user is logged in, redirect to rooms with invite code
            navigate('/rooms', {
                state: {
                    inviteCode: currentInviteCode,
                    showInviteModal: true
                },
                replace: true // Use replace to prevent back navigation to invite link
            });
        } catch (error) {
            console.error('Error handling invite link:', error);
            toast.error('Failed to process invite link');
            navigate('/rooms');
        }
    };

    if (isLoading) {
        return null;
    }

    return null;
};

export default RoomInviteHandler;