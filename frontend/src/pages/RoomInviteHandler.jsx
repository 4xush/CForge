import { useEffect } from 'react';
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
    }, [isLoading, authUser, inviteCode]);

    const handleInviteLink = () => {
        if (!inviteCode) {
            toast.error('Invalid invite link');
            navigate('/rooms');
            return;
        }

        if (!authUser) {
            // Store invite code for post-login use
            sessionStorage.setItem('app-pendingInviteCode', inviteCode);
            toast.error('Please login to join the room');
            navigate('/login', {
                state: {
                    fromInvite: true,
                    inviteCode: inviteCode,
                },
            });
            return;
        }

        // For authenticated users, go directly to /rooms with modal state
        sessionStorage.removeItem('app-pendingInviteCode'); // Clean up
        navigate('/rooms', {
            state: {
                inviteCode: inviteCode,
                showInviteModal: true,
            },
            replace: true, // Prevent back navigation to invite link
        });
    };

    if (isLoading) {
        return null; // Avoid rendering during loading
    }

    return null; // This component only handles redirects
};

export default RoomInviteHandler;