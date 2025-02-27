import React, { useEffect, useRef, useState } from "react"
import { useRoomContext } from "../../context/RoomContext"
import { useAuthContext } from "../../context/AuthContext"
import { useMessageContext } from "../../context/MessageContext"
import Message from "./ui/Message"
import MessageInput from "./MessageInput"
import ContextMenu from "./ChatContextMenu"
import PublicUserProfileModal from "../../components/PublicUserProfileModal"
import { format, isToday, isYesterday, isSameYear } from "date-fns"

const Chat = () => {
    const { selectedRoom } = useRoomContext()
    const { authUser } = useAuthContext()
    const { messages, loading, hasMore, fetchMessages, addMessage, deleteMessage, editMessage } = useMessageContext()

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null })
    const [editingMessage, setEditingMessage] = useState(null)
    const [loadingMore, setLoadingMore] = useState(false)
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: null })
    const messagesEndRef = useRef(null)
    const contextMenuRef = useRef(null)

    useEffect(() => {
        if (selectedRoom) {
            fetchMessages()
        }
    }, [selectedRoom, fetchMessages])

    useEffect(() => {
        if (!loadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [loadingMore, messages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                closeContextMenu()
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const loadOlderMessages = async () => {
        if (!hasMore || loadingMore || !messages.length) return

        setLoadingMore(true)
        try {
            const oldestMessage = messages[0]
            await fetchMessages(oldestMessage._id)
        } catch (error) {
            console.error("Error loading older messages:", error)
        } finally {
            setLoadingMore(false)
        }
    }

    const handleContextMenu = (e, messageId) => {
        e.preventDefault()
        const message = messages.find((msg) => msg._id === messageId)
        if (canModifyMessage(message)) {
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                messageId,
            })
        }
    }

    const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, messageId: null })

    const canModifyMessage = (message) => {
        if (!authUser) return false
        if (message.sender._id === authUser._id) return true
        return selectedRoom.admins.some((admin) => admin.toString() === authUser._id.toString())
    }

    const handleDeleteMessage = async (messageId) => {
        try {
            await deleteMessage(messageId)
            closeContextMenu()
        } catch (error) {
            console.error("Delete error:", error)
        }
    }

    const handleEditMessage = async (messageId, newContent) => {
        try {
            await editMessage(messageId, newContent)
            setEditingMessage(null)
        } catch (error) {
            console.error("Edit error:", error)
        }
    }

    const startEditing = (message) => {
        setEditingMessage(message)
        closeContextMenu()
    }

    const cancelEditing = () => setEditingMessage(null)

    const formatMessageDate = (date) => {
        const messageDate = new Date(date)
        if (isToday(messageDate)) return "Today"
        if (isYesterday(messageDate)) return "Yesterday"
        if (isSameYear(messageDate, new Date())) return format(messageDate, "MMMM d")
        return format(messageDate, "MMMM d, yyyy")
    }

    const handleAvatarClick = (username) => {
        setProfileModal({
            isOpen: true,
            username: username
        })
    }

    const closeProfileModal = () => {
        setProfileModal({ isOpen: false, username: null })
    }

    if (!selectedRoom) return <div className="text-center text-gray-500 mt-4">Select a room to view messages</div>
    if (loading && !loadingMore) return <div className="text-center text-gray-500 mt-4">Loading messages...</div>

    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatMessageDate(message.createdAt)
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(message)
        return groups
    }, {})

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto">
                {hasMore && (
                    <div className="text-center py-2">
                        <button
                            onClick={loadOlderMessages}
                            disabled={loadingMore}
                            className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 transition-colors duration-200"
                        >
                            {loadingMore ? "Loading..." : "Load older messages"}
                        </button>
                    </div>
                )}

                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="text-center text-xs text-gray-500 my-2">{date}</div>
                        {msgs.map((msg) => (
                            <div key={`${msg._id}-${msg.createdAt}`} className="relative group">
                                {editingMessage?._id === msg._id ? (
                                    <div className="px-4 py-2">
                                        <MessageInput
                                            initialMessage={msg.content}
                                            onMessageSent={(content) => handleEditMessage(msg._id, content)}
                                            onCancel={cancelEditing}
                                            isEditing={true}
                                        />
                                    </div>
                                ) : (
                                    <Message
                                        avatar={
                                            msg.sender.profilePicture ||
                                            `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(msg.sender.username)}`
                                        }
                                        senderName={msg.sender.username}
                                        time={format(new Date(msg.createdAt), "HH:mm")}
                                        message={msg.content}
                                        isEdited={msg.isEdited}
                                        onContextMenu={(e) => handleContextMenu(e, msg._id)}
                                        onAvatarClick={() => handleAvatarClick(msg.sender.username)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {messages.length === 0 && <div className="text-center text-gray-500 mt-4">No messages yet</div>}
                <div ref={messagesEndRef} />
            </div>

            {contextMenu.visible && (
                <div
                    ref={contextMenuRef}
                    style={{
                        position: "fixed",
                        top: `${contextMenu.y}px`,
                        left: `${contextMenu.x}px`,
                    }}
                >
                    <ContextMenu
                        onEdit={() => {
                            const messageToEdit = messages.find((m) => m._id === contextMenu.messageId)
                            startEditing(messageToEdit)
                        }}
                        onDelete={() => handleDeleteMessage(contextMenu.messageId)}
                        onCancel={closeContextMenu}
                    />
                </div>
            )}

            <div className="px-4 py-2">
                <MessageInput onMessageSent={addMessage} />
            </div>

            {/* User Profile Modal */}
            <PublicUserProfileModal
                username={profileModal.username}
                isOpen={profileModal.isOpen}
                onClose={closeProfileModal}
            />
        </div>
    )
}

export default Chat