import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AuthLayout from './AuthPage';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { loginUser, isLoading } = useAuthContext();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await loginUser(formData.email, formData.password);
            toast.success('Login successful!');

            // Optional: Perform any other actions, like checking for a pending invite code.
            const pendingInviteCode = localStorage.getItem('app-pendingInviteCode');
            if (pendingInviteCode) {
                localStorage.removeItem('app-pendingInviteCode');
                window.location.replace('/dashboard'); // Use window.location.replace to navigate
                return;
            }

            // Navigate to the dashboard without reloading using window.location.replace
            window.location.replace('/dashboard');
        } catch (error) {
            // Handle login failure (e.g., show toast or error message)
            toast.error('Login failed. Please check your credentials.');
        }
    };

    return (
        <AuthLayout>
            <h2 className="text-center text-3xl font-bold text-white">Sign In</h2>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
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
                </div>
                <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>
            <div className="text-center">
                <button
                    onClick={() => window.location.replace('/signup')} // Redirect to signup page
                    className="font-medium text-purple-400 hover:text-purple-500"
                >
                    Need an account? Sign Up
                </button>
            </div>
        </AuthLayout>
    );
};

export default Login;
