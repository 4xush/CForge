// src/components/MessageDetails.jsx
import React from 'react';

const MessageDetails = ({ message }) => {
    if (!message) {
        return <div className="text-gray-500">Select a message to view its details</div>;
    }

    return (
        <div className="p-4 bg-gray-700 text-white rounded-lg">
            <h3 className="text-lg font-bold">Message from {message.sender}</h3>
            <p className="text-sm">{message.content}</p>
            <p className="text-sm">Sent at: {message.timestamp}</p>
            {/* Add more details or actions here */}
        </div>
    );
};

export default MessageDetails;
