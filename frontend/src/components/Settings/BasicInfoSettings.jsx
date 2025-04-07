import React, { useState } from 'react';
import { User, CircleUser, Asterisk, Globe, ArrowUpRight, Loader2 } from 'lucide-react'; // Add gender icons
import ApiService from '../../services/ApiService';
import { toast } from 'react-hot-toast';

const BasicInfo = ({ profileData, onProfileUpdate }) => {
    const [formData, setFormData] = useState({
        fullName: profileData?.fullName || '',
        username: profileData?.username || '',
        gender: profileData?.gender || 'other', // Default to 'other'
    });
    const [loading, setLoading] = useState({
        fullName: false,
        username: false,
        gender: false
    });

    const updateField = async (field) => {
        if (!formData[field]) {
            toast.error(`Please enter a ${field}`);
            return;
        }

        setLoading(prev => ({ ...prev, [field]: true }));

        try {
            const response = await ApiService.put(`/users/update/${field}`, {
                [field]: formData[field]
            });

            if (response.data) {
                toast.success(`${field} updated successfully`);
                if (onProfileUpdate) {
                    onProfileUpdate({
                        ...profileData,
                        [field]: formData[field]
                    });
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to update ${field}`);
        } finally {
            setLoading(prev => ({ ...prev, [field]: false }));
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
            <div className="space-y-4">
                {/* Full Name Input */}
                <div className="relative flex items-center gap-2">
                    <div className="flex-1 relative">
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
                    <button
                        onClick={() => updateField('fullName')}
                        disabled={loading.fullName || !formData.fullName}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-500/50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                        {loading.fullName ? (
                            <>
                                <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update'
                        )}
                    </button>
                </div>

                {/* Username Input */}
                <div className="relative flex items-center gap-2">
                    <div className="flex-1 relative">
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
                    <button
                        onClick={() => updateField('username')}
                        disabled={loading.username || !formData.username}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-500/50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                        {loading.username ? (
                            <>
                                <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update'
                        )}
                    </button>
                </div>

                {/* Gender Select */}
                <div className="relative flex items-center gap-2">
                    <div className="flex-1 relative">
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
                    <button
                        onClick={() => updateField('gender')}
                        disabled={loading.gender}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-500/50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                        {loading.gender ? (
                            <>
                                <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BasicInfo;