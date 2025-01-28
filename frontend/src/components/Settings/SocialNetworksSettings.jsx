import React, { useState } from 'react';
import { Linkedin, Twitter } from 'lucide-react';
import ApiService from '../../services/ApiService';
import { toast } from 'react-hot-toast';

const SocialNetworks = ({ socialNetworks, onSocialNetworksUpdate }) => {
    const [formData, setFormData] = useState({
        linkedin: socialNetworks?.linkedin || '',
        twitter: socialNetworks?.twitter || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await ApiService.put('/users/update/social-networks', formData);
            toast.success('Social networks updated successfully');
            if (onSocialNetworksUpdate) {
                onSocialNetworksUpdate(response.data.socialNetworks);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update social networks');
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
            <h3 className="text-lg font-medium text-white">Social Networks</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                    {/* LinkedIn Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Linkedin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            placeholder="LinkedIn Username"
                            className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
                        />
                    </div>

                    {/* Twitter Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Twitter className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="twitter"
                            value={formData.twitter}
                            onChange={handleChange}
                            placeholder="Twitter Username"
                            className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                    Update Social Networks
                </button>
            </form>
        </div>
    );
};

export default SocialNetworks;