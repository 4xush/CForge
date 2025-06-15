const mongoose = require('mongoose');
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
    // Encrypt the message content
    const { encryptedData, iv } = encrypt(content);

    const message = new Message({
      room: roomId,
      sender: senderId,
      content: encryptedData, // Store encrypted content
      iv, // Store initialization vector
    });

    await message.save();

    // Fix: Remove duplicate 'message' property
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        ...message.toObject(),
        content, // Send decrypted content to the frontend
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { lastMessageId = null, limit = 50 } = req.query;

    // Validate roomId
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    // Validate and sanitize limit
    const sanitizedLimit = Math.min(Math.max(Number(limit), 1), 100);

    // Build query
    const query = { room: roomId };
    if (lastMessageId) {
      if (!mongoose.Types.ObjectId.isValid(lastMessageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      const lastMessage = await Message.findById(lastMessageId).select("createdAt");
      if (!lastMessage) {
        return res.status(404).json({ message: "Last message not found" });
      }
      query.createdAt = { $lt: lastMessage.createdAt };
    }

    // Changed sort order to descending (newest first)
    const messages = await Message.find(query)
      .populate("sender", "username profilePicture")
      .sort({ createdAt: -1 })  // Changed to descending order (new to old)
      .limit(sanitizedLimit + 1)
      .lean();

    // Check if there are more messages
    const hasMore = messages.length > sanitizedLimit;
    const messagesToSend = hasMore ? messages.slice(0, sanitizedLimit) : messages;

    // Decrypt messages with proper error handling
    const decryptedMessages = messagesToSend.map((msg) => {
      try {
        // Check if content and iv exist before decrypting
        if (!msg.content || !msg.iv) {
          console.warn(`Message ${msg._id} missing content or iv:`, {
            hasContent: !!msg.content,
            hasIv: !!msg.iv
          });
          return {
            ...msg,
            content: msg.content || '[Message content unavailable]', // Fallback for old messages
          };
        }

        // Decrypt the message
        const decryptedContent = decrypt(msg.content, msg.iv);
        return {
          ...msg,
          content: decryptedContent,
        };
      } catch (decryptError) {
        console.error(`Error decrypting message ${msg._id}:`, decryptError);
        return {
          ...msg,
          content: '[Unable to decrypt message]', // Fallback for corrupted messages
        };
      }
    });

    // Add total count for initial load (optional)
    let totalCount;
    if (!lastMessageId) {
      totalCount = await Message.countDocuments({ room: roomId });
    }

    res.json({
      messages: decryptedMessages,
      hasMore,
      ...(totalCount !== undefined && { totalCount }),
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({
      message: "Error fetching messages",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      success: true,
      message: "Message edited successfully",
      data: {
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