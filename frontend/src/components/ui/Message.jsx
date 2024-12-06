import React from 'react';

const Message = ({ avatar, senderName, time, message }) => {
    return (
        <div className="flex items-start mb-4">
            <img
                src={avatar}
                alt={senderName}
                className="w-10 h-10 rounded-full mr-3"
            />
            <div>
                <div className="flex items-center">
                    <span className="font-semibold text-gray-300 mr-2">{senderName}</span>
                    <span className="text-xs text-gray-500">{time}</span>
                </div>
                <p className="bg-gray-800 rounded-lg p-3 inline-block">{message}</p>
            </div>
        </div>
    );
};

export default Message;