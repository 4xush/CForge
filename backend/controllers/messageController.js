const Message = require("../models/Message");
const Room = require("../models/Room");

// Send a message in a room
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is muted
    const mutedUser = room.mutedUsers.find(
      (muted) => muted.user.toString() === senderId.toString()
    );

    if (mutedUser) {
      const currentTime = new Date();
      if (mutedUser.muteUntil && mutedUser.muteUntil > currentTime) {
        return res.status(403).json({
          message:
            "You are muted and cannot send messages until " +
            mutedUser.muteUntil,
        });
      } else {
        // If the mute period has expired, remove the user from the muted list
        room.mutedUsers = room.mutedUsers.filter(
          (muted) => muted.user.toString() !== senderId.toString()
        );
        await room.save();
      }
    }

    const message = new Message({
      room: roomId,
      sender: senderId,
      content,
    });

    await message.save();
    res.status(201).json({ message: "Message sent successfully", message });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
};

// Get all messages in a room
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const messages = await Message.find({ room: roomId })
      .populate("sender", "username profilePicture")
      .sort({ createdAt: 1 }); // Assuming messages have a createdAt field

    res.json({ messages });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching messages", error: error.message });
  }
};
