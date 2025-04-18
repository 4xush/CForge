import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, Users, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRoomContext } from '../../context/RoomContext';
const API_URI = import.meta.env.VITE_API_URI;

const InviteModal = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentInviteCode, setCurrentInviteCode] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [inviteDetails, setInviteDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const processedRef = useRef(false);

    const { refreshRoomList } = useRoomContext();

    useEffect(() => {
        const checkForInviteCode = async () => {
            // Prevent double processing
            if (processedRef.current) return;

            // First check location state
            if (location.state?.inviteCode && location.state?.showInviteModal) {
                processedRef.current = true;
                setCurrentInviteCode(location.state.inviteCode);
                await verifyInvite(location.state.inviteCode);

                // Clear location state after processing, but maintain modal state
                navigate(location.pathname, {
                    replace: true,
                    state: {}
                });
                return;
            }

            // Then check sessionStorage
            const storedInviteCode = sessionStorage.getItem('app-pendingInviteCode');
            if (storedInviteCode) {
                processedRef.current = true;
                setCurrentInviteCode(storedInviteCode);
                await verifyInvite(storedInviteCode);
                sessionStorage.removeItem('app-pendingInviteCode');
            }
        };

        checkForInviteCode();
    }, [location, navigate]);

    const verifyInvite = async (inviteCode) => {
        if (!inviteCode) return;

        try {
            setLoading(true);
            setIsOpen(true);

            const response = await fetch(`${API_URI}/rooms/invite/${inviteCode}/verify`);
            const data = await response.json();

            if (data.success) {
                setInviteDetails(data.data);
                setIsOpen(true); // Ensure modal is open after successful verification
            } else {
                setError(data.message);
                toast.error(data.message);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to verify invite link');
            toast.error('Failed to verify invite link');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setCurrentInviteCode(null);
        setInviteDetails(null);
        setError(null);
        processedRef.current = false; // Reset the processed state
    };

    // Reset processed ref when component unmounts
    useEffect(() => {
        return () => {
            processedRef.current = false;
        };
    }, []);

    const handleJoinRoom = async () => {
        if (!inviteDetails || !currentInviteCode) {
            toast.error('Invalid invite details');
            return;
        }
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
                handleClose();
                handleRoomJoinedViaInvite();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to join room');
            toast.error('Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    const handleRoomJoinedViaInvite = () => {
        refreshRoomList();
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) handleClose();
                else setIsOpen(true);
            }}
        >
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