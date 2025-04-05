const socketIO = require('socket.io');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const { encrypt, decrypt } = require("../utils/cryptoUtils");
const jwt = require('jsonwebtoken');

class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
        // Track connections to prevent duplicate joins
        this.userRooms = new Map(); // userId -> Set of roomIds
    }

    initialize(server) {
        console.log('Setting up Socket.IO server...');
        
        try {
            this.io = socketIO(server, {
                cors: {
                    origin: "*", // Allow all origins in development
                    methods: ["GET", "POST"],
                    credentials: true,
                    allowedHeaders: ["Authorization"]
                },
                transports: ['websocket', 'polling'],
                pingTimeout: 30000,
                pingInterval: 25000,
                connectTimeout: 30000
            });

            console.log('Socket.IO instance created successfully');

            // Middleware for authentication (optional in development)
            this.io.use((socket, next) => {
                const token = socket.handshake.auth?.token;
                
                if (!token) {
                    console.warn(`Socket ${socket.id} has no authentication token`);
                    // In development, allow connections without token
                    if (process.env.NODE_ENV !== 'production') {
                        return next();
                    }
                    return next(new Error('Authentication error'));
                }
                
                try {
                    // Verify token (if JWT_SECRET is set)
                    if (process.env.JWT_SECRET) {
                        const decoded = jwt.verify(token, process.env.JWT_SECRET);
                        socket.user = decoded;
                        console.log(`Socket ${socket.id} authenticated as user ${decoded.id || decoded._id}`);
                    }
                    next();
                } catch (error) {
                    console.error(`Socket ${socket.id} authentication error:`, error.message);
                    // In development, allow connections even with invalid tokens
                    if (process.env.NODE_ENV !== 'production') {
                        return next();
                    }
                    next(new Error('Authentication error'));
                }
            });

            this.io.on('connection', (socket) => {
                console.log(`New client connected: ${socket.id}`);
                
                // Debug connection info
                console.log('Connection details:', {
                    id: socket.id,
                    transport: socket.conn.transport.name,
                    remoteAddress: socket.handshake.address,
                    authenticated: !!socket.user
                });

                // Handle user joining a room
                socket.on('join_room', ({ roomId, userId }) => {
                    if (!roomId || !userId) {
                        console.error('Invalid join_room event data:', { roomId, userId });
                        return;
                    }
                    
                    // Check if user is already in the room
                    if (!this.userRooms.has(userId)) {
                        this.userRooms.set(userId, new Set());
                    }
                    
                    const userRoomSet = this.userRooms.get(userId);
                    if (userRoomSet.has(roomId)) {
                        console.log(`User ${userId} is already in room ${roomId}`);
                        // Still send confirmation back
                        socket.emit('room_joined', { roomId });
                        return;
                    }
                    
                    // Join the room
                    socket.join(roomId);
                    this.connectedUsers.set(socket.id, { userId, roomId });
                    userRoomSet.add(roomId);
                    console.log(`User ${userId} joined room ${roomId}`);
                    
                    // Notify client that join was successful
                    socket.emit('room_joined', { roomId });
                });

                // Handle new message
                socket.on('send_message', async ({ roomId, message }) => {
                    console.log(`Received message for room ${roomId}:`, message);
                    
                    if (!roomId || !message || !message.content || !message.sender) {
                        console.error('Invalid message format:', message);
                        socket.emit('message_error', { error: 'Invalid message format' });
                        return;
                    }
                    
                    try {
                        // Encrypt the message content
                        const { encryptedData, iv } = encrypt(message.content);
                        
                        // Save message to database
                        const newMessage = new Message({
                            content: encryptedData,
                            iv: iv,
                            sender: message.sender, 
                            room: roomId
                        });
                        
                        const savedMessage = await newMessage.save();
                        console.log('Message saved to database:', savedMessage._id);
                        
                        // Populate sender information for broadcasting
                        const populatedMessage = await Message.findById(savedMessage._id)
                            .populate('sender', 'username profilePicture')
                            .lean();
                        
                        if (!populatedMessage) {
                            throw new Error('Message saved but could not be retrieved');
                        }
                        
                        // Decrypt the message for sending to clients
                        const decryptedMessage = {
                            ...populatedMessage,
                            content: decrypt(populatedMessage.content, populatedMessage.iv)
                        };
                        
                        // Emit the saved message with database ID to all clients in the room
                        this.io.to(roomId).emit('receive_message', decryptedMessage);
                        console.log(`Message broadcasted to room ${roomId}`);
                        
                        // Send confirmation to the sender
                        socket.emit('message_sent', { 
                            success: true, 
                            messageId: savedMessage._id 
                        });
                    } catch (error) {
                        console.error('Error saving message:', error);
                        // Notify sender of error
                        socket.emit('message_error', { 
                            error: 'Failed to save message', 
                            details: error.message 
                        });
                    }
                });

                // Handle user leaving a room
                socket.on('leave_room', ({ roomId }) => {
                    if (!roomId) {
                        console.error('Invalid leave_room event: no roomId provided');
                        return;
                    }
                    
                    const userData = this.connectedUsers.get(socket.id);
                    if (!userData) {
                        console.warn(`Socket ${socket.id} tried to leave room ${roomId} but is not tracked in connectedUsers`);
                        return;
                    }
                    
                    socket.leave(roomId);
                    
                    // Remove from tracking
                    this.connectedUsers.delete(socket.id);
                    
                    if (this.userRooms.has(userData.userId)) {
                        const userRoomSet = this.userRooms.get(userData.userId);
                        userRoomSet.delete(roomId);
                        if (userRoomSet.size === 0) {
                            this.userRooms.delete(userData.userId);
                        }
                    }
                    
                    console.log(`User ${userData.userId} left room ${roomId}`);
                    
                    // Notify client that leave was successful
                    socket.emit('room_left', { roomId });
                });

                // Handle disconnection more gracefully
                socket.on('disconnect', (reason) => {
                    const userData = this.connectedUsers.get(socket.id);
                    if (userData) {
                        // Don't immediately remove user from rooms on disconnect
                        // This allows for reconnection without losing room state
                        console.log(`User ${userData.userId} disconnected from socket. Reason: ${reason}`);
                        
                        // After a timeout, if they haven't reconnected, clean up completely
                        setTimeout(() => {
                            if (!this.io.sockets.sockets.has(socket.id)) {
                                this.connectedUsers.delete(socket.id);
                                console.log(`Cleaned up user ${userData.userId} after disconnect timeout`);
                            }
                        }, 30000); // 30 second grace period
                    } else {
                        console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`);
                    }
                });
                
                // Handle errors
                socket.on('error', (error) => {
                    console.error(`Socket ${socket.id} error:`, error);
                });
            });
            
            // Handle server-level errors
            this.io.engine.on('connection_error', (err) => {
                console.error('Connection error:', err);
            });
            
            console.log('Socket.IO event handlers registered');
        } catch (error) {
            console.error('Failed to initialize WebSocket service:', error);
        }
    }

    getIO() {
        return this.io;
    }
}

module.exports = new WebSocketService(); 