import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Copy, MessageSquare } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import useCreateRoom from '../../hooks/useCreateRoom';
import { generateInviteLink } from '../../api/roomApi';

const CreateRoomForm = ({ onClose, onRoomCreated }) => {
    const { createRoom, loading: isCreatingRoom, error: createError } = useCreateRoom();
    const [copied, setCopied] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [roomSettings, setRoomSettings] = useState({
        name: '',
        description: '',
        isPrivate: false,
        roomId: ''
    });

    const handleCopyCode = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Handle Room Creation
    const handleCreateRoom = async () => {
        try {
            const result = await createRoom(roomSettings);
            if (result && result.room && result.room.roomId) {
                const roomId = result.room.roomId;
                const inviteResponse = await generateInviteLink(roomId);
                if (inviteResponse && inviteResponse.data.inviteLink) {
                    setInviteLink(inviteResponse.data.inviteLink);
                }
            }
        } catch (err) {
            console.error('Room creation failed', err);
        }
    };

    // Render main form or success state
    if (inviteLink) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
            >
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 1 }}
                >
                    <Sparkles className="h-16 w-16 text-purple-500 mx-auto" />
                </motion.div>
                <h3 className="text-xl font-bold">Room Ready!</h3>
                <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-purple-400 font-mono">{inviteLink}</span>
                    <button
                        onClick={handleCopyCode}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                </div>
                <p className="text-gray-400 text-sm">
                    Share this code with your friends to let them join!
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center"
                        onClick={() => {
                            onRoomCreated();
                            onClose();
                        }}
                    >
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Enter Room
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <Input
                value={roomSettings.name}
                onChange={(e) => setRoomSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Room Name"
                required
                className="bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 transition-colors duration-200"
            />
            <Input
                value={roomSettings.description}
                onChange={(e) => setRoomSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Room Description (optional)"
                className="bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 transition-colors duration-200"
            />
            <Input
                value={roomSettings.roomId}
                onChange={(e) => setRoomSettings(prev => ({ ...prev, roomId: e.target.value }))}
                placeholder="Custom Room ID (optional)"
                className="bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 transition-colors duration-200"
            />
            <div className="flex items-center justify-between space-x-4">
                <div className="flex-grow">
                    <div className="text-purple-600 text-md">Make this room private:</div>
                    <p className="text-xs text-gray-400">Private rooms can be joined by invitation only.</p>
                </div>
                <Switch
                    checked={roomSettings.isPrivate}
                    onCheckedChange={(checked) => setRoomSettings(prev => ({ ...prev, isPrivate: checked }))}
                />
            </div>
            <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
            >
                {isCreatingRoom ? 'Creating Room...' : 'Create Room'}
            </Button>
            {createError && (
                <div className="text-red-500 text-sm mt-2">
                    {createError}
                </div>
            )}
        </motion.div>
    );
};

export default CreateRoomForm;