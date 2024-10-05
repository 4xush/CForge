const Room = require("../models/Room");
const User = require("../models/User");

// Helper function to check if a user is an admin of a room
const isAdmin = (room, userId) => {
  return room.admins.some((admin) => admin.toString() === userId.toString());
};

exports.approveJoinRequest = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can approve join requests" });
    }

    const requestIndex = room.joinRequests.findIndex(
      (request) => request._id.toString() === req.params.requestId
    );
    if (requestIndex === -1) {
      return res.status(404).json({ message: "Join request not found" });
    }

    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ message: "The room is full" });
    }

    const request = room.joinRequests[requestIndex];
    room.members.push(request.user);
    room.joinRequests.splice(requestIndex, 1);

    await room.save();
    res.json({ message: "Join request approved successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error approving join request", error: error.message });
  }
};

exports.declineJoinRequest = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can decline join requests" });
    }

    const requestIndex = room.joinRequests.findIndex(
      (request) => request._id.toString() === req.params.requestId
    );
    if (requestIndex === -1) {
      return res.status(404).json({ message: "Join request not found" });
    }

    room.joinRequests.splice(requestIndex, 1);
    await room.save();
    res.json({ message: "Join request declined successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error declining join request", error: error.message });
  }
};
exports.updateRoom = async (req, res) => {
  try {
    const { name, description, isPublic, maxMembers } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the authenticated user is an admin
    if (!room.admins.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can update the room" });
    }

    room.name = name || room.name;
    room.description = description || room.description;
    room.isPublic = isPublic !== undefined ? isPublic : room.isPublic;
    room.maxMembers = maxMembers || room.maxMembers;

    await room.save();
    res.json({ message: "Room updated successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating room", error: error.message });
  }
};

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

    if (room.admins.includes(userId)) {
      return res.status(400).json({ message: "This user is already an admin" });
    }

    if (!room.members.includes(userId)) {
      return res.status(400).json({ message: "User is not a member" });
    }

    room.admins.push(userId);
    await room.save();
    res.json({ message: "Admin added successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding admin", error: error.message });
  }
};

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

    if (room.admins.length === 1) {
      return res.status(400).json({
        message: "There must be at least one admin in the room",
      });
    }

    room.admins = room.admins.filter(
      (admin) => admin.toString() !== userId.toString()
    );

    await room.save();
    res.json({ message: "Admin removed successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing admin", error: error.message });
  }
};

exports.muteUser = async (req, res) => {
  try {
    const { userId, muteUntil } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res.status(403).json({ message: "Only admins can mute users" });
    }

    const isMember = room.members.includes(userId);
    if (!isMember) {
      return res.status(400).json({ message: "User is not a member" });
    }

    const alreadyMuted = room.mutedUsers.some(
      (mute) => mute.user.toString() === userId.toString()
    );
    if (alreadyMuted) {
      return res.status(400).json({ message: "User is already muted" });
    }

    room.mutedUsers.push({ user: userId, muteUntil: new Date(muteUntil) });
    await room.save();
    res.json({ message: "User muted successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error muting user", error: error.message });
  }
};

exports.unmuteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res.status(403).json({ message: "Only admins can unmute users" });
    }

    const muteIndex = room.mutedUsers.findIndex(
      (mute) => mute.user.toString() === userId.toString()
    );
    if (muteIndex === -1) {
      return res.status(400).json({ message: "User is not muted" });
    }

    room.mutedUsers.splice(muteIndex, 1);
    await room.save();
    res.json({ message: "User unmuted successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error unmuting user", error: error.message });
  }
};

exports.toggleAdminOnlyMode = async (req, res) => {
  try {
    const { isAdminOnlyMode } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only admins can toggle admin-only mode" });
    }

    room.isAdminOnlyMode = isAdminOnlyMode;
    await room.save();
    res.json({ message: "Admin-only mode updated successfully", room });
  } catch (error) {
    res.status(500).json({
      message: "Error toggling admin-only mode",
      error: error.message,
    });
  }
};

exports.removeUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isAdmin(room, req.user._id)) {
      return res.status(403).json({ message: "Only admins can remove users" });
    }

    if (!room.members.includes(userId)) {
      return res.status(400).json({ message: "User is not a member" });
    }

    room.members = room.members.filter(
      (member) => member.toString() !== userId.toString()
    );
    room.admins = room.admins.filter(
      (admin) => admin.toString() !== userId.toString()
    );
    room.mutedUsers = room.mutedUsers.filter(
      (mute) => mute.user.toString() !== userId.toString()
    );

    await room.save();
    res.json({ message: "User removed successfully", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing user", error: error.message });
  }
};
