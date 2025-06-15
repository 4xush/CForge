import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { User, CircleUser, Asterisk, Globe, ArrowUpRight, Loader2 } from 'lucide-react';
import ApiService from '../../services/ApiService';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '../../context/AuthContext';

const BasicInfo = ({ profileData, onProfileUpdate }) => {
    const { updateUser } = useAuthContext();
    const [formData, setFormData] = useState({
        fullName: profileData?.fullName || '',
        username: profileData?.username || '',
        gender: profileData?.gender || 'other',
    });
    const [originalData, setOriginalData] = useState({
        fullName: profileData?.fullName || '',
        username: profileData?.username || '',
        gender: profileData?.gender || 'other',
    });
    const [loading, setLoading] = useState({
        fullName: false,
        username: false,
        gender: false
    });

    useEffect(() => {
        if (profileData) {
            const newData = {
                fullName: profileData.fullName || '',
                username: profileData.username || '',
                gender: profileData.gender || 'other',
            };
            setFormData(newData);
            setOriginalData(newData);
        }
    }, [profileData]);

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

            let updatedProfile;

            // Handle different response formats
            if (response.data && typeof response.data === 'object') {
                if (response.data.user) {
                    // If response has user object (some APIs return { user: {...} })
                    updatedProfile = response.data.user;
                } else if (response.data[field] !== undefined) {
                    // If response has the field directly
                    updatedProfile = { ...profileData, ...response.data };
                } else {
                    // If response doesn't contain expected data, merge with current profile
                    updatedProfile = { ...profileData, [field]: formData[field] };
                }
            } else {
                // Fallback: merge with current profile data
                updatedProfile = { ...profileData, [field]: formData[field] };
            }

            // Update original data to reflect the successful change
            setOriginalData(prev => ({
                ...prev,
                [field]: updatedProfile[field] || formData[field]
            }));

            // Update form data to match the response
            setFormData(prev => ({
                ...prev,
                [field]: updatedProfile[field] || formData[field]
            }));

            // Update AuthContext
            const contextUpdateSuccess = updateUser(updatedProfile);
            
            if (contextUpdateSuccess) {
                toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
                
                // Call the callback if provided (for backward compatibility)
                if (onProfileUpdate) {
                    onProfileUpdate(updatedProfile);
                }
            } else {
                toast.error('Failed to update local data');
            }

        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            
            // Reset form data on error
            setFormData(prev => ({
                ...prev,
                [field]: originalData[field]
            }));

            // Show error message
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               `Failed to update ${field}`;
            toast.error(errorMessage);
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

    const isFieldChanged = (field) => {
        return formData[field] !== originalData[field];
    };

    const isFieldValid = (field) => {
        return formData[field] && formData[field].trim().length > 0;
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
                            disabled={loading.fullName}
                        />
                    </div>
                    <button
                        onClick={() => updateField('fullName')}
                        disabled={loading.fullName || !isFieldValid('fullName') || !isFieldChanged('fullName')}
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
                            disabled={loading.username}
                        />
                    </div>
                    <button
                        onClick={() => updateField('username')}
                        disabled={loading.username || !isFieldValid('username') || !isFieldChanged('username')}
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
                            disabled={loading.gender}
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <button
                        onClick={() => updateField('gender')}
                        disabled={loading.gender || !isFieldChanged('gender')}
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

BasicInfo.propTypes = {
    profileData: PropTypes.shape({
        fullName: PropTypes.string,
        username: PropTypes.string,
        gender: PropTypes.string,
    }),
    onProfileUpdate: PropTypes.func,
};

export default BasicInfo;