import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, Users, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRoomContext } from '../../context/RoomContext';
const API_URI = import.meta.env.VITE_API_URI2;

const InviteModal = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentInviteCode, setCurrentInviteCode] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [inviteDetails, setInviteDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { refreshRoomList } = useRoomContext();

    const handleRoomJoinedViaInvite = () => {
        refreshRoomList();
    };

    const resetState = () => {
        setInviteDetails(null);
        setError(null);
        setIsOpen(false);
    };

    useEffect(() => {
        // Check if we have an invite code in the location state
        if (location.state?.inviteCode && location.state?.showInviteModal) {
            setCurrentInviteCode(location.state.inviteCode); // Store the code
            verifyInvite(location.state.inviteCode);
            // Clear the location state
            navigate(location.pathname, { replace: true });
        }
    }, [location]);

    const verifyInvite = async (inviteCode) => {
        try {
            setLoading(true);
            setIsOpen(true);
            const response = await fetch(`${API_URI}/rooms/invite/${inviteCode}/verify`);
            const data = await response.json();

            if (data.success) {
                setInviteDetails(data.data);
            } else {
                setError(data.message);
                toast.error(data.message);
            }
        } catch (error) {
            setError('Failed to verify invite link');
            toast.error('Failed to verify invite link');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!inviteDetails || !currentInviteCode) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_URI}/rooms/invite/${currentInviteCode}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('app-token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                toast.success('Successfully joined room!');
                resetState();
                setCurrentInviteCode(null);
                handleRoomJoinedViaInvite();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent aria-describedby="dialog-description">
                <DialogHeader>
                    <DialogTitle>Join Room</DialogTitle>
                </DialogHeader>

                {/* Description for screen readers */}
                <p id="dialog-description" className="sr-only">
                    Use this dialog to join a room with an invitation code.
                </p>

                {loading ? (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Verifying invite...</span>
                    </div>
                ) : error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : inviteDetails && (
                    <div className="space-y-4">
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <h3 className="text-xl font-bold">{inviteDetails.name}</h3>
                            <p className="text-gray-600 mt-2">{inviteDetails.description}</p>
                            <div className="flex items-center space-x-4 mt-4">
                                <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    <span>{inviteDetails.memberCount}/{inviteDetails.maxMembers} members</span>
                                </div>
                                {inviteDetails.isPublic ? (
                                    <span className="flex items-center text-green-600">
                                        <Unlock className="h-4 w-4 mr-1" />
                                        Public
                                    </span>
                                ) : (
                                    <span className="flex items-center text-yellow-600">
                                        <Lock className="h-4 w-4 mr-1" />
                                        Private
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleJoinRoom}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                'Join Room'
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default InviteModal;