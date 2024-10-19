// src/components/settings/UserSettings.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext.jsx';
const API_URL = "http://localhost:5000/api";


const UserSettings = () => {
    const { user, setUser } = useAuthContext();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        leetcodeUsername: user?.platforms?.leetcode?.username || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        profilePicture: user?.profilePicture || '',
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const updateProfile = async (type, data) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/users/settings/${type}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Something went wrong');
            }

            setUser(result.data.user);
            toast.success(result.message);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }

        await updateProfile('password', {
            oldPassword: formData.oldPassword,
            newPassword: formData.newPassword
        });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        await updateProfile('username', { username: formData.username });
        await updateProfile('email', { email: formData.email });
    };

    const handleLeetCodeUpdate = async (e) => {
        e.preventDefault();
        await updateProfile('leetcode', { leetcodeUsername: formData.leetcodeUsername });
    };

    const handleAvatarUpdate = async (e) => {
        e.preventDefault();
        await updateProfile('avatar', { profilePicture: formData.profilePicture });
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                const response = await fetch(`${API_URL}/users/profile`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    localStorage.removeItem('token');
                    setUser(null);
                    navigate('/');
                    toast.success('Account deleted successfully');
                }
            } catch (error) {
                toast.error('Failed to delete account');
            }
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            className={`px-6 py-4 text-sm font-medium ${activeTab === 'profile'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profile
                        </button>
                        <button
                            className={`px-6 py-4 text-sm font-medium ${activeTab === 'security'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('security')}
                        >
                            Security
                        </button>
                        <button
                            className={`px-6 py-4 text-sm font-medium ${activeTab === 'integrations'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('integrations')}
                        >
                            Integrations
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    minLength={3}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Profile Picture URL
                                </label>
                                <input
                                    type="url"
                                    name="profilePicture"
                                    value={formData.profilePicture}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isLoading ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    name="oldPassword"
                                    value={formData.oldPassword}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    minLength={8}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    minLength={8}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>

                            <div className="mt-6 border-t border-gray-200 pt-6">
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'integrations' && (
                        <form onSubmit={handleLeetCodeUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    LeetCode Username
                                </label>
                                <input
                                    type="text"
                                    name="leetcodeUsername"
                                    value={formData.leetcodeUsername}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isLoading ? 'Updating...' : 'Update LeetCode Username'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserSettings;