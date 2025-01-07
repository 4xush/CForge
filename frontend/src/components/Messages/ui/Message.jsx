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
      className="flex items-start mb-3 px-2 py-1.5 hover:bg-gray-800/50 rounded-lg transition-colors"
      onContextMenu={handleContextMenu}
    >
      <img
        src={avatar}
        alt={senderName}
        className="w-8 h-8 rounded-lg mr-2"
      />
      <div>
        <div className="flex items-center mb-0.5">
          <span className="text-sm font-medium text-gray-300 mr-2">{senderName}</span>
          <span className="text-xs text-gray-500">{time}</span>
          {isEdited && <span className="text-xs text-gray-500 ml-1">(edited)</span>}
        </div>
        <p
          ref={paragraphRef}
          className="text-sm text-gray-200 bg-gray-800 rounded-md p-2"
        >
          {message}
        </p>
      </div>
    </div>
  );
};

export default Message;