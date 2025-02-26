const Room = require("../models/Room");
const User = require("../models/User");

const isAdmin = (room, userId) => {
  return room.admins.some((admin) => admin.toString() === userId.toString());
};

// Update Room
exports.updateRoom = async (req, res) => {
  try {
    const { name, description, isPublic, maxMembers, roomId } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can update the room" });
    }

    room.name = name || room.name;
    room.description = description || room.description;
    room.isPublic = isPublic !== undefined ? isPublic : room.isPublic;
    room.maxMembers = maxMembers || room.maxMembers;
    room.roomId = roomId || room.roomId;
    await room.save();
    res.json({ success: true, message: "Room updated successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating room", error: error.message });
  }
};

// Add Admin
exports.addAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can add other admins" });
    }

    if (!room.members.includes(userId)) {
      return res.status(400).json({ message: "User is not a member of the room" });
    }

    if (room.admins.includes(userId)) {
      return res.status(400).json({ message: "User is already an admin" });
    }

    room.admins.push(userId);
    await room.save();
    res.json({ success: true, message: "Admin added successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding admin", error: error.message });
  }
};

// Remove Admin
exports.removeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can remove other admins" });
    }

    if (req.user._id.toString() === userId.toString()) {
      return res.status(400).json({ message: "You cannot remove yourself as an admin" });
    }

    if (!room.admins.includes(userId)) {
      return res.status(400).json({ message: "User is not an admin" });
    }

    room.admins = room.admins.filter((admin) => admin.toString() !== userId.toString());
    await room.save();
    return res.json({ success: true, message: "Admin removed successfully", room });
  } catch (error) {
    console.error("Error removing admin:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to remove admin", error: error.message });
  }
};



// Kick User
exports.kickUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can kick users" });
    }

    if (!room.members.includes(userId)) {
      return res.status(400).json({ message: "User is not a member of the room" });
    }

    room.members = room.members.filter((member) => member.toString() !== userId.toString());
    room.admins = room.admins.filter((admin) => admin.toString() !== userId.toString());
    await room.save();
    res.json({ success: true, message: "User kicked successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error kicking user", error: error.message });
  }
};

// Approve Join Request
exports.approveJoinRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can approve join requests" });
    }

    const joinRequest = room.joinRequests.find((request) => request.user.toString() === userId.toString());
    if (!joinRequest) {
      return res.status(400).json({ message: "Join request not found" });
    }

    room.members.push(userId);
    room.joinRequests = room.joinRequests.filter((request) => request.user.toString() !== userId.toString());
    await room.save();
    res.json({ success: true, message: "Join request approved successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error approving join request", error: error.message });
  }
};

// Reject Join Request
exports.rejectJoinRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can reject join requests" });
    }

    room.joinRequests = room.joinRequests.filter((request) => request.user.toString() !== userId.toString());
    await room.save();
    res.json({ success: true, message: "Join request rejected successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error rejecting join request", error: error.message });
  }
};

// Delete Room
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can delete the room" });
    }

    await room.remove();
    res.json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting room", error: error.message });
  }
};