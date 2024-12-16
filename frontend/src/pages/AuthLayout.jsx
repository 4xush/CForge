import React from 'react';
import ParticleBackground from './element/ParticleBackground';

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex items-stretch bg-gray-900 relative overflow-hidden">
            <ParticleBackground />
            <div className="hidden md:flex w-1/2 relative z-10 flex-col justify-center items-center p-8">
                <div className="text-center">
                    <h1
                        className="text-4xl font-bold text-white mb-4"
                        style={{ fontFamily: "'Press Start 2P', cursive" }}
                    >
                        Cforge
                    </h1>
                    <p className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Connect. Code. Excel.
                    </p>
                </div>
            </div>

            {/* Form Section */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative z-10">
                <div className="max-w-md w-full space-y-8 bg-gray-800/80 backdrop-blur-sm p-8 rounded-lg shadow-lg">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;