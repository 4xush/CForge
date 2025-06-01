import { useState } from 'react';
import PropTypes from 'prop-types';
import { Check, Copy, X } from 'lucide-react';
import toast from 'react-hot-toast';

const InviteLinkModal = ({ inviteData, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteData.inviteLink);
            setCopied(true);
            toast.success("Invite link copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error("Failed to copy link to clipboard");
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

    const handleShare = (platform) => {
        let url;
        const encodedLink = encodeURIComponent(inviteData.inviteLink);
        const message = encodeURIComponent('Join my coding room on CForge!');

        switch (platform) {
            case 'email':
                url = `mailto:?subject=Join My Coding Room&body=${encodedLink}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${message}&url=${encodedLink}`;
                break;
            case 'whatsapp':
                url = `https://api.whatsapp.com/send?text=${message}%20${encodedLink}`;
                break;
            default:
                return;
        }
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white">Room Invite Link</h3>

                    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-sm text-gray-300 break-all mr-2 scrollbar-thin scrollbar-thumb-gray-600">
                            {inviteData.inviteLink}
                        </span>
                        <button
                            onClick={handleCopy}
                            className={`p-1 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${copied ? 'text-green-400' : 'text-gray-400 hover:text-white'
                                }`}
                            aria-label={copied ? 'Link copied' : 'Copy invite link'}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>

                    <div className="text-sm text-gray-400">
                        <p>Expires on: <span className="font-semibold">{formatExpiryDate(inviteData.expiresAt)}</span></p>
                    </div>

                    <div className="flex space-x-2">
                        {[
                            { name: 'Email', action: 'email' },
                            { name: 'Twitter', action: 'twitter' },
                            { name: 'WhatsApp', action: 'whatsapp' }
                        ].map((platform) => (
                            <button
                                key={platform.action}
                                onClick={() => handleShare(platform.action)}
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-700 disabled:cursor-not-allowed"
                                aria-label={`Share via ${platform.name}`}
                            >
                                {platform.name}
                            </button>
                        ))}
                    </div>

                    <div className="text-sm text-gray-400">
                        <p>Share this link with people you want to invite.</p>
                        <p>Anyone with this link can join before it expires.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

InviteLinkModal.propTypes = {
    inviteData: PropTypes.shape({
        inviteLink: PropTypes.string.isRequired,
        expiresAt: PropTypes.string.isRequired,
    }).isRequired,
    onClose: PropTypes.func.isRequired,
};

export default InviteLinkModal;