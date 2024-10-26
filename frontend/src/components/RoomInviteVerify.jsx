import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { roomApi } from '../api/roomApi';
import { AlertCircle, Loader2, Users, Lock, Unlock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RoomInviteVerify = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const { authUser } = useAuthContext();
    const [roomDetails, setRoomDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        // Store invite code in localStorage if user is not logged in
        if (!authUser) {
            localStorage.setItem('pendingInviteCode', inviteCode);
        }

        verifyInvite();
    }, [inviteCode]);

    const verifyInvite = async () => {
        try {
            setLoading(true);
            const response = await roomApi.verifyRoomInvite(inviteCode);

            if (response.success) {
                setRoomDetails(response.data);
            } else {
                setError(response.message);
            }
        } catch (error) {
            setError('Failed to verify invite link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!authUser) {
            // Redirect to login page
            navigate('/login', { state: { redirectUrl: `/rooms/join/${inviteCode}` } });
            return;
        }

        try {
            setJoining(true);
            const response = await roomApi.joinRoomWithInvite(inviteCode);

            if (response.success) {
                navigate(`/rooms/${response.data.roomId}`);
            } else {
                setError(response.message);
            }
        } catch (error) {
            setError('Failed to join room. Please try again.');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
                    <p className="mt-2 text-gray-400">Verifying invite link...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle>Join Room</CardTitle>
                    <CardDescription>You've been invited to join a room</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-xl font-bold mb-2">{roomDetails.name}</h3>
                            <p className="text-gray-400 mb-4">{roomDetails.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    <span>{roomDetails.memberCount}/{roomDetails.maxMembers} members</span>
                                </div>
                                <div className="flex items-center">
                                    {roomDetails.isPublic ? (
                                        <span className="flex items-center text-green-500">
                                            <Unlock className="h-4 w-4 mr-1" />
                                            Public
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-yellow-500">
                                            <Lock className="h-4 w-4 mr-1" />
                                            Private
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        onClick={handleJoinRoom}
                        disabled={joining}
                    >
                        {joining ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            'Join Room'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default RoomInviteVerify;