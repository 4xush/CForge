const Room = require("../models/Room");
const User = require("../models/User");

// Helper function to check if a user is an admin of a room
const isAdmin = (room, userId) => {
  return room.admins.some((admin) => admin.toString() === userId.toString());
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
