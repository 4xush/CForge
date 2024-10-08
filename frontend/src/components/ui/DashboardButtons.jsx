import React from 'react';

const DashboardButton = ({ icon: Icon, label, badge, onClick }) => {
    return (
        <button
            className="flex items-center mb-3 text-blue-200 hover:bg-gray-700 p-2 rounded transition-colors"
            onClick={onClick} // Attach click handler
        >
            {Icon && <Icon className="mr-2" size={18} />}
            <span className="text-sm">{label}</span>
            {badge && (
                <span className="ml-auto bg-pink-500 text-xs px-2 rounded-full">
                    {badge}
                </span>
            )}
        </button>
    );
};

export default DashboardButton;
