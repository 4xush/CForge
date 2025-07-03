import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AuthLayout from './AuthPage';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { loginUser, isLoading, authUser } = useAuthContext();

    // Check if user is already logged in
    useEffect(() => {
        if (authUser) {
            navigate('/dashboard');
        }
    }, [authUser, navigate]);

    // Check for redirected messages in location state (from logout)
    useEffect(() => {
        if (location.state?.message) {
            toast(location.state.message, {
                type: location.state.type || 'default'
            });

            // Clear the message after displaying
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

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
                navigate(`/rooms/join/${pendingInviteCode}`);
                return;
            }

            // Default redirect - removed automatic platform refresh
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || 'Login failed. Please check your credentials.');
            console.error('Login error:', error);
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
                navigate(`/rooms/join/${pendingInviteCode}`);
                return;
            }

            // Default redirect - removed automatic platform refresh
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || 'Google login failed. Please try again.');
            console.error('Google login error:', error);
        }
    };

    const handleGoogleError = () => {
        toast.error('Google login failed. Please try again or use email/password.');
    };

    return (
        <AuthLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-center text-2xl font-bold text-white mb-2">Sign In</h2>
                <form className="mt-4 space-y-4 w-full max-w-xs" onSubmit={handleSubmit}>
                    <div className="space-y-3">
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
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 text-sm"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-4 w-full max-w-xs">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-gray-800 text-gray-300">Or continue with</span>
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
                            text="signin_with"
                            size="large"
                        />
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate('/signup')}
                        className="font-medium text-purple-400 hover:text-purple-500 text-sm"
                    >
                        Need an account? Sign Up
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Login;