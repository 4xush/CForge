import React, { useRef } from 'react';

const Message = ({
    avatar,
    senderName,
    time,
    message,
    isEdited,
    onContextMenu
}) => {
    const paragraphRef = useRef(null);

    const handleContextMenu = (e) => {
        if (paragraphRef.current) {
            const rect = paragraphRef.current.getBoundingClientRect();
            const isWithinParagraphWidth =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (isWithinParagraphWidth) {
                onContextMenu(e);
            }
        }
    };

    return (
        <div
            className="flex items-start mb-4"
            onContextMenu={handleContextMenu}
        >
            <img
                src={avatar}
                alt={senderName}
                className="w-10 h-10 rounded-full mr-3"
            />
            <div>
                <div className="flex items-center">
                    <span className="font-semibold text-gray-300 mr-2">{senderName}</span>
                    <span className="text-xs text-gray-500">{time}</span>
                    {isEdited && <span className="text-xs text-gray-500 ml-2">(edited)</span>}
                </div>
                <p
                    ref={paragraphRef}
                    className="bg-gray-800 rounded-lg p-3 inline-block"
                >
                    {message}
                </p>
            </div>
        </div>
    );
};

export default Message;