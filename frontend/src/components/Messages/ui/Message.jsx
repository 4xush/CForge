import { useState } from 'react';
import PropTypes from 'prop-types';
import { Edit,MoreVertical } from 'lucide-react';

const Message = ({
  avatar,
  senderName,
  time,
  message,
  isEdited = false,
  isCurrentUser = false,
  canModify = false,
  onContextMenu = () => {},
  onAvatarClick = () => {},
  onEdit = () => {},
  // onDelete = () => {}
}) => {
  const [showActions, setShowActions] = useState(false);
  
  // Function to handle context menu event
  const handleContextMenu = (e) => {
    if (canModify) {
      e.preventDefault();
      onContextMenu(e);
    }
  };
  
  // Show message with URL linking and code block support
  const renderMessageWithLinks = (text) => {
    // Handle code blocks
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);
    
    return parts.map((part, index) => {
      // If this is a code block (odd index), render it specially
      if (index % 2 === 1) {
        return (
          <pre key={index} className="bg-gray-900 p-2 rounded-md my-2 overflow-x-auto">
            <code className="text-sm text-gray-300">{part}</code>
          </pre>
        );
      }
      
      // Handle URLs in non-code parts
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlParts = part.split(urlRegex);
      
      return urlParts.map((urlPart, urlIndex) => {
        if (urlPart.match(urlRegex)) {
          return (
            <a 
              key={`${index}-${urlIndex}`}
              href={urlPart}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline break-all"
            >
              {urlPart}
            </a>
          );
        }
        return urlPart;
      });
    });
  };

  return (
    <div
      className={`flex items-start mb-3 px-2 py-1.5 hover:bg-gray-800/50 rounded-lg transition-colors relative group ${
        isCurrentUser ? 'pr-12' : ''
      }`}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => canModify && setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <img
        src={avatar}
        alt={senderName}
        className="w-8 h-8 rounded-lg mr-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onAvatarClick(senderName)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-0.5">
          <span 
            className="text-sm font-medium text-gray-300 mr-2 hover:text-blue-400 cursor-pointer" 
            onClick={() => onAvatarClick(senderName)}
          >
            {senderName}
          </span>
          <span className="text-xs text-gray-500">{time}</span>
          {isEdited && (
            <span className="text-xs text-gray-500 ml-1">(edited)</span>
          )}
        </div>
        <div className="text-sm text-gray-200 bg-gray-800 rounded-md p-2 break-words">
          {renderMessageWithLinks(message)}
        </div>
      </div>
      
      {/* Message actions */}
      {canModify && showActions && (
        <div className="absolute right-2 top-1 flex space-x-1">
          <button
            onClick={onEdit}
            className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
            title="Edit Message"
          >
            <Edit size={14} />
          </button>
          {/* <button
            onClick={onDelete}
            className="p-1 rounded-full bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white transition-colors"
            title="Delete Message"
          >
            <Trash2 size={14} />
          </button> */}
        </div>
      )}
      
      {/* Mobile-friendly actions toggle */}
      {canModify && isCurrentUser && (
        <button
          className="absolute right-2 top-1 p-1 md:hidden rounded-full bg-gray-700 text-gray-300 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e);
          }}
        >
          <MoreVertical size={14} />
        </button>
      )}
    </div>
  );
};

Message.propTypes = {
  avatar: PropTypes.string.isRequired,
  senderName: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  isEdited: PropTypes.bool,
  isCurrentUser: PropTypes.bool,
  canModify: PropTypes.bool,
  onContextMenu: PropTypes.func,
  onAvatarClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func
};

export default Message;