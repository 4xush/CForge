import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();
    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-black text-white">
            <div className="text-center">
                <h1 className="text-9xl font-extrabold text-white tracking-widest">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        404
                    </span>
                </h1>
                <p className="text-2xl font-semibold mt-4 mb-8">
                    Oops! Page not found
                </p>
                <p className="text-lg mb-8">
                    The page you are looking for might have been removed or is temporarily unavailable.
                </p>
                <button
                    onClick={handleGoHome}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Go to Homepage
                </button>
            </div>
        </div>
    );
};

export default NotFound;

