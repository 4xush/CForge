import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSignup from '../hooks/useSignup';

const CustomAlert = ({ message }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{message}</span>
        </div>
    </div>
);

const SignUp = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        gender: '',
        leetcodeUsername: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { loading, signup } = useSignup();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await signup({
                Fullname: formData.fullName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                gender: formData.gender,
                leetcodeUsername: formData.leetcodeUsername
            });
            navigate('/dashboard');
        } catch (error) {
            setError(error.message || 'An unexpected error occurred');
        }
    };

    return (
        <div className="min-h-screen flex items-stretch bg-gray-900">
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-20">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                    Cforge
                </h1>
                <p className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 italic">
                    Empowering Coders, Connecting Minds, Ranking Excellence
                </p>
            </div>

            <div className="w-full md:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                            Sign Up
                        </h2>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="full-name" className="block text-sm font-medium text-gray-300">
                                    Full Name
                                </label>
                                <input
                                    id="full-name"
                                    name="fullName"
                                    type="text"
                                    required
                                    className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                    placeholder=""
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                    placeholder=""
                                    value={formData.username}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-medium text-gray-300">
                                    Email address
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                    placeholder=""
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                    placeholder=""
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-gray-300">
                                    Gender
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    required
                                    className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="leetcode-username" className="block text-sm font-medium text-gray-300">
                                    LeetCode Username
                                </label>
                                <input
                                    id="leetcode-username"
                                    name="leetcodeUsername"
                                    type="text"
                                    required
                                    className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                    placeholder=""
                                    value={formData.leetcodeUsername}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {error && <CustomAlert message={error} />}

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                disabled={loading}
                            >
                                {loading ? <span className="loading loading-spinner"></span> : 'Sign Up'}
                            </button>
                        </div>
                    </form>
                    <div className="text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="font-medium text-purple-400 hover:text-purple-500"
                        >
                            Already have an account? Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;