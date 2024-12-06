import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, MessageSquare } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import useJoinRoom from '../../hooks/useJoinRoom';

const JoinRoomForm = ({ onClose, onRoomJoined }) => {
    const { joinRoom, loading: isJoiningRoom, error: joinError } = useJoinRoom();
    const [roomCode, setRoomCode] = useState('');
    const [joinedRoomDetails, setJoinedRoomDetails] = useState(null);

    const handleJoinRoom = async () => {
        try {
            const result = await joinRoom(roomCode);
            if (result) {
                setJoinedRoomDetails(result);
            }
        } catch (err) {
            console.error('Room joining failed', err);
        }
    };

    // Render success state
    if (joinedRoomDetails) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
            >
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1 }}
                >
                    <MessageSquare className="h-16 w-16 text-purple-500 mx-auto" />
                </motion.div>
                <h3 className="text-xl font-bold">Room Joined Successfully!</h3>
                <p className="text-gray-400 text-sm">
                    You've successfully joined the room: {joinedRoomDetails.name || 'Unnamed Room'}
                </p>

                <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center"
                    onClick={() => {
                        onRoomJoined(joinedRoomDetails);
                        onClose();
                    }}
                >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Enter Room
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="Enter Room ID"
                    className="pl-10 bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 transition-colors duration-200"
                />
            </div>

            {joinError && (
                <div className="text-red-500 text-sm mt-2">
                    {joinError}
                </div>
            )}

            <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleJoinRoom}
                disabled={isJoiningRoom || !roomCode}
            >
                {isJoiningRoom ? 'Joining Room...' : 'Join Room'}
            </Button>
        </motion.div>
    );
};

export default JoinRoomForm;