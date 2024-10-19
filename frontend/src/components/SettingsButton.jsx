import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react'; // Assuming you're using lucide-react for icons

const SettingsButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed top-4 right-4 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            aria-label="Open Settings"
        >
            <SettingsIcon size={24} />
        </button>
    );
};

export default SettingsButton;