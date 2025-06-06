import { useState } from "react"
import { MoreVertical, Edit3 } from "lucide-react"
import PropTypes from 'prop-types'

const Message = ({
  avatar,
  senderName,
  time,
  message,
  isEdited,
  isCurrentUser,
  canModify,
  onContextMenu,
  onAvatarClick,
  onEdit,
}) => {
  const [showOptions, setShowOptions] = useState(false)

  // FIXED: Ensure message is always a string
  const messageText =
    typeof message === "string"
      ? message
      : typeof message === "object" && message !== null
        ? message.content || JSON.stringify(message)
        : String(message || "")

  // FIXED: Safe text processing
  const formatMessage = (text) => {
    if (!text || typeof text !== "string") {
      return ""
    }

    try {
      return text.split("\n").map((line, index) => (
        <span key={index}>
          {line}
          {index < text.split("\n").length - 1 && <br />}
        </span>
      ))
    } catch (error) {
      console.error("Error formatting message:", error, "Text:", text)
      return text
    }
  }

  const handleAvatarClick = () => {
    if (onAvatarClick && senderName) {
      onAvatarClick(senderName)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    }
    setShowOptions(false)
  }

  return (
    <div
      className={`flex items-start space-x-3 p-3 hover:bg-gray-800/50 group relative rounded-xl ${isCurrentUser ? "flex-row-reverse space-x-reverse" : ""
        }`}
      onContextMenu={onContextMenu}
    >
      <img
        src={avatar || "/placeholder.svg"}
        alt={`${senderName}'s avatar`}
        className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleAvatarClick}
      />

      <div className={`flex-1 ${isCurrentUser ? "text-right" : ""}`}>
        <div className={`flex items-baseline space-x-2 ${isCurrentUser ? "justify-end" : ""}`}>
          <span className="text-sm font-medium text-gray-300">{senderName}</span>
          <span className="text-xs text-gray-500">{time}</span>
          {isEdited && <span className="text-xs text-gray-500 italic">(edited)</span>}
        </div>

        <div className={`mt-1 text-gray-100 ${isCurrentUser ? "text-right" : ""}`}>{formatMessage(messageText)}</div>
      </div>

      {canModify && (
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>

          {showOptions && (
            <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10 min-w-[120px]">
              <button
                onClick={handleEdit}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

Message.propTypes = {
  avatar: PropTypes.string,
  senderName: PropTypes.string,
  time: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  isEdited: PropTypes.bool,
  isCurrentUser: PropTypes.bool,
  canModify: PropTypes.bool,
  onContextMenu: PropTypes.func,
  onAvatarClick: PropTypes.func,
  onEdit: PropTypes.func,
}

export default Message
