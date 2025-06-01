const socketIO = require('socket.io');
const Message = require('../models/Message');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/cryptoUtils');
const jwt = require('jsonwebtoken');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // socketId -> { userId, username, rooms: Set() }
        this.userSockets = new Map(); // userId -> Set of socketIds
        this.roomMembers = new Map(); // roomId -> Set of userIds
    }

    initialize(server) {
        try {
            this.io = socketIO(server, {
                cors: {
                    origin: process.env.FRONTEND_URL || "*",
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

            logger.info('Socket.IO instance created successfully');

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
                    rooms: new Set()
                });

                // Track user's sockets
                if (!this.userSockets.has(userId)) {
                    this.userSockets.set(userId, new Set());
                }
                this.userSockets.get(userId).add(socket.id);

                // Handle room joining
                socket.on('join_room', async ({ roomId, userId: requestUserId }) => {
                    try {
                        logger.info(`Join room request: ${roomId} from user ${userId} (socket: ${socket.id})`);

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

                        // Join the socket to the room (always do this for reconnections)
                        await socket.join(roomId);
                        
                        // Update our tracking
                        const userConnection = this.connectedUsers.get(socket.id);
                        if (userConnection) {
                            userConnection.rooms.add(roomId);
                        }

                        // Track room members
                        if (!this.roomMembers.has(roomId)) {
                            this.roomMembers.set(roomId, new Set());
                        }
                        this.roomMembers.get(roomId).add(userId);

                        logger.info(`User ${username} (${userId}) successfully joined room ${roomId}`);
                        socket.emit('room_joined', { roomId });

                        // Notify other users in the room (optional)
                        socket.to(roomId).emit('user_joined_room', { 
                            userId, 
                            username, 
                            roomId 
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

                // Handle message sending
                socket.on('send_message', async ({ roomId, message }) => {
                    try {
                        logger.info(`Send message request to room ${roomId} from user ${userId}`);

                        if (!roomId || !message || !message.content || !message.sender) {
                            logger.error('Send message failed: Invalid message format');
                            return socket.emit('message_error', { 
                                error: 'Invalid message format',
                                tempId: message.tempId 
                            });
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

                        // Encrypt the message content
                        const { encryptedData, iv } = encrypt(message.content);
                        
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
                        
                        // Send confirmation to sender
                        socket.emit('message_sent', {
                            success: true,
                            messageId: savedMessage._id,
                            tempId: message.tempId
                        });

                        logger.info(`Message ${savedMessage._id} sent successfully to room ${roomId}`);

                    } catch (error) {
                        logger.error(`Error sending message to room ${roomId}: ${error.message}`);
                        socket.emit('message_error', {
                            error: 'Failed to send message',
                            details: error.message,
                            tempId: message.tempId
                        });
                    }
                });

                // Handle message editing
                socket.on('edit_message', async ({ roomId, messageId, newContent }) => {
                    try {
                        logger.info(`Edit message request: ${messageId} in room ${roomId} from user ${userId}`);

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

                        // Get the room
                        const room = await Room.findById(roomId);
                        if (!room) {
                            return socket.emit('message_error', {
                                error: 'Room not found',
                                messageId
                            });
                        }

                        // Encrypt the new content
                        const { encryptedData, iv } = encrypt(newContent);
                        
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
                        socket.emit('edit_success', { messageId });

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
                socket.on('leave_room', ({ roomId }) => {
                    try {
                        logger.info(`Leave room request: ${roomId} from user ${userId}`);

                        if (!roomId) return;

                        // Leave the socket room
                        socket.leave(roomId);

                        // Update tracking
                        const userConnection = this.connectedUsers.get(socket.id);
                        if (userConnection) {
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

                        logger.info(`User ${username} left room ${roomId}`);

                    } catch (error) {
                        logger.error(`Error leaving room ${roomId}: ${error.message}`);
                    }
                });

                // Handle disconnection
                socket.on('disconnect', (reason) => {
                    logger.info(`User ${username} (${userId}) disconnected: ${reason} - Socket: ${socket.id}`);

                    try {
                        // Get user connection data
                        const userConnection = this.connectedUsers.get(socket.id);
                        
                        if (userConnection) {
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

            logger.info('WebSocket service initialized successfully');

        } catch (error) {
            logger.error(`Failed to initialize WebSocket service: ${error.message}`);
            throw error;
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
            rooms: Array.from(rooms)
        };
    }
}

module.exports = new WebSocketService();