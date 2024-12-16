import React, { useState } from 'react';
import { Plus, Users, Calendar, Lock, Unlock, User, Copy, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog.jsx";
import { Alert, AlertDescription } from "./ui/Alert.jsx";
import { useAuthContext } from '../context/AuthContext.jsx';
import { generateInviteLink } from '../api/roomApi.js';
import toast from 'react-hot-toast';

const RoomDetails = ({ roomDetails, loading, error, setError }) => {
    const { authUser } = useAuthContext();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteData, setInviteData] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const userDp = 'https://avatar.iran.liara.run/username?username=[firstname+lastname]';

    const handleInviteClick = async () => {
        try {
            setIsGeneratingLink(true);
            const response = await generateInviteLink(roomDetails.roomId);

            if (response.success) {
                setInviteData(response.data);
                setIsInviteModalOpen(true);
            } else {
                toast.error(response.message || "Failed to generate invite link");
            }
        } catch (error) {
            console.error('Error generating invite link:', error);
            toast.error("Failed to generate invite link. Please try again.");
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(inviteData?.inviteLink);
            setCopied(true);
            toast.success("Invite link copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error("Failed to copy link to clipboard");
        }
    };

    if (loading) return <div className="text-gray-300 p-4">Loading...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;
    if (!roomDetails) return <div className="text-gray-300 p-4">No room details available</div>;

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const isCurrentUserAdmin = roomDetails.admins.some(admin =>
        admin.username === authUser.username
    );

    return (
        <>
            <div className="p-4 h-full overflow-y-auto">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-4 mb-4">
                    <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 mx-auto">
                        #
                    </div>
                    <h2 className="text-xl font-bold text-center mb-1">{roomDetails.name}</h2>
                    <p className="text-sm font-bold text-center">@{roomDetails.roomId}</p>
                    <p className="text-sm text-center mb-2">{roomDetails.description}</p>
                    <div className="flex justify-center items-center">
                        {roomDetails.isPublic ? (
                            <span className="flex items-center text-xs bg-green-500 text-white px-2 py-1 rounded">
                                <Unlock size={12} className="mr-1" /> Public
                            </span>
                        ) : (
                            <span className="flex items-center text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                                <Lock size={12} className="mr-1" /> Private
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                        <Calendar size={16} className="mr-2" /> Created
                    </h3>
                    <p className="text-sm">{formatDate(roomDetails.createdAt)}</p>
                    <p className="text-sm mt-1">by {roomDetails.createdBy}</p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                        <Users size={16} className="mr-2" /> Members ({roomDetails.members.length})
                    </h3>
                    <div className="space-y-2">
                        {roomDetails.members.map((member) => (
                            <div key={member._id} className="flex items-center">
                                <img src={member.profilePicture || userDp} alt={member.username} className="w-8 h-8 rounded-full mr-2" />
                                <span className="text-sm">{member.username}</span>
                                {roomDetails.admins.some(admin => admin._id === member._id) && (
                                    <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">Admin</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                        <User size={16} className="mr-2" /> Admins ({roomDetails.admins.length})
                    </h3>
                    <div className="space-y-2">
                        {roomDetails.admins.map((admin) => (
                            <div key={admin._id} className="flex items-center">
                                <img src={admin.profilePicture || userDp} alt={admin.username} className="w-8 h-8 rounded-full mr-2" />
                                <span className="text-sm">{admin.username}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {isCurrentUserAdmin && (
                    <button
                        onClick={handleInviteClick}
                        disabled={isGeneratingLink}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-300"
                    >
                        {isGeneratingLink ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </span>
                        ) : (
                            <>
                                <Plus size={16} className="mr-2" />
                                Invite Link
                            </>
                        )}
                    </button>
                )}
            </div>

            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Room Invite Link</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col space-y-4">
                        <Alert>
                            <AlertDescription className="mt-2 flex items-center justify-between break-all">
                                <span className="mr-2">{inviteData?.inviteLink}</span>
                                <button
                                    onClick={copyToClipboard}
                                    className="shrink-0 ml-2 text-gray-500 hover:text-gray-700"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </button>
                            </AlertDescription>
                        </Alert>
                        <p className="text-sm text-gray-500">
                            Expires on: {inviteData?.expiresAt ? formatDate(inviteData.expiresAt) : 'N/A'}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default RoomDetails;