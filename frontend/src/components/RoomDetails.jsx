import { useState } from "react"
import { Plus, Users, Calendar, Lock, Unlock, User, Copy, Check, UserPlus, Ban, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog.jsx"
import { Button } from "./ui/Button.jsx"
import { Alert, AlertDescription } from "./ui/Alert.jsx"
import { useAuthContext } from "../context/AuthContext.jsx"
import ApiService from "../services/ApiService"
import toast from "react-hot-toast"
import KickUserModal from "./kick-user-modal"

const RoomDetails = ({ roomDetails, loading, error, setError, onRoomUpdated }) => {
    const { authUser } = useAuthContext()
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [inviteData, setInviteData] = useState(null)
    const [copied, setCopied] = useState(false)
    const [isGeneratingLink, setIsGeneratingLink] = useState(false)

    // New state for admin modals
    const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false)
    const [isKickUserModalOpen, setIsKickUserModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [isDeleteRoomModalOpen, setIsDeleteRoomModalOpen] = useState(false)

    const handleInviteClick = async () => {
        try {
            setIsGeneratingLink(true)
            const response = await ApiService.post(`/rooms/admin/${roomDetails.roomId}/invite`)

            if (response.data.success) {
                setInviteData(response.data.data)
                setIsInviteModalOpen(true)
            } else {
                toast.error(response.data.message || "Failed to generate invite link")
            }
        } catch (error) {
            console.error("Error generating invite link:", error)
            toast.error("Failed to generate invite link. Please try again.")
        } finally {
            setIsGeneratingLink(false)
        }
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(inviteData?.inviteLink)
            setCopied(true)
            toast.success("Invite link copied to clipboard")
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
            toast.error("Failed to copy link to clipboard")
        }
    }

    const handleAddAdmin = async (userId) => {
        try {
            const response = await ApiService.post(`/rooms/admin/${roomDetails.roomId}/admins/add`, { userId })
            if (response.data.success) {
                toast.success(`${userId} added as admin`)
                onRoomUpdated() // Refresh room details
                setIsAddAdminModalOpen(false)
            } else {
                toast.error(response.data.message || "Failed to add admin")
            }
        } catch (error) {
            console.error("Error adding admin:", error)
            toast.error("Failed to add admin. Please try again.")
        }
    }

    const handleRemoveAdmin = async (username) => {
        try {
            const response = await ApiService.post(`/rooms/admin/${roomDetails.roomId}/admins/remove`, { username })
            if (response.data.success) {
                toast.success(`${username} removed from admins`)
                onRoomUpdated() // Refresh room details
            } else {
                toast.error(response.data.message || "Failed to remove admin")
            }
        } catch (error) {
            console.error("Error removing admin:", error)
            toast.error("Failed to remove admin. Please try again.")
        }
    }

    const handleKickUser = async () => {
        if (!selectedUser) return
        try {
            const response = await ApiService.post(`/rooms/admin/${roomDetails.roomId}/kick`, { userId: selectedUser._id })
            if (response.data.success) {
                toast.success(`${selectedUser.username} kicked from the room`)
                onRoomUpdated() // Refresh room details
                setIsKickUserModalOpen(false)
                setSelectedUser(null)
            } else {
                toast.error(response.data.message || "Failed to kick user")
            }
        } catch (error) {
            console.error("Error kicking user:", error)
            toast.error("Failed to kick user. Please try again.")
        }
    }

    const handleMuteUser = async (username) => {
        try {
            const response = await ApiService.post(`/rooms/${roomDetails.roomId}/mute`, { username })
            if (response.data.success) {
                toast.success(`${username} muted`)
                onRoomUpdated() // Refresh room details
            } else {
                toast.error(response.data.message || "Failed to mute user")
            }
        } catch (error) {
            console.error("Error muting user:", error)
            toast.error("Failed to mute user. Please try again.")
        }
    }

    const handleUnmuteUser = async (username) => {
        try {
            const response = await ApiService.post(`/rooms/${roomDetails.roomId}/unmute`, { username })
            if (response.data.success) {
                toast.success(`${username} unmuted`)
                onRoomUpdated() // Refresh room details
            } else {
                toast.error(response.data.message || "Failed to unmute user")
            }
        } catch (error) {
            console.error("Error unmuting user:", error)
            toast.error("Failed to unmute user. Please try again.")
        }
    }

    const handleDeleteRoom = async () => {
        try {
            const response = await ApiService.delete(`/rooms/admin/${roomDetails.roomId}`)
            if (response.data.success) {
                toast.success("Room deleted successfully")
                // Redirect or handle room deletion
                window.location.href = "/rooms" // Adjust path as needed
            } else {
                toast.error(response.data.message || "Failed to delete room")
            }
        } catch (error) {
            console.error("Error deleting room:", error)
            toast.error("Failed to delete room. Please try again.")
        }
    }

    if (loading) return <div className="text-gray-300 p-4">Loading...</div>
    if (error) return <div className="text-red-500 p-4">{error}</div>
    if (!roomDetails) return <div className="text-gray-300 p-4">No room details available</div>

    const formatDate = (dateString) => {
        const options = { year: "numeric", month: "long", day: "numeric" }
        return new Date(dateString).toLocaleDateString(undefined, options)
    }

    const isCurrentUserAdmin = roomDetails.admins.some((admin) => admin.username === authUser.username)

    return (
        <>
            <div className="p-4 h-full overflow-y-auto">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-4 mb-4">
                    <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 mx-auto">
                        #
                    </div>
                    <h2 className="text-xl font-bold text-center mb-1">{roomDetails.name}</h2>
                    <p className="text-sm font-bold text-center">@{roomDetails.roomId}</p>
                    <p className="text-sm text-center mb-2">{roomDetails.description}</p>
                    <div className="flex justify-center items-center">
                        {roomDetails.isPublic ? (
                            <span className="flex items-center text-xs bg-green-500 text-white px-2 py-1 rounded">
                                <Unlock size={12} className="mr-1" /> Public
                            </span>
                        ) : (
                            <span className="flex items-center text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                                <Lock size={12} className="mr-1" /> Private
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                        <Calendar size={16} className="mr-2" /> Created
                    </h3>
                    <p className="text-sm">{formatDate(roomDetails.createdAt)}</p>
                    <p className="text-sm mt-1">by {roomDetails.createdBy}</p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                        <Users size={16} className="mr-2" /> Members ({roomDetails.members.length})
                    </h3>
                    <div className="space-y-2">
                        {roomDetails.members.map((member) => (
                            <div key={member._id} className="flex items-center">
                                <img
                                    src={member.profilePicture || "/placeholder.svg"}
                                    alt={member.username}
                                    className="w-8 h-8 rounded-full mr-2"
                                />
                                <span className="text-sm">{member.username}</span>
                                {roomDetails.admins.some((admin) => admin._id === member._id) && (
                                    <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">Admin</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                        <User size={16} className="mr-2" /> Admins ({roomDetails.admins.length})
                    </h3>
                    <div className="space-y-2">
                        {roomDetails.admins.map((admin) => (
                            <div key={admin._id} className="flex items-center">
                                <img
                                    src={admin.profilePicture || "/placeholder.svg"}
                                    alt={admin.username}
                                    className="w-8 h-8 rounded-full mr-2"
                                />
                                <span className="text-sm">{admin.username}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {isCurrentUserAdmin && (
                    <div className="space-y-2 mt-4">
                        <button
                            onClick={() => setIsAddAdminModalOpen(true)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-300"
                        >
                            <UserPlus size={16} className="mr-2" /> Add Admin
                        </button>

                        <button
                            onClick={handleInviteClick}
                            disabled={isGeneratingLink}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-300"
                        >
                            {isGeneratingLink ? (
                                <span className="flex items-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Generating...
                                </span>
                            ) : (
                                <>
                                    <Plus size={16} className="mr-2" />
                                    Invite Link
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setIsKickUserModalOpen(true)}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-300"
                        >
                            <Ban size={16} className="mr-2" /> Kick User
                        </button>

                        <button
                            onClick={() => setIsDeleteRoomModalOpen(true)}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-300"
                        >
                            <Trash2 size={16} className="mr-2" /> Delete Room
                        </button>
                    </div>
                )}
            </div>
            <Dialog open={isAddAdminModalOpen} onOpenChange={setIsAddAdminModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Admin</DialogTitle>
                        <DialogDescription>Select a room member to add as an admin</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        {roomDetails.members
                            .filter((member) => !roomDetails.admins.some((admin) => admin._id === member._id))
                            .map((member) => (
                                <div
                                    key={member._id}
                                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                                    onClick={() => handleAddAdmin(member._id)}
                                >
                                    <div className="flex items-center">
                                        <img
                                            src={member.profilePicture || "/placeholder.svg"}
                                            alt={member.username}
                                            className="w-8 h-8 rounded-full mr-2"
                                        />
                                        <span>{member.username}</span>
                                    </div>
                                    <UserPlus size={16} className="text-blue-500" />
                                </div>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Room Confirmation Modal */}
            <Dialog open={isDeleteRoomModalOpen} onOpenChange={setIsDeleteRoomModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Room</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this room? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteRoomModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteRoom}>
                            Delete Room
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Room Invite Link</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col space-y-4">
                        <Alert>
                            <AlertDescription className="mt-2 flex items-center justify-between break-all">
                                <span className="mr-2">{inviteData?.inviteLink}</span>
                                <button onClick={copyToClipboard} className="shrink-0 ml-2 text-gray-500 hover:text-gray-700">
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </AlertDescription>
                        </Alert>
                        <p className="text-sm text-gray-500">
                            Expires on: {inviteData?.expiresAt ? formatDate(inviteData.expiresAt) : "N/A"}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
            <KickUserModal
                isOpen={isKickUserModalOpen}
                onClose={() => setIsKickUserModalOpen(false)}
                onConfirm={handleKickUser}
                members={roomDetails.members.filter((member) => member._id !== authUser._id)}
                setSelectedUser={setSelectedUser}
            />
        </>
    )
}

export default RoomDetails

