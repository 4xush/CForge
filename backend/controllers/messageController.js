const mongoose = require('mongoose');
const Message = require("../models/Message");
const Room = require("../models/Room");
const LastSeen = require("../models/LastSeen");
const { encrypt, decrypt } = require("../utils/cryptoUtils");

// Constants for validation
const MAX_MESSAGE_LENGTH = 5000; // 5000 characters max for a message

/**
 * Sanitizes user input to prevent XSS attacks
 * Simple implementation - for production, consider using a dedicated XSS library like 'xss'
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  // Special handling for quote-escaped attack patterns
  if (input.includes('" onerror="') || input.includes('" onclick="') || input.includes('" onload="')) {
    return input.replace(/([^"]*)"(\s*on\w+\s*=.*?)($|")/gi, '$1"');
  }

  // Remove potentially dangerous content
  let sanitized = input;

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Handle dangerous protocols in URLs
  const protocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  protocols.forEach(protocol => {
    sanitized = sanitized.replace(new RegExp(protocol, 'gi'), '');
  });

  // Handle event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Clean href attributes with JavaScript
  sanitized = sanitized.replace(/<a\s+[^>]*href\s*=\s*["']?javascript:[^>]*>/gi, '<a>');

  // Handle HTML entity encoding that could be used to bypass filters
  // This is a simplified approach - consider using a library with entity decoding for production
  sanitized = sanitized.replace(/&#x?\d+;/gi, '');

  return sanitized;
};

// Send Message with Encryption
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;

    // Input validation
    if (!content) {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Message too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters`
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Sanitize and encrypt the message content
    const sanitizedContent = sanitizeInput(content);
    const { encryptedData, iv } = encrypt(sanitizedContent);

    const message = new Message({
      room: roomId,
      sender: senderId,
      content: encryptedData, // Store encrypted content
      iv, // Store initialization vector
    });

    await message.save();

    await LastSeen.findOneAndUpdate(
      // { user: senderId, room: roomId },
      { user: senderId, room: room._id },
      { lastSeenMessage: message._id },
      { upsert: true, new: true }
    );

    // Fix: Remove duplicate 'message' property
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        ...message.toObject(),
        content: sanitizedContent, // Send sanitized content to the frontend
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
    const userId = req.user._id;

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

        // Decrypt the message and sanitize it
        const decryptedContent = decrypt(msg.content, msg.iv);
        return {
          ...msg,
          content: sanitizeInput(decryptedContent), // Sanitize again when serving content
        };
      } catch (decryptError) {
        console.error(`Error decrypting message ${msg._id}:`, decryptError);
        return {
          ...msg,
          content: '[Unable to decrypt message]', // Fallback for corrupted messages
        };
      }
    });

    const lastSeen = await LastSeen.findOne({ user: userId, room: roomId });

    // Add total count for initial load (optional)
    let totalCount;
    if (!lastMessageId) {
      totalCount = await Message.countDocuments({ room: roomId });
    }

    res.json({
      messages: decryptedMessages,
      hasMore,
      lastSeenMessageId: lastSeen ? lastSeen.lastSeenMessage : null,
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

    // Input validation
    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Message too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters`
      });
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

    // Sanitize and encrypt the new content
    const sanitizedContent = sanitizeInput(content);
    const { encryptedData, iv } = encrypt(sanitizedContent);

    message.content = encryptedData;
    message.iv = iv;
    message.isEdited = true;

    await message.save();

    // Return sanitized content to the frontend
    await message.populate("sender", "username profilePicture");
    res.status(200).json({
      success: true,
      message: "Message edited successfully",
      data: {
        ...message.toObject(),
        content: sanitizedContent, // Send sanitized content to the frontend
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