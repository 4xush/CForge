import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { X } from 'lucide-react';
import useCreateRoom from '../hooks/useCreateRoom';

const CreateRoomForm = () => {
    const { createRoom, loading, error, success } = useCreateRoom();
    const [formData, setFormData] = useState({
        name: '',
        description: '',  // Room description (optional)
        isPublic: true,   // Room visibility
        roomId: '',       // Optional room ID
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

        // Pass formData to the createRoom function from the hook
        await createRoom(formData);
    };

    return (
        <Card className="w-full max-w-md bg-[#222831] border border-gray-700 shadow-lg">
            <CardHeader className="bg-[#222831] text-white flex items-center justify-between border-b border-gray-700 p-4">
                <h2 className="text-xl font-semibold">Create Room</h2>
                <X className="cursor-pointer text-gray-400 hover:text-white" size={20} onClick={() => {/* Handle close */ }} />
            </CardHeader>
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Room Name"
                            required
                            className="bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-green-500 transition-colors duration-200"
                        />
                    </div>
                    <div>
                        <Input
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Room Description (optional)"
                            className="bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-green-500 transition-colors duration-200"
                        />
                    </div>
                    <div>
                        <Input
                            name="roomId"
                            value={formData.roomId}
                            onChange={handleChange}
                            placeholder="Custom Room ID (optional)"
                            className="bg-[#2a2b36] border-gray-600 text-white placeholder-gray-400 focus:border-green-500 transition-colors duration-200"
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex-grow">
                            <div className="text-purple-600 text-md ">
                                Make this room private :
                            </div>
                            <p className="text-xs text-gray-400">Private rooms can be found and joined by invitation only.</p>
                        </div>
                        <Switch
                            checked={!formData.isPublic}
                            onCheckedChange={(checked) => handleSwitchChange('isPublic', !checked)}
                            className="flex-shrink-0"
                        />
                    </div>
                    {error && (
                        <div className="text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-green-500 text-sm">
                            {success}
                        </div>
                    )}
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
