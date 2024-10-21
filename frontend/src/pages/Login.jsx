import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLogin from '../hooks/useLogin';
import toast from 'react-hot-toast';
import BrandingSection from './BrandingSection';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const navigate = useNavigate();
    const { login, loading } = useLogin();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // await login(formData.email, formData.password);
            const data = await login(formData.email, formData.password); // Call the hook's login function
            console.log(data.token);
            toast.success('Login successful!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || 'An unexpected error occurred');
        }
    };

    return (
        <div className="min-h-screen flex items-stretch bg-gray-900">
            <BrandingSection />
            <div className="w-full md:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
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
                            disabled={loading}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                    <div className="text-center">
                        <button
                            onClick={() => navigate('/signup')}
                            className="font-medium text-purple-400 hover:text-purple-500"
                        >
                            Need an account? Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;