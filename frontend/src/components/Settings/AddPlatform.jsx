import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Github, Terminal, Code2, Loader2 } from 'lucide-react';
import ApiService from '../../services/ApiService';
import { toast } from 'react-hot-toast';

const AddPlatform = ({ onPlatformsUpdate, platforms }) => {
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
    const [isNewUser, setIsNewUser] = useState(false);
    const [loading, setLoading] = useState({
        leetcode: false,
        github: false,
        codeforces: false
    });

    useEffect(() => {
        // Check if this is a new user by looking at the URL params
        const params = new URLSearchParams(window.location.search);
        setIsNewUser(params.get('newUser') === 'true');
    }, []);

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

        setLoading(prev => ({ ...prev, [platform]: true }));

        try {
            const response = await ApiService.put(`/users/platform/${platform}`, {
                username: username
            });

            if (response.data) {
                toast.success(`${platform} username updated successfully`);
                if (onPlatformsUpdate) {
                    onPlatformsUpdate(response.data.platform);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to update ${platform} username`);
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

    return (
        <div className="space-y-6 bg-gray-800/50 p-6 rounded-xl">
            <h3 className="text-lg font-medium text-white">Platform Integration</h3>
            <div className="space-y-4">
                {/* LeetCode Input */}
                <div className={`relative flex items-center gap-2 ${isNewUser && !formData.leetcodeUsername ? 'animate-pulse ring-2 ring-blue-500 rounded-lg' : ''}`}>
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Terminal className={`h-5 w-5 ${isNewUser && !formData.leetcodeUsername ? 'text-blue-400' : 'text-gray-400'}`} />
                        </div>
                        <input
                            type="text"
                            name="leetcodeUsername"
                            value={formData.leetcodeUsername}
                            onChange={handleChange}
                            placeholder="LeetCode Username"
                            className={`w-full pl-10 pr-3 py-2 ${isNewUser && !formData.leetcodeUsername ? 'bg-blue-900/20' : 'bg-gray-800/50'} rounded-lg border ${isNewUser && !formData.leetcodeUsername ? 'border-blue-500' : 'border-gray-700'} focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white`}
                            autoFocus={isNewUser}
                        />
                    </div>
                    <button
                        onClick={() => updatePlatform('leetcode')}
                        disabled={loading.leetcode || !formData.leetcodeUsername || formData.leetcodeUsername === originalData.leetcodeUsername}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-500/50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                        {loading.leetcode ? (
                            <>
                                <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update'
                        )}
                    </button>
                </div>

                {/* GitHub Input */}
                <div className="relative flex items-center gap-2">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Github className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="githubUsername"
                            value={formData.githubUsername}
                            onChange={handleChange}
                            placeholder="GitHub Username"
                            className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
                        />
                    </div>
                    <button
                        onClick={() => updatePlatform('github')}
                        disabled={loading.github || !formData.githubUsername || formData.githubUsername === originalData.githubUsername}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-500/50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                        {loading.github ? (
                            <>
                                <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update'
                        )}
                    </button>
                </div>

                {/* Codeforces Input */}
                <div className="relative flex items-center gap-2">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Code2 className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="codeforcesUsername"
                            value={formData.codeforcesUsername}
                            onChange={handleChange}
                            placeholder="Codeforces Username"
                            className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
                        />
                    </div>
                    <button
                        onClick={() => updatePlatform('codeforces')}
                        disabled={loading.codeforces || !formData.codeforcesUsername || formData.codeforcesUsername === originalData.codeforcesUsername}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-500/50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                        {loading.codeforces ? (
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
AddPlatform.propTypes = {
    onPlatformsUpdate: PropTypes.func.isRequired,
    platforms: PropTypes.shape({
        leetcode: PropTypes.shape({
            username: PropTypes.string,
        }),
        github: PropTypes.shape({
            username: PropTypes.string,
        }),
        codeforces: PropTypes.shape({
            username: PropTypes.string,
        }),
    }),
};

export default AddPlatform;