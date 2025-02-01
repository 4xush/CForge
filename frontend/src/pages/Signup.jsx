import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext'; // Update path as needed
import toast from 'react-hot-toast';
import AuthLayout from './AuthPage';

const SignUp = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
        // leetcodeUsername: '',
    });
    const navigate = useNavigate();
    const { registerUser, isLoading } = useAuthContext();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        try {
            const userData = {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                username: formData.email.split('@')[0],
                profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName}`,
                gender: formData.gender,
                // leetcodeUsername: formData.leetcodeUsername,
            };

            await registerUser(userData);
            toast.success('Registration successful!');

            const pendingInviteCode = localStorage.getItem('app-pendingInviteCode');
            if (pendingInviteCode) {
                localStorage.removeItem('app-pendingInviteCode');
                navigate('/dashboard', {
                    state: {
                        inviteCode: pendingInviteCode,
                        showInviteModal: true,
                    },
                });
                return;
            }

            window.location.href = '/settings?tab=platforms';
        } catch (error) {
            console.error('Registration error:', error);
        }
    };

    return (
        <AuthLayout>
            <h2 className="text-center text-3xl font-bold text-white">Sign Up</h2>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <input
                        name="fullName"
                        type="text"
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                    />
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                    <input
                        name="password"
                        type="password"
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleInputChange}
                    />
                    <input
                        name="confirmPassword"
                        type="password"
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                    />
                    <select
                        name="gender"
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formData.gender}
                        onChange={handleInputChange}
                    >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                    {/* <input
                        name="leetcodeUsername"
                        type="text"
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="LeetCode Username"
                        value={formData.leetcodeUsername}
                        onChange={handleInputChange}
                    /> */}
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing Up...' : 'Sign Up'}
                </button>
            </form>
            <div className="text-center">
                <button
                    onClick={() => window.location.replace('/login')}
                    className="font-medium text-purple-400 hover:text-purple-500"
                >
                    Already have an account? Sign In
                </button>
            </div>
        </AuthLayout>
    );
};

export default SignUp;
