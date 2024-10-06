import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Switch } from './ui/Switch';
import { X } from 'lucide-react';
import useCreateRoom from '../hooks/useCreateRoom';

const CreateRoomForm = ({ onClose, onRoomCreated }) => {
    const { createRoom, loading, error, success } = useCreateRoom();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: true,
        roomId: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSwitchChange = (name, checked) => {
        setFormData((prevData) => ({
            ...prevData,
            [name]: checked
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await createRoom(formData);
    };

    // Effect to notify parent on successful room creation
    useEffect(() => {
        if (success) {
            onRoomCreated(); // Notify parent to refresh room list and close modal
        }
    }, [success, onRoomCreated]);

    return (
        <Card className="w-full max-w-md bg-[#000110] border border-gray-700 shadow-lg">
            <CardHeader className="bg-[#222831] text-white flex items-center justify-between border-b border-gray-700 p-4">
                <h2 className="text-xl font-semibold">Create Room</h2>
                <X className="cursor-pointer text-gray-400 hover:text-white" size={20} onClick={onClose} />
            </CardHeader>
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Room Name"
                        required
                        className="bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-green-500 transition-colors duration-200"
                    />
                    <Input
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Room Description (optional)"
                        className="bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-green-500 transition-colors duration-200"
                    />
                    <Input
                        name="roomId"
                        value={formData.roomId}
                        onChange={handleChange}
                        placeholder="Custom Room ID (optional)"
                        className="bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-green-500 transition-colors duration-200"
                    />
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex-grow">
                            <div className="text-purple-600 text-md">Make this room private:</div>
                            <p className="text-xs text-gray-400">Private rooms can be joined by invitation only.</p>
                        </div>
                        <Switch
                            checked={!formData.isPublic}
                            onCheckedChange={(checked) => handleSwitchChange('isPublic', !checked)}
                        />
                    </div>
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    {success && <div className="text-green-500 text-sm">{success}</div>}
                    <div className="flex justify-end space-x-2 mt-6">
                        <Button type="submit" className="bg-green-500 text-white hover:bg-green-600" disabled={loading}>
                            {loading ? 'Creating Room...' : 'Create Room'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default CreateRoomForm;
