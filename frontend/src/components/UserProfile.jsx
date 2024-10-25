import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { updateProfile } from '../api';
import { Camera, Edit2, Save, X, Award, Book } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

const UserInfo = () => {
    const { authUser, loginUser } = useAuthContext();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        fullName: authUser?.fullName || '',
        username: authUser?.username || '',
        gender: authUser?.gender || '',
        leetcodeUsername: authUser?.platforms?.leetcode?.username || ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const updatedUser = await updateProfile('profile', {
                fullName: formData.fullName,
                username: formData.username,
                gender: formData.gender,
                platforms: {
                    leetcode: {
                        username: formData.leetcodeUsername
                    }
                }
            });

            // Update local auth state with new user data
            loginUser(updatedUser);
            setIsEditing(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getLeetcodeStats = () => {
        const stats = authUser?.platforms?.leetcode;
        return {
            total: stats?.totalQuestionsSolved || 0,
            easy: stats?.questionsSolvedByDifficulty?.easy || 0,
            medium: stats?.questionsSolvedByDifficulty?.medium || 0,
            hard: stats?.questionsSolvedByDifficulty?.hard || 0,
            rating: stats?.contestRating || 0,
            contests: stats?.attendedContestsCount || 0
        };
    };

    const leetcodeStats = getLeetcodeStats();

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            {/* Profile Header */}
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Profile Information</CardTitle>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        {isEditing ? (
                            <X className="h-5 w-5 text-gray-600" />
                        ) : (
                            <Edit2 className="h-5 w-5 text-gray-600" />
                        )}
                    </button>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start space-x-6">
                        {/* Profile Picture */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {authUser?.profilePicture ? (
                                    <img
                                        src={authUser.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Camera className="h-8 w-8 text-gray-400" />
                                )}
                            </div>
                        </div>

                        {/* User Details Form */}
                        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={isEditing ? formData.fullName : authUser?.fullName}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={isEditing ? formData.username : authUser?.username}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={authUser?.email}
                                        disabled
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={isEditing ? formData.gender : authUser?.gender}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* LeetCode Section */}
                            <div className="mt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    LeetCode Profile
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            LeetCode Username
                                        </label>
                                        <input
                                            type="text"
                                            name="leetcodeUsername"
                                            value={isEditing ? formData.leetcodeUsername : authUser?.platforms?.leetcode?.username}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* LeetCode Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <Book className="h-5 w-5 text-blue-500 mb-2" />
                                            <div className="text-2xl font-bold">{platforms.leetcode.total}</div>
                                            <div className="text-sm text-gray-600">Problems Solved</div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <Award className="h-5 w-5 text-yellow-500 mb-2" />
                                            <div className="text-2xl font-bold">{platforms.leetcode.rating}</div>
                                            <div className="text-sm text-gray-600">Contest Rating</div>
                                        </div>
                                    </div>

                                    {/* Problem Difficulty Breakdown */}
                                    <div className="md:col-span-2">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <div className="text-lg font-semibold text-green-600">
                                                    {platforms.leetcode.easy}
                                                </div>
                                                <div className="text-sm text-gray-600">Easy</div>
                                            </div>
                                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                                <div className="text-lg font-semibold text-yellow-600">
                                                    {platforms.leetcode.medium}
                                                </div>
                                                <div className="text-sm text-gray-600">Medium</div>
                                            </div>
                                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                                <div className="text-lg font-semibold text-red-600">
                                                    {platforms.leetcode.hard}
                                                </div>
                                                <div className="text-sm text-gray-600">Hard</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Save className="h-5 w-5" />
                                        )}
                                        <span>Save Changes</span>
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserInfo;