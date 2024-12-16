const Message = require("../models/Message");
const Room = require("../models/Room");

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

// Fetch messages for a room
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const {
      lastMessageId = null, // Last message ID from client
      limit = 50,           // Messages per batch
    } = req.query;

    const query = { room: roomId };

    // If lastMessageId is provided, fetch messages older than that
    if (lastMessageId) {
      const lastMessage = await Message.findById(lastMessageId).select("createdAt");
      if (lastMessage) {
        query.createdAt = { $lt: lastMessage.createdAt };
      }
    }

    const messages = await Message.find(query)
      .populate("sender", "username profilePicture")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      messages,
      hasMore: messages.length === limit,
    });
    console.log("messages fetched for room ", roomId);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const room = await Room.findById(message.room);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isAdmin = room.admins.some((admin) => admin.toString() === userId.toString());
    if (message.sender.toString() !== userId.toString() && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this message" });
    }

    await message.deleteOne();
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting message", error: error.message });
  }
};
// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const room = await Room.findById(message.room);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is authorized to edit the message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this message" });
    }

    // Update message content
    message.content = content;
    message.isEdited = true;

    await message.save();

    // Populate sender details for response
    await message.populate("sender", "username profilePicture");

    res.status(200).json({
      message: "Message edited successfully",
      message: message
    });
  } catch (error) {
    res.status(500).json({
      message: "Error editing message",
      error: error.message
    });
  }
};