import React, { useState } from 'react';
import { Save, Users, Shield, AlertTriangle, Settings, UserMinus, UserCheck } from 'lucide-react';
import ApiService from '../../services/ApiService';
import toast from 'react-hot-toast';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-700">
                <div className="flex items-center text-red-500 mb-4">
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-medium text-white">{title}</h3>
                </div>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                    >
                        {cancelText || "Cancel"}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        {confirmText || "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};


const RoomSettings = ({ room, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState({
        name: room?.name || '',
        description: room?.description || '',
        isPublic: room?.isPublic || false,
        maxMembers: room?.maxMembers || 50,
        roomId: room?.roomId || '',
    });
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        confirmText: '',
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await ApiService.put(`/rooms/admin/${room.roomId}`, formData);
            const updatedRoom = response.data.room;
            toast.success('Room settings updated successfully');
            onUpdate?.(updatedRoom);
            onClose(); // Close settings after successful update
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update room settings');
        }
    };
    const handleKickUser = async (userId, username) => {
        showConfirmation(
            "Remove Member",
            `Are you sure you want to remove ${username} from this room? This action cannot be undone.`,
            async () => {
                try {
                    const response = await ApiService.post(`/rooms/admin/${room.roomId}/kick`, {
                        userId,
                    });
                    if (response.data.success) {
                        toast.success(`${username} was removed successfully`);
                        // Refresh the whole component with updated data
                        const updatedRoom = { ...room };
                        updatedRoom.members = updatedRoom.members.filter(member => member._id !== userId);
                        onUpdate?.(updatedRoom);
                    } else {
                        toast.error(response.data.message || 'Failed to remove user');
                    }
                } catch (error) {
                    console.error('Error removing user:', error);
                    toast.error('Failed to remove user. Please try again.');
                }
            },
            "Remove"
        );
    };

    const handleAddAdmin = async (userId, username) => {
        showConfirmation(
            "Promote to Admin",
            `Are you sure you want to promote ${username} to an admin? They will have full control over this room.`,
            async () => {
                try {
                    const response = await ApiService.post(`/rooms/admin/${room.roomId}/admins/add`, {
                        userId,
                    });
                    if (response.data.success) {
                        toast.success(`${username} is now an admin`);
                        // Update both members and admins arrays
                        const updatedRoom = { ...room };
                        const memberToPromote = updatedRoom.members.find(member => member._id === userId);
                        if (memberToPromote && !updatedRoom.admins.some(admin => admin._id === userId)) {
                            updatedRoom.admins = [...updatedRoom.admins, memberToPromote];
                        }
                        onUpdate?.(updatedRoom);
                    } else {
                        toast.error(response.data.message || 'Failed to add admin');
                    }
                } catch (error) {
                    console.error('Error adding admin:', error);
                    toast.error('Failed to add admin. Please try again.');
                }
            },
            "Promote"
        );
    };

    const handleRemoveAdmin = async (userId, username) => {
        showConfirmation(
            "Revoke Admin Role",
            `Are you sure you want to revoke ${username}'s admin privileges? They will remain a member of the room.`,
            async () => {
                try {
                    const response = await ApiService.post(`/rooms/admin/${room.roomId}/admins/remove`, { userId });

                    if (response.data.success) {
                        toast.success(`Admin role revoked from ${username}`);
                        // Update admins array
                        const updatedRoom = { ...room };
                        updatedRoom.admins = updatedRoom.admins.filter(admin => admin._id !== userId);
                        onUpdate?.(updatedRoom);
                    } else {
                        toast.error(response.data.message || 'Failed to revoke admin role');
                    }
                } catch (error) {
                    console.error('Error removing admin:', error);
                    if (error.response && error.response.data && error.response.data.message) {
                        toast.error(error.response.data.message);
                    } else {
                        toast.error('Failed to revoke admin role. Please try again.');
                    }
                }
            },
            "Revoke"
        );
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'admins', label: 'Admins', icon: Shield },
    ];

    return (
        <div className="h-full flex flex-col bg-gray-800 rounded-lg shadow-xl">
            <div className="flex border-b border-gray-700">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-6 py-3 transition-colors duration-200 ${activeTab === tab.id
                            ? 'text-blue-500 border-b-2 border-blue-500 font-medium'
                            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-750'
                            }`}
                    >
                        <tab.icon className="w-5 h-5 mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'general' && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Room Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter a unique room name"
                                className="mt-1 block w-full rounded-md bg-gray-700 border border-gray-600 text-gray-300 p-2.5 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="Describe the purpose of this room"
                                className="mt-1 block w-full rounded-md bg-gray-700 border border-gray-600 text-gray-300 p-2.5 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>


                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="isPublic"
                                id="isPublic"
                                checked={formData.isPublic}
                                onChange={handleInputChange}
                                className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                            />
                            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-300">Public Room</label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Max Members</label>
                            <input
                                type="number"
                                name="maxMembers"
                                value={formData.maxMembers}
                                onChange={handleInputChange}
                                min={1}
                                placeholder="Set the maximum number of members"
                                className="mt-1 block w-full rounded-md bg-gray-700 border border-gray-600 text-gray-300 p-2.5 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Save Changes
                        </button>
                    </form>
                )}

                {activeTab === 'members' && (
                    <div className="space-y-4">
                        {room?.members?.map((member) => (
                            <div
                                key={member._id}
                                className="flex items-center justify-between p-3 bg-gray-700 rounded-md hover:bg-gray-650 transition-colors duration-200"
                            >
                                <div className="flex items-center">
                                    <img
                                        src={member.profilePicture || '/placeholder.svg'}
                                        alt={member.username}
                                        className="w-10 h-10 rounded-full mr-3 border border-gray-600"
                                    />
                                    <div>
                                        <span className="text-gray-200 font-medium">{member.username}</span>
                                        {room.admins.some((admin) => admin._id === member._id) && (
                                            <span className="ml-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Admin</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    {!room.admins.some((admin) => admin._id === member._id) && (
                                        <button
                                            onClick={() => handleAddAdmin(member._id, member.username)}
                                            className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                                            title="Promote to Admin"
                                        >
                                            <UserCheck className="w-4 h-4 mr-1" />
                                            <span className="text-xs">Promote</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleKickUser(member._id, member.username)}
                                        className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                                        title="Remove from Room"
                                    >
                                        <UserMinus className="w-4 h-4 mr-1" />
                                        <span className="text-xs">Remove</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'admins' && (
                    <div className="space-y-4">
                        {room?.admins?.map((admin) => (
                            <div
                                key={admin._id}
                                className="flex items-center justify-between p-3 bg-gray-700 rounded-md hover:bg-gray-650 transition-colors duration-200"
                            >
                                <div className="flex items-center">
                                    <img
                                        src={admin.profilePicture || '/placeholder.svg'}
                                        alt={admin.username}
                                        className="w-10 h-10 rounded-full mr-3 border border-gray-600"
                                    />
                                    <span className="text-gray-200 font-medium">{admin.username}</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveAdmin(admin._id, admin.username)}
                                    className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                                    title="Remove Admin Role"
                                >
                                    <Shield className="w-4 h-4 mr-1" />
                                    <span className="text-xs">Revoke Admin</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationDialog
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                confirmText={confirmation.confirmText}
            />
        </div>
    );
};
export default RoomSettings;