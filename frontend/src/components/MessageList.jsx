// src/components/MessageList.jsx
import React from 'react';
import { MessageSquareIcon } from 'lucide-react';

const MessageList = () => {
    return (
        <>
            <h2 className="text-lg mb-3 flex items-center">
                <MessageSquareIcon className="mr-2" size={18} />
                Messages
            </h2>

            <div className="text-sm text-gray-400">No messages available</div>
            {/* Replace this with actual message data later */}
        </>
    );
};

export default MessageList;
