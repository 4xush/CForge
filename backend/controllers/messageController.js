const Message = require("../models/Message");
const Room = require("../models/Room");
const { encrypt, decrypt } = require("../utils/cryptoUtils");

// Send Message with Encryption
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
          message: "You are muted and cannot send messages until " + mutedUser.muteUntil,
        });
      } else {
        // Remove expired mute
        room.mutedUsers = room.mutedUsers.filter(
          (muted) => muted.user.toString() !== senderId.toString()
        );
        await room.save();
      }
    }

    // Encrypt the message content
    const { encryptedData, iv } = encrypt(content);

    const message = new Message({
      room: roomId,
      sender: senderId,
      content: encryptedData, // Store encrypted content
      iv, // Store initialization vector
    });

    await message.save();

    // Return response as before, with decrypted content
    res.status(201).json({
      message: "Message sent successfully",
      message: {
        ...message.toObject(),
        content, // Send decrypted content to the frontend
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

// Fetch Messages with Decryption
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { lastMessageId = null, limit = 50 } = req.query;

    const query = { room: roomId };

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

    // Decrypt messages before sending them to the frontend
    const decryptedMessages = messages.map((msg) => ({
      ...msg.toObject(),
      content: decrypt(msg.content, msg.iv),
    }));

    res.json({
      messages: decryptedMessages,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
};

// Edit Message with Encryption
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === "") {
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

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this message" });
    }

    // Encrypt the new content
    const { encryptedData, iv } = encrypt(content);

    message.content = encryptedData;
    message.iv = iv;
    message.isEdited = true;

    await message.save();

    // Return decrypted content to the frontend
    await message.populate("sender", "username profilePicture");
    res.status(200).json({
      message: "Message edited successfully",
      message: {
        ...message.toObject(),
        content, // Send decrypted content to the frontend
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error editing message", error: error.message });
  }
};

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
