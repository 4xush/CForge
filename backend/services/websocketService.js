const socketIO = require('socket.io');
const Message = require('../models/Message');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/cryptoUtils');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const WebSocketRateLimit = require('../utils/websocketRateLimit');

// Helper function to update lastSeenMessage when user leaves room
async function updateLastSeenOnLeave(userId, roomId) {
  try {
    const Message = require('../models/Message');
    const LastSeen = require('../models/LastSeen');

    // Get the latest message in the room
    const latestMessage = await Message.findOne({ room: roomId })
      .sort({ createdAt: -1 })
      .lean();

    if (latestMessage) {
      // Update user's lastSeenMessage to the latest message
      await LastSeen.findOneAndUpdate(
        { user: userId, room: roomId },
        { lastSeenMessage: latestMessage._id },
        { upsert: true, new: true }
      );

      console.log(`✅ Updated lastSeen for user ${userId} in room ${roomId} to message ${latestMessage._id}`);
    }
  } catch (error) {
    console.error(`❌ Error updating lastSeen on leave for user ${userId} in room ${roomId}:`, error);
  }
}

const MessageValidator = require('../utils/messageValidator');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/websocket-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/websocket-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

class EnhancedWebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // socketId -> { userId, username, rooms: Set() }
        this.userSockets = new Map(); // userId -> Set of socketIds
        this.roomMembers = new Map(); // roomId -> Set of userIds

        // Initialize rate limiter and message validator
        this.rateLimiter = new WebSocketRateLimit();
        this.messageValidator = new MessageValidator();

        // Memory cleanup interval - run every 10 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupStaleConnections();
        }, 600000);
    }

    initialize(server) {
        try {
            this.io = socketIO(server, {
                cors: {
                    origin: process.env.FRONTEND_URL,
                    methods: ["GET", "POST"],
                    credentials: true,
                    allowedHeaders: ["Authorization"]
                },
                transports: ['websocket', 'polling'],
                pingTimeout: 60000,
                pingInterval: 25000,
                connectTimeout: 60000,
                allowEIO3: true
            });

            logger.info('Enhanced Socket.IO instance created successfully');

            // Authentication middleware
            this.io.use((socket, next) => {
                const token = socket.handshake.auth?.token;
                if (!token) {
                    logger.error('Socket authentication failed: No token provided');
                    return next(new Error('Authentication token required'));
                }

                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const userId = decoded.userId || decoded._id || decoded.id;
                    if (!userId) {
                        logger.error('Invalid token: No user ID found');
                        return next(new Error('Invalid token: No user ID'));
                    }

                    socket.user = {
                        _id: userId.toString(),
                        username: decoded.username,
                        email: decoded.email
                    };

                    logger.info(`Socket authenticated for user: ${socket.user.username} (${socket.user._id})`);
                    next();
                } catch (error) {
                    logger.error(`Socket authentication failed: ${error.message}`);
                    next(new Error('Invalid authentication token'));
                }
            });

            this.io.on('connection', (socket) => {
                const userId = socket.user._id;
                const username = socket.user.username;

                logger.info(`User connected: ${username} (${userId}) - Socket: ${socket.id}`);

                // Track this socket connection
                this.connectedUsers.set(socket.id, {
                    userId,
                    username,
                    rooms: new Set(),
                    connectedAt: Date.now()
                });

                // Track user's sockets
                if (!this.userSockets.has(userId)) {
                    this.userSockets.set(userId, new Set());
                }
                this.userSockets.get(userId).add(socket.id);

                // Handle room joining with rate limiting
                socket.on('join_room', async ({ roomId, userId: requestUserId }) => {
                    try {
                        logger.info(`Join room request: ${roomId} from user ${userId} (socket: ${socket.id})`);

                        // Rate limiting check
                        const rateLimitCheck = this.rateLimiter.checkRateLimit(userId, 'roomJoins');
                        if (!rateLimitCheck.allowed) {
                            logger.warn(`Rate limit exceeded for join_room: ${userId}`);
                            return socket.emit('room_error', {
                                error: rateLimitCheck.reason,
                                retryAfter: rateLimitCheck.retryAfter,
                                roomId,
                                type: 'rate_limit'
                            });
                        }

                        if (!roomId || !requestUserId) {
                            logger.error('Join room failed: Missing roomId or userId');
                            return socket.emit('room_error', {
                                error: 'Room ID and User ID are required',
                                roomId
                            });
                        }

                        if (socket.user._id !== requestUserId.toString()) {
                            logger.error(`Join room failed: User ID mismatch. Socket user: ${socket.user._id}, Request user: ${requestUserId}`);
                            return socket.emit('room_error', {
                                error: 'User ID mismatch',
                                roomId
                            });
                        }

                        // Validate room exists and user is a member
                        const room = await Room.findById(roomId);
                        if (!room) {
                            logger.error(`Join room failed: Room ${roomId} not found`);
                            return socket.emit('room_error', {
                                error: 'Room not found',
                                roomId
                            });
                        }

                        // Check if user is a member of the room
                        const isMember = room.members.some(member =>
                            member.toString() === userId.toString()
                        );

                        if (!isMember) {
                            logger.error(`Join room failed: User ${userId} is not a member of room ${roomId}`);
                            return socket.emit('room_error', {
                                error: 'Not authorized to join this room',
                                roomId
                            });
                        }

                        // Join the socket to the room
                        await socket.join(roomId);

                        // Update our tracking
                        const userConnection = this.connectedUsers.get(socket.id);
                        if (userConnection) {

                            // Update lastSeenMessage for all rooms user was in before disconnect
                            for (const roomId of userConnection.rooms) {
                                await updateLastSeenOnLeave(userId, roomId);
                            }

                            userConnection.rooms.add(roomId);
                        }

                        // Track room members
                        if (!this.roomMembers.has(roomId)) {
                            this.roomMembers.set(roomId, new Set());
                        }
                        this.roomMembers.get(roomId).add(userId);

                        logger.info(`User ${username} (${userId}) successfully joined room ${roomId}`);
                        socket.emit('room_joined', { roomId });

                        // Notify other users in the room
                        socket.to(roomId).emit('user_joined_room', {
                            userId,
                            username,
                            roomId
                        });

                        this.io.to(roomId).emit('room_notification', {
                            message: `${username} has joined the room`,
                            type: 'user_joined',
                            roomId: roomId,
                            user: { userId, username },
                            timestamp: new Date()
                        });

                    } catch (error) {
                        logger.error(`Error joining room ${roomId}: ${error.message}`);
                        socket.emit('room_error', {
                            error: 'Failed to join room',
                            details: error.message,
                            roomId
                        });
                    }
                });

                // Handle message sending with rate limiting and validation
                socket.on('send_message', async ({ roomId, message }) => {
                    try {
                        logger.info(`Send message request to room ${roomId} from user ${userId}`);

                        // Rate limiting check
                        const rateLimitCheck = this.rateLimiter.checkRateLimit(userId, 'messages');
                        if (!rateLimitCheck.allowed) {
                            logger.warn(`Rate limit exceeded for send_message: ${userId}`);
                            return socket.emit('message_error', {
                                error: rateLimitCheck.reason,
                                retryAfter: rateLimitCheck.retryAfter,
                                tempId: message?.tempId,
                                type: 'rate_limit'
                            });
                        }

                        if (!roomId || !message || !message.content || !message.sender) {
                            logger.error('Send message failed: Invalid message format');
                            return socket.emit('message_error', {
                                error: 'Invalid message format',
                                tempId: message?.tempId
                            });
                        }

                        // Message validation
                        const validation = this.messageValidator.validateMessage(message);
                        if (!validation.valid) {
                            logger.warn(`Message validation failed for user ${userId}:`, validation.errors);
                            return socket.emit('message_error', {
                                error: 'Message validation failed',
                                details: validation.errors,
                                tempId: message.tempId,
                                type: 'validation'
                            });
                        }

                        // Log warnings if any
                        if (validation.warnings.length > 0) {
                            logger.warn(`Message validation warnings for user ${userId}:`, validation.warnings);
                        }

                        // Verify user is in the room
                        const userConnection = this.connectedUsers.get(socket.id);
                        if (!userConnection || !userConnection.rooms.has(roomId)) {
                            logger.error(`Send message failed: User ${userId} not in room ${roomId}`);
                            return socket.emit('message_error', {
                                error: 'You must join the room before sending messages',
                                tempId: message.tempId
                            });
                        }

                        // Get the room for encryption
                        const room = await Room.findById(roomId);
                        if (!room) {
                            logger.error(`Send message failed: Room ${roomId} not found`);
                            return socket.emit('message_error', {
                                error: 'Room not found',
                                tempId: message.tempId
                            });
                        }

                        // Sanitize and encrypt the message content
                        const sanitizedContent = this.messageValidator.sanitizeContent(message.content);
                        const { encryptedData, iv } = encrypt(sanitizedContent);

                        // Create and save the message
                        const newMessage = new Message({
                            content: encryptedData,
                            iv: iv,
                            sender: message.sender,
                            room: roomId,
                            tempId: message.tempId
                        });

                        const savedMessage = await newMessage.save();

                        // Populate sender information
                        const populatedMessage = await Message.findById(savedMessage._id)
                            .populate('sender', 'username profilePicture')
                            .lean();

                        if (!populatedMessage) {
                            throw new Error('Message saved but could not be retrieved');
                        }

                        // Decrypt for broadcasting
                        const decryptedMessage = {
                            ...populatedMessage,
                            content: decrypt(populatedMessage.content, populatedMessage.iv)
                        };

                        logger.info(`Broadcasting message ${savedMessage._id} to room ${roomId}`);

                        // Broadcast to all users in the room
                        this.io.to(roomId).emit('receive_message', decryptedMessage);

                        this.io.to(roomId).emit('room_notification', {
                            message: `${decryptedMessage.sender.username} sent a message`,
                            type: 'new_message',
                            roomId: roomId,
                            sender: decryptedMessage.sender,
                            timestamp: new Date()
                        });

                        // Send confirmation to sender
                        socket.emit('message_sent', {
                            success: true,
                            messageId: savedMessage._id,
                            tempId: message.tempId,
                            warnings: validation.warnings
                        });

                        logger.info(`Message ${savedMessage._id} sent successfully to room ${roomId}`);

                    } catch (error) {
                        logger.error(`Error sending message to room ${roomId}: ${error.message}`);
                        socket.emit('message_error', {
                            error: 'Failed to send message',
                            details: error.message,
                            tempId: message?.tempId
                        });
                    }
                });

                // Handle message editing with rate limiting and validation
                socket.on('edit_message', async ({ roomId, messageId, newContent }) => {
                    try {
                        logger.info(`Edit message request: ${messageId} in room ${roomId} from user ${userId}`);

                        // Rate limiting check
                        const rateLimitCheck = this.rateLimiter.checkRateLimit(userId, 'messageEdits');
                        if (!rateLimitCheck.allowed) {
                            logger.warn(`Rate limit exceeded for edit_message: ${userId}`);
                            return socket.emit('message_error', {
                                error: rateLimitCheck.reason,
                                retryAfter: rateLimitCheck.retryAfter,
                                messageId,
                                type: 'rate_limit'
                            });
                        }

                        if (!roomId || !messageId || !newContent || newContent.trim() === '') {
                            return socket.emit('message_error', {
                                error: 'Missing or invalid fields',
                                messageId
                            });
                        }

                        if (!mongoose.Types.ObjectId.isValid(messageId)) {
                            return socket.emit('message_error', {
                                error: 'Invalid message ID format',
                                messageId
                            });
                        }

                        // Find the message
                        const message = await Message.findById(messageId);
                        if (!message) {
                            return socket.emit('message_error', {
                                error: 'Message not found',
                                messageId
                            });
                        }

                        // Check authorization
                        if (message.sender.toString() !== userId.toString()) {
                            return socket.emit('message_error', {
                                error: 'Not authorized to edit this message',
                                messageId
                            });
                        }

                        // Validate edit
                        const validation = this.messageValidator.validateEdit(message, newContent);
                        if (!validation.valid) {
                            logger.warn(`Message edit validation failed for user ${userId}:`, validation.errors);
                            return socket.emit('message_error', {
                                error: 'Edit validation failed',
                                details: validation.errors,
                                messageId,
                                type: 'validation'
                            });
                        }

                        // Get the room
                        const room = await Room.findById(roomId);
                        if (!room) {
                            return socket.emit('message_error', {
                                error: 'Room not found',
                                messageId
                            });
                        }

                        // Sanitize and encrypt the new content
                        const sanitizedContent = this.messageValidator.sanitizeContent(newContent);
                        const { encryptedData, iv } = encrypt(sanitizedContent);

                        // Update the message
                        message.content = encryptedData;
                        message.iv = iv;
                        message.isEdited = true;
                        message.editedAt = new Date();
                        await message.save();

                        // Populate and decrypt for broadcasting
                        await message.populate('sender', 'username profilePicture');
                        const decryptedMessage = {
                            ...message.toObject(),
                            content: decrypt(message.content, message.iv)
                        };

                        // Broadcast the update
                        this.io.to(roomId).emit('message_updated', decryptedMessage);

                        // Send confirmation
                        socket.emit('edit_success', {
                            messageId,
                            warnings: validation.warnings
                        });

                        logger.info(`Message ${messageId} edited successfully in room ${roomId}`);

                    } catch (error) {
                        logger.error(`Error editing message ${messageId}: ${error.message}`);
                        socket.emit('message_error', {
                            error: 'Failed to edit message',
                            details: error.message,
                            messageId
                        });
                    }
                });

                // Handle leaving room
                socket.on('leave_room', async ({ roomId }) => {
                    try {
                        logger.info(`Leave room request: ${roomId} from user ${userId}`);

                        if (!roomId) return;

                        // Update lastSeenMessage before leaving
                        await updateLastSeenOnLeave(userId, roomId);

                        // Leave the socket room
                        socket.leave(roomId);

                        // Update tracking
                        const userConnection = this.connectedUsers.get(socket.id);
                        if (userConnection) {

                            // Update lastSeenMessage for all rooms user was in before disconnect
                            for (const roomId of userConnection.rooms) {
                                await updateLastSeenOnLeave(userId, roomId);
                            }

                            userConnection.rooms.delete(roomId);
                        }

                        // Update room members if this was the last socket for this user in this room
                        const userSockets = this.userSockets.get(userId) || new Set();
                        const userStillInRoom = Array.from(userSockets).some(socketId => {
                            const conn = this.connectedUsers.get(socketId);
                            return conn && conn.rooms.has(roomId);
                        });

                        if (!userStillInRoom && this.roomMembers.has(roomId)) {
                            this.roomMembers.get(roomId).delete(userId);
                            if (this.roomMembers.get(roomId).size === 0) {
                                this.roomMembers.delete(roomId);
                            }
                        }

                        socket.emit('room_left', { roomId });
                        socket.to(roomId).emit('user_left_room', { userId, username, roomId });

                        this.io.to(roomId).emit('room_notification', {
                            message: `${username} has left the room`,
                            type: 'user_left',
                            roomId: roomId,
                            user: { userId, username },
                            timestamp: new Date()
                        });

                        logger.info(`User ${username} left room ${roomId}`);

                    } catch (error) {
                        logger.error(`Error leaving room ${roomId}: ${error.message}`);
                    }
                });

                // Handle rate limit status request
                socket.on('get_rate_limit_status', ({ action }) => {
                    try {
                        const status = this.rateLimiter.getRateLimitStatus(userId, action);
                        socket.emit('rate_limit_status', { action, status });
                    } catch (error) {
                        logger.error(`Error getting rate limit status: ${error.message}`);
                    }
                });

                // Handle disconnection
                socket.on('disconnect', async (reason) => {
                    logger.info(`User ${username} (${userId}) disconnected: ${reason} - Socket: ${socket.id}`);

                    try {
                        // Get user connection data
                        const userConnection = this.connectedUsers.get(socket.id);

                        if (userConnection) {

                            // Update lastSeenMessage for all rooms user was in before disconnect
                            for (const roomId of userConnection.rooms) {
                                await updateLastSeenOnLeave(userId, roomId);
                            }

                            // Leave all rooms this socket was in
                            userConnection.rooms.forEach(roomId => {
                                socket.leave(roomId);
                                socket.to(roomId).emit('user_left_room', {
                                    userId,
                                    username,
                                    roomId
                                });
                            });
                        }

                        // Clean up socket tracking
                        this.connectedUsers.delete(socket.id);

                        // Clean up user socket tracking
                        if (this.userSockets.has(userId)) {
                            this.userSockets.get(userId).delete(socket.id);
                            if (this.userSockets.get(userId).size === 0) {
                                this.userSockets.delete(userId);
                            }
                        }

                        // Clean up room members for rooms where this user has no more sockets
                        if (userConnection) {

                            // Update lastSeenMessage for all rooms user was in before disconnect
                            for (const roomId of userConnection.rooms) {
                                await updateLastSeenOnLeave(userId, roomId);
                            }

                            userConnection.rooms.forEach(roomId => {
                                const userSockets = this.userSockets.get(userId) || new Set();
                                const userStillInRoom = Array.from(userSockets).some(socketId => {
                                    const conn = this.connectedUsers.get(socketId);
                                    return conn && conn.rooms.has(roomId);
                                });

                                if (!userStillInRoom && this.roomMembers.has(roomId)) {
                                    this.roomMembers.get(roomId).delete(userId);
                                    if (this.roomMembers.get(roomId).size === 0) {
                                        this.roomMembers.delete(roomId);
                                    }
                                }
                            });
                        }

                    } catch (error) {
                        logger.error(`Error during disconnect cleanup: ${error.message}`);
                    }
                });

                // Handle errors
                socket.on('error', (error) => {
                    logger.error(`Socket ${socket.id} error: ${error.message}`);
                });
            });

            // Handle engine errors
            this.io.engine.on('connection_error', (err) => {
                logger.error(`Engine connection error: ${err.req?.url} - ${err.message}`);
            });

            logger.info('Enhanced WebSocket service initialized successfully');

        } catch (error) {
            logger.error(`Failed to initialize Enhanced WebSocket service: ${error.message}`);
            throw error;
        }
    }

    /**
     * Clean up stale connections and memory
     */
    cleanupStaleConnections() {
        const now = Date.now();
        const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
        let cleanedConnections = 0;
        let cleanedRooms = 0;

        // Clean up stale user connections
        for (const [socketId, connection] of this.connectedUsers.entries()) {
            if (now - connection.connectedAt > staleThreshold) {
                this.connectedUsers.delete(socketId);
                cleanedConnections++;
            }
        }

        // Clean up empty room members
        for (const [roomId, members] of this.roomMembers.entries()) {
            if (members.size === 0) {
                this.roomMembers.delete(roomId);
                cleanedRooms++;
            }
        }

        if (cleanedConnections > 0 || cleanedRooms > 0) {
            logger.info(`Memory cleanup: removed ${cleanedConnections} stale connections and ${cleanedRooms} empty rooms`);
        }
    }

    getIO() {
        return this.io;
    }

    // Helper method to get room statistics
    getRoomStats(roomId) {
        const members = this.roomMembers.get(roomId) || new Set();
        return {
            memberCount: members.size,
            members: Array.from(members)
        };
    }

    // Helper method to get user statistics
    getUserStats(userId) {
        const userSockets = this.userSockets.get(userId) || new Set();
        const rooms = new Set();

        userSockets.forEach(socketId => {
            const connection = this.connectedUsers.get(socketId);
            if (connection) {
                connection.rooms.forEach(room => rooms.add(room));
            }
        });

        return {
            socketCount: userSockets.size,
            rooms: Array.from(rooms),
            rateLimitStatus: {
                messages: this.rateLimiter.getRateLimitStatus(userId, 'messages'),
                roomJoins: this.rateLimiter.getRateLimitStatus(userId, 'roomJoins'),
                messageEdits: this.rateLimiter.getRateLimitStatus(userId, 'messageEdits')
            }
        };
    }

    // Get service statistics
    getServiceStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            totalRooms: this.roomMembers.size,
            rateLimiter: this.rateLimiter.getStats(),
            messageValidator: this.messageValidator.getValidationInfo()
        };
    }

    // Admin function to reset rate limits
    resetUserRateLimit(userId, action = null) {
        return this.rateLimiter.resetUserLimits(userId, action);
    }

    // Cleanup and destroy
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        if (this.rateLimiter) {
            this.rateLimiter.destroy();
        }

        this.connectedUsers.clear();
        this.userSockets.clear();
        this.roomMembers.clear();

        logger.info('Enhanced WebSocket service destroyed');
    }
}

module.exports = new EnhancedWebSocketService();