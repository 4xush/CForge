import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Github, Terminal, Code2, Loader2, AlertCircle } from 'lucide-react';
import ApiService from '../../services/ApiService';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '../../context/AuthContext';

const AddPlatform = ({ onPlatformsUpdate, platforms }) => {
    const { updateUser, authUser } = useAuthContext();
    const [formData, setFormData] = useState({
        leetcodeUsername: platforms?.leetcode?.username || '',
        githubUsername: platforms?.github?.username || '',
        codeforcesUsername: platforms?.codeforces?.username || ''
    });
    const [originalData, setOriginalData] = useState({
        leetcodeUsername: platforms?.leetcode?.username || '',
        githubUsername: platforms?.github?.username || '',
        codeforcesUsername: platforms?.codeforces?.username || ''
    });
    const [loading, setLoading] = useState({
        leetcode: false,
        github: false,
        codeforces: false
    });

    useEffect(() => {
        if (platforms) {
            const newFormData = {
                leetcodeUsername: platforms?.leetcode?.username || '',
                githubUsername: platforms?.github?.username || '',
                codeforcesUsername: platforms?.codeforces?.username || ''
            };
            setFormData(newFormData);
            setOriginalData(newFormData);
        }
    }, [platforms]);

    const updatePlatform = async (platform) => {
        const usernameKey = `${platform}Username`;
        const username = formData[usernameKey];

        if (!username) {
            toast.error(`Please enter a ${platform} username`);
            return;
        }

        if (!username.trim()) {
            toast.error(`${platform} username cannot be empty`);
            return;
        }

        setLoading(prev => ({ ...prev, [platform]: true }));

        try {
            const response = await ApiService.put(`/users/platform/${platform}`, {
                username: username.trim()
            });

            let updatedProfile;
            let updatedPlatform;

            // Handle different response formats
            if (response.data) {
                if (response.data.user) {
                    // If response has full user object
                    updatedProfile = response.data.user;
                    updatedPlatform = response.data.user.platforms?.[platform];
                } else if (response.data.platform) {
                    // If response has just the platform data
                    updatedPlatform = response.data.platform;
                    updatedProfile = {
                        ...authUser,
                        platforms: {
                            ...authUser.platforms,
                            [platform]: updatedPlatform
                        }
                    };
                } else {
                    // Fallback: create updated profile manually
                    updatedPlatform = {
                        username: username.trim(),
                        isValid: true,
                        lastUpdated: new Date().toISOString(),
                        ...response.data
                    };
                    updatedProfile = {
                        ...authUser,
                        platforms: {
                            ...authUser.platforms,
                            [platform]: updatedPlatform
                        }
                    };
                }
            } else {
                // No response data - create minimal update
                updatedPlatform = {
                    username: username.trim(),
                    isValid: true,
                    lastUpdated: new Date().toISOString()
                };
                updatedProfile = {
                    ...authUser,
                    platforms: {
                        ...authUser.platforms,
                        [platform]: updatedPlatform
                    }
                };
            }

            // Update AuthContext
            const contextUpdateSuccess = updateUser(updatedProfile);

            if (contextUpdateSuccess) {
                // Update local form state
                const updatedFormData = {
                    ...formData,
                    [usernameKey]: username.trim()
                };
                setFormData(updatedFormData);
                setOriginalData(updatedFormData);

                toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} username updated successfully`);

                // Call the callback if provided (for backward compatibility)
                if (onPlatformsUpdate && updatedPlatform) {
                    onPlatformsUpdate({ ...updatedPlatform, name: platform });
                }
            } else {
                toast.error('Failed to update local data');
            }

        } catch (error) {
            console.error(`Error updating ${platform}:`, error);

            // Reset form data on error
            setFormData(prev => ({
                ...prev,
                [usernameKey]: originalData[usernameKey]
            }));

            // Show error message
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                `Failed to update ${platform} username`;
            toast.error(errorMessage);
        } finally {
            setLoading(prev => ({ ...prev, [platform]: false }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const isFieldChanged = (platform) => {
        const usernameKey = `${platform}Username`;
        return formData[usernameKey] !== originalData[usernameKey];
    };

    const isFieldValid = (platform) => {
        const usernameKey = `${platform}Username`;
        return formData[usernameKey] && formData[usernameKey].trim().length > 0;
    };

    const getPlatformStatus = (platform) => {
        const platformData = platforms?.[platform];
        if (!platformData) return null;

        return {
            isValid: platformData.isValid,
            lastUpdated: platformData.lastUpdated,
            username: platformData.username
        };
    };

    const renderPlatformField = (platform, icon, placeholder) => {
        const usernameKey = `${platform}Username`;
        const platformStatus = getPlatformStatus(platform);

        return (
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {icon}
                    </div>
                    <input
                        type="text"
                        name={usernameKey}
                        value={formData[usernameKey]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white text-sm"
                        disabled={loading[platform]}
                    />
                    {platformStatus && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <div className={`w-2 h-2 rounded-full ${platformStatus.isValid ? 'bg-green-500' : 'bg-red-500'}`}
                                title={platformStatus.isValid ? 'Valid username' : 'Invalid username'} />
                        </div>
                    )}
                </div>
                <button
                    onClick={() => updatePlatform(platform)}
                    disabled={loading[platform] || !isFieldValid(platform) || !isFieldChanged(platform)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-500/50 disabled:cursor-not-allowed min-w-[100px] text-sm"
                >
                    {loading[platform] ? (
                        <>
                            <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        'Update'
                    )}
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6 bg-gray-800/50 p-4 sm:p-6 rounded-xl">
            <h3 className="text-base sm:text-lg font-medium text-white">Platform Integration</h3>
            <div className="space-y-4">
                {/* LeetCode Input */}
                {renderPlatformField(
                    'leetcode',
                    <Terminal className="h-5 w-5 text-gray-400" />,
                    'LeetCode Username'
                )}

                {/* GitHub Input */}
                {renderPlatformField(
                    'github',
                    <Github className="h-5 w-5 text-gray-400" />,
                    'GitHub Username'
                )}

                {/* Codeforces Input */}
                {renderPlatformField(
                    'codeforces',
                    <Code2 className="h-5 w-5 text-gray-400" />,
                    'Codeforces Username'
                )}
            </div>

            {/* Platform Status Summary */}
            {platforms && Object.keys(platforms).length > 0 && (
                <div className="mt-4 p-2 sm:p-3 bg-gray-700/30 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-2">Platform Status</h4>
                    <div className="space-y-1">
                        {Object.entries(platforms).map(([platformName, platformData]) => (
                            <div key={platformName} className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-gray-400 capitalize">{platformName}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-300">@{platformData.username}</span>
                                    <div className={`w-2 h-2 rounded-full ${platformData.isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Invite Note */}
            {(() => {
                const params = new URLSearchParams(window.location.search);
                const isNewUser = params.get('newUser') === 'true';
                const pendingInviteCode = sessionStorage.getItem('app-pendingInviteCode');

                if (isNewUser && pendingInviteCode) {
                    return (
                        <div className="mt-6 p-3 sm:p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
                            <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-blue-400 font-medium text-sm">You have a pending room invite!</p>
                                    <p className="text-gray-400 mt-1 text-xs sm:text-sm">
                                        After adding your platform usernames, you can join the room by:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1 text-xs sm:text-sm">
                                        <li>Navigating to the Rooms tab in your dashboard, or</li>
                                        <li>Reopening the invite link you received.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}
        </div>
    );
};

AddPlatform.propTypes = {
    onPlatformsUpdate: PropTypes.func.isRequired,
    platforms: PropTypes.shape({
        leetcode: PropTypes.shape({
            username: PropTypes.string,
            isValid: PropTypes.bool,
            lastUpdated: PropTypes.string,
        }),
        github: PropTypes.shape({
            username: PropTypes.string,
            isValid: PropTypes.bool,
            lastUpdated: PropTypes.string,
        }),
        codeforces: PropTypes.shape({
            username: PropTypes.string,
            isValid: PropTypes.bool,
            lastUpdated: PropTypes.string,
        }),
    }),
};

export default AddPlatform;