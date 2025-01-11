import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const NotFound = () => {
    const navigate = useNavigate();
    const { authUser } = useContext(AuthContext); // Access authUser from AuthContext

    const handleGoHome = () => {
        if (authUser) {
            navigate('/dashboard'); // Redirect to dashboard if user is logged in
        } else {
            navigate('/'); // Redirect to root if user is not logged in
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300 px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
                    404
                </h1>
                <h2 className="text-2xl font-bold text-red-500 mb-2">
                    Page Not Found
                </h2>
                <p className="text-gray-400 mb-6">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                        {authUser ? 'Go to Dashboard' : 'Go to Homepage'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
