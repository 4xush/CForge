import React from 'react';
import Message from './ui/Message';  // Import the Message component

const Chat = () => {
    const personDP = 'https://avatar.iran.liara.run/username?username=[firstname+lastname]';
    const messages = [
        {
            id: 1,
            avatar: personDP,
            senderName: "Jessica",
            time: "09:45 AM",
            message: "Hi everyone, I'm excited to be here for our demo chat! 🎉"
        },
        {
            id: 2,
            avatar: personDP,
            senderName: "Emily",
            time: "09:46 AM",
            message: "Hey Jessica, great to see you here! Looking forward to our discussion."
        },
        {
            id: 3,
            avatar: personDP,
            senderName: "Ryan",
            time: "09:46 AM",
            message: "Hi Jessica and Emily! Glad to join the conversation."
        }
    ];

    return (
        <>
            {/* Render all messages dynamically */}
            {messages.map((msg) => (
                <Message
                    key={msg.id}
                    avatar={msg.avatar}
                    senderName={msg.senderName}
                    time={msg.time}
                    message={msg.message}
                />
            ))}

            {/* Divider for the date */}
            <div className="text-center text-sm text-gray-500 my-2">Today</div>
        </>
    );
};

export default Chat;