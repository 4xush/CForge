import React, { useState } from 'react';
import { User, CircleUser } from 'lucide-react';
import ApiService from '../../services/ApiService';
import { toast } from 'react-hot-toast';

const BasicInfo = ({ profileData, onProfileUpdate }) => {
    const [formData, setFormData] = useState({
        fullName: profileData?.fullName || '',
        username: profileData?.username || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const responses = await Promise.all([
                ApiService.put('/users/update/fullName', { fullName: formData.fullName }),
                ApiService.put('/users/update/username', { username: formData.username })
            ]);

            toast.success('Basic info updated successfully');
            if (onProfileUpdate) {
                onProfileUpdate({
                    ...profileData,
                    fullName: formData.fullName,
                    username: formData.username
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update basic info');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="space-y-6 bg-gray-800/50 p-6 rounded-xl">
            <h3 className="text-lg font-medium text-white">Basic Information</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                    {/* Full Name Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Full Name"
                            className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
                        />
                    </div>
                    {/* Username Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CircleUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Username"
                            className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                    Update Basic Info
                </button>
            </form>
        </div>
    );
};

export default BasicInfo;