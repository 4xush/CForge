const socketIO = require('socket.io');
const Message = require('../models/Message');
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
        this.connectedUsers = new Map();
        this.userRooms = new Map();
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
                pingTimeout: 30000,
                pingInterval: 25000,
                connectTimeout: 30000
            });

            logger.info('Socket.IO instance created successfully');

            this.io.use((socket, next) => {
                const token = socket.handshake.auth?.token;
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    socket.user = decoded;
                    next();
                } catch (error) {
                    next(new Error('Invalid authentication token'));
                }
            });

            this.io.on('connection', (socket) => {
                socket.on('join_room', ({ roomId, userId }) => {
                    if (!roomId || !userId) {
                        logger.error('Invalid join_room event data', { roomId, userId });
                        return;
                    }

                    if (!this.userRooms.has(userId)) {
                        this.userRooms.set(userId, new Set());
                    }

                    const userRoomSet = this.userRooms.get(userId);
                    if (userRoomSet.has(roomId)) {
                        socket.emit('room_joined', { roomId });
                        return;
                    }

                    socket.join(roomId);
                    this.connectedUsers.set(socket.id, { userId, roomId });
                    userRoomSet.add(roomId);
                    socket.emit('room_joined', { roomId });
                });

                socket.on('send_message', async ({ roomId, message }) => {
                    if (!roomId || !message || !message.content || !message.sender) {
                        logger.error('Invalid message format', { message });
                        socket.emit('message_error', { error: 'Invalid message format' });
                        return;
                    }

                    try {
                        const { encryptedData, iv } = encrypt(message.content);
                        const newMessage = new Message({
                            content: encryptedData,
                            iv: iv,
                            sender: message.sender,
                            room: roomId
                        });

                        const savedMessage = await newMessage.save();
                        const populatedMessage = await Message.findById(savedMessage._id)
                            .populate('sender', 'username profilePicture')
                            .lean();

                        if (!populatedMessage) {
                            throw new Error('Message saved but could not be retrieved');
                        }

                        const decryptedMessage = {
                            ...populatedMessage,
                            content: decrypt(populatedMessage.content, populatedMessage.iv)
                        };

                        this.io.to(roomId).emit('receive_message', decryptedMessage);
                        socket.emit('message_sent', {
                            success: true,
                            messageId: savedMessage._id
                        });
                    } catch (error) {
                        logger.error('Error saving message', { error: error.message });
                        socket.emit('message_error', {
                            error: 'Failed to save message',
                            details: error.message
                        });
                    }
                });

                socket.on('leave_room', ({ roomId }) => {
                    if (!roomId) {
                        logger.error('Invalid leave_room event: no roomId provided');
                        return;
                    }

                    const userData = this.connectedUsers.get(socket.id);
                    if (!userData) {
                        logger.warn(`Socket ${socket.id} tried to leave room ${roomId} but is not tracked`);
                        return;
                    }

                    socket.leave(roomId);
                    this.connectedUsers.delete(socket.id);

                    if (this.userRooms.has(userData.userId)) {
                        const userRoomSet = this.userRooms.get(userData.userId);
                        userRoomSet.delete(roomId);
                        if (userRoomSet.size === 0) {
                            this.userRooms.delete(userData.userId);
                        }
                    }

                    socket.emit('room_left', { roomId });
                });

                socket.on('disconnect', (reason) => {
                    const userData = this.connectedUsers.get(socket.id);
                    if (userData) {
                        logger.info(`User ${userData.userId} disconnected. Reason: ${reason}`);
                        setTimeout(() => {
                            if (!this.io.sockets.sockets.has(socket.id)) {
                                this.connectedUsers.delete(socket.id);
                            }
                        }, 30000);
                    }
                });

                socket.on('error', (error) => {
                    logger.error(`Socket ${socket.id} error`, { error: error.message });
                });
            });

            this.io.engine.on('connection_error', (err) => {
                logger.error('Connection error', { error: err.message });
            });

        } catch (error) {
            logger.error('Failed to initialize WebSocket service', { error: error.message });
        }
    }

    getIO() {
        return this.io;
    }
}

module.exports = new WebSocketService();