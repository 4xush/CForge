import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AuthLayout from './AuthPage';
import { GoogleLogin } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SignUp = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
    });

    const navigate = useNavigate();
    const { registerUser, isLoading, loginUser, authUser } = useAuthContext();

    // ✅ Block initial render until auth is determined
    useEffect(() => {
        if (authUser) {
            navigate('/dashboard', { replace: true });
        }
    }, [authUser, navigate]);

    // Optional: show spinner or null while auth is loading or user already logged in
    if (isLoading || authUser) return null;

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
            };

            await registerUser(userData);
            toast.success('Registration successful!');

            const pendingInviteCode = sessionStorage.getItem('app-pendingInviteCode');
            if (pendingInviteCode) {
                sessionStorage.setItem('app-pendingInviteCode', pendingInviteCode);
            }

            navigate('/settings?tab=platforms&newUser=true');
        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Registration failed. Please try again.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await loginUser(null, null, credentialResponse.credential);
            toast.success('Google sign up successful!');

            const pendingInviteCode = sessionStorage.getItem('app-pendingInviteCode');
            if (pendingInviteCode) {
                sessionStorage.setItem('app-pendingInviteCode', pendingInviteCode);
            }

            navigate('/settings?tab=platforms&newUser=true');
        } catch (error) {
            toast.error(error.message || 'Google sign up failed. Please try again.');
            console.error('Google sign up error:', error);
        }
    };

    const handleGoogleError = () => {
        toast.error('Google sign up failed. Please try again or use email/password.');
    };

    return (
        <AuthLayout>
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-center text-2xl font-bold text-white mb-2">Sign Up</h2>
                <form className="mt-4 space-y-3 w-full max-w-xs" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <input
                            name="fullName"
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                        />
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                        />
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                        />
                        <select
                            name="gender"
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            value={formData.gender}
                            onChange={handleInputChange}
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 text-sm"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-4 w-full max-w-xs">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-gray-800 text-gray-300">Or sign up with</span>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-center">
                        <GoogleLogin
                            clientId={clientId}
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap
                            theme="filled_black"
                            shape="pill"
                            text="signup_with"
                            size="large"
                        />
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="font-medium text-purple-400 hover:text-purple-500 text-sm"
                    >
                        Already have an account? Sign In
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
};

export default SignUp;
