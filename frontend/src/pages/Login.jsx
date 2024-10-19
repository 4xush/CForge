import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import useLogin from '../hooks/useLogin';
import { useNavigate } from 'react-router-dom';

const CustomAlert = ({ message }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{message}</span>
        </div>
    </div>
);


const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const { login, loading } = useLogin(); // Use the hook here
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const data = await login(formData.email, formData.password); // Call the hook's login function
            console.log('Success:', data);
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
                            Sign In
                        </h2>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
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
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                    placeholder=""
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {error && <CustomAlert message={error} />}

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                                Sign In
                            </button>
                        </div>
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
