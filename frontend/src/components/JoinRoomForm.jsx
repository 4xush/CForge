import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { X } from 'lucide-react';
import useJoinRoom from '../hooks/useJoinRoom';

const JoinRoomForm = ({ onClose, onRoomJoined }) => {
    const { joinRoom, loading, error, success } = useJoinRoom();
    const [roomId, setRoomId] = useState('');

    const handleChange = (e) => {
        setRoomId(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await joinRoom(roomId);
    };

    // Effect to notify parent on successful room join
    useEffect(() => {
        if (success) {
            onRoomJoined(); // Notify parent to refresh room list and close modal
        }
    }, [success, onRoomJoined]);

    return (
        <Card className="w-full max-w-md bg-[#000110] border border-gray-700 shadow-lg">
            <CardHeader className="bg-[#222831] text-white flex items-center justify-between border-b border-gray-700 p-4">
                <h2 className="text-xl font-semibold">Join Room</h2>
                <X className="cursor-pointer text-gray-400 hover:text-white" size={20} onClick={onClose} />
            </CardHeader>
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        name="roomId"
                        value={roomId}
                        onChange={handleChange}
                        placeholder="Enter Room ID"
                        required
                        className="bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-green-500 transition-colors duration-200"
                    />
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    {success && <div className="text-green-500 text-sm">{success}</div>}
                    <div className="flex justify-end space-x-2 mt-6">
                        <Button type="submit" className="bg-green-500 text-white hover:bg-green-600" disabled={loading}>
                            {loading ? 'Joining Room...' : 'Join Room'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default JoinRoomForm;