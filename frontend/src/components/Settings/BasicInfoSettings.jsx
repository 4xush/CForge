import React, { useState } from 'react';
import { User, CircleUser, Asterisk, Globe, ArrowUpRight } from 'lucide-react'; // Add gender icons
import ApiService from '../../services/ApiService';
import { toast } from 'react-hot-toast';

const BasicInfo = ({ profileData, onProfileUpdate }) => {
    const [formData, setFormData] = useState({
        fullName: profileData?.fullName || '',
        username: profileData?.username || '',
        gender: profileData?.gender || 'other', // Default to 'other'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Update all fields in one API call for efficiency
            const response = await ApiService.put('/users/update', {
                fullName: formData.fullName,
                username: formData.username,
                gender: formData.gender,
            });

            // Determine if profile is complete
            const isProfileComplete =
                formData.fullName.trim() !== '' &&
                formData.username.trim() !== '' &&
                formData.gender !== 'other'; // Example condition

            const updatedData = {
                ...profileData,
                fullName: formData.fullName,
                username: formData.username,
                gender: formData.gender,
                isProfileComplete,
            };

            toast.success('Basic info updated successfully');
            if (onProfileUpdate) {
                onProfileUpdate(updatedData);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update basic info');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
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
                    {/* Gender Select */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {formData.gender === 'male' ? (
                                <Globe className="h-5 w-5 text-gray-400" />
                            ) : formData.gender === 'female' ? (
                                <Asterisk className="h-5 w-5 text-gray-400" />
                            ) : (
                                <ArrowUpRight className="h-5 w-5 text-gray-400" />
                            )}
                        </div>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
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