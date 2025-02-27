import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AuthLayout from './AuthPage';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const Login = () => {
    const navigate = useNavigate();
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
            // Check for pending invite code in sessionStorage
            const pendingInviteCode = sessionStorage.getItem('app-pendingInviteCode');
            if (pendingInviteCode) {
                sessionStorage.removeItem('app-pendingInviteCode');
                window.location.replace(`/rooms/join/${pendingInviteCode}`);
                return;
            }
            // Default redirect
            window.location.replace('/dashboard');
        } catch (error) {
            toast.error('Login failed. Please check your credentials.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            // Send the ID token to your backend to verify and create a session
            await loginUser(null, null, credentialResponse.credential);
            toast.success('Google login successful!');

            // Check for pending invite code in sessionStorage
            const pendingInviteCode = sessionStorage.getItem('app-pendingInviteCode');
            if (pendingInviteCode) {
                sessionStorage.removeItem('app-pendingInviteCode');
                window.location.replace(`/rooms/join/${pendingInviteCode}`);
                return;
            }

            // Default redirect
            navigate('/dashboard');
        } catch (error) {
            toast.error('Google login failed. Please try again.');
            console.error('Google login error:', error);
        }
    };

    const handleGoogleError = () => {
        toast.error('Google login failed. Please try again or use email/password.');
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

            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-300">Or continue with</span>
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <GoogleLogin
                        clientId={clientId}
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap
                        theme="filled_black"
                        shape="pill"
                        text="signin_with"
                        size="large"
                    />
                </div>
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={() => navigate('/signup')}
                    className="font-medium text-purple-400 hover:text-purple-500"
                >
                    Need an account? Sign Up
                </button>
            </div>
        </AuthLayout>
    );
};

export default Login;