import React from 'react';

const FullScreenLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
            <p className="mt-4 text-white text-lg">Loading...</p>
        </div>
    );
};

export default FullScreenLoader;
