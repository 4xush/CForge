import React, { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

const InviteLinkModal = ({ inviteData, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteData.inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const formatExpiryDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                {/* Modal content */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">Room Invite Link</h3>

                    <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                        <div className="overflow-x-auto whitespace-nowrap mr-2 text-sm">
                            {inviteData.inviteLink}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 flex items-center transition duration-200"
                        >
                            {copied ? (
                                <Check size={16} className="mr-1" />
                            ) : (
                                <Copy size={16} className="mr-1" />
                            )}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <div className="text-sm text-gray-400">
                        <p>This link will expire on:</p>
                        <p className="font-semibold">{formatExpiryDate(inviteData.expiresAt)}</p>
                    </div>

                    <div className="text-sm text-gray-400 mt-4">
                        <p>Share this link with people you want to invite to the room.</p>
                        <p>Anyone with this link can join the room before it expires.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InviteLinkModal;