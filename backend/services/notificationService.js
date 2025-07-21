const Notification = require('../models/Notification');
const Room = require('../models/Room');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/notification-service.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

class NotificationService {
    constructor() {
        this.websocketService = null;
    }

    // Set WebSocket service reference for real-time delivery
    setWebSocketService(wsService) {
        this.websocketService = wsService;
        logger.info('WebSocket service connected to NotificationService');
    }

    /**
     * Create a new message notification
     * @param {Object} params - Notification parameters
     * @param {string} params.roomId - Room ID where message was sent
     * @param {string} params.senderId - User ID who sent the message
     * @param {string} params.messageContent - Message content for preview
     */
    async createMessageNotification({ roomId, senderId, messageContent }) {
        try {
            // Get room details and members
            const room = await Room.findById(roomId).populate('members', 'username');
            if (!room) {
                logger.error(`Room not found for notification: ${roomId}`);
                return null;
            }

            // Get sender details
            const sender = room.members.find(member => member._id.toString() === senderId.toString());
            if (!sender) {
                logger.error(`Sender not found in room members: ${senderId}`);
                return null;
            }

            // Recipients are all room members except the sender
            const recipients = room.members
                .filter(member => member._id.toString() !== senderId.toString())
                .map(member => member._id);

            if (recipients.length === 0) {
                logger.info(`No recipients for message notification in room: ${roomId}`);
                return null;
            }

            // Create notification
            const notification = new Notification({
                type: 'chat_new_message',
                roomId,
                triggeredBy: senderId,
                recipients,
                data: {
                    roomName: room.name,
                    username: sender.username,
                    messagePreview: messageContent.substring(0, 100),
                    timestamp: new Date()
                }
            });

            const savedNotification = await notification.save();
            logger.info(`Message notification created: ${savedNotification._id}`);

            // Emit real-time notification
            await this.emitNotification(savedNotification);

            return savedNotification;

        } catch (error) {
            logger.error(`Error creating message notification: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a user joined notification
     * @param {Object} params - Notification parameters
     * @param {string} params.roomId - Room ID that user joined
     * @param {string} params.userId - User ID who joined
     */
    async createUserJoinedNotification({ roomId, userId }) {
        try {
            // Get room details and members
            const room = await Room.findById(roomId).populate('members', 'username');
            if (!room) {
                logger.error(`Room not found for join notification: ${roomId}`);
                return null;
            }

            // Get user details
            const user = room.members.find(member => member._id.toString() === userId.toString());
            if (!user) {
                logger.error(`User not found in room members: ${userId}`);
                return null;
            }

            // Recipients are all room members except the user who joined
            const recipients = room.members
                .filter(member => member._id.toString() !== userId.toString())
                .map(member => member._id);

            if (recipients.length === 0) {
                logger.info(`No recipients for join notification in room: ${roomId}`);
                return null;
            }

            // Create notification
            const notification = new Notification({
                type: 'room_user_joined',
                roomId,
                triggeredBy: userId,
                recipients,
                data: {
                    roomName: room.name,
                    username: user.username,
                    timestamp: new Date()
                }
            });

            const savedNotification = await notification.save();
            logger.info(`User joined notification created: ${savedNotification._id}`);

            // Emit real-time notification
            await this.emitNotification(savedNotification);

            return savedNotification;

        } catch (error) {
            logger.error(`Error creating user joined notification: ${error.message}`);
            throw error;
        }
    }

    /**
     * Emit notification via WebSocket to recipients
     * @param {Object} notification - Notification document
     */
    async emitNotification(notification) {
        if (!this.websocketService || !this.websocketService.getIO()) {
            logger.warn('WebSocket service not available for notification emission');
            return;
        }

        try {
            // Populate notification for emission
            await notification.populate('triggeredBy', 'username profilePicture');
            await notification.populate('roomId', 'name');

            const notificationData = {
                _id: notification._id,
                type: notification.type,
                roomId: notification.roomId._id,
                roomName: notification.roomId.name || notification.data.roomName,
                triggeredBy: {
                    _id: notification.triggeredBy._id,
                    username: notification.triggeredBy.username,
                    profilePicture: notification.triggeredBy.profilePicture
                },
                data: notification.data,
                createdAt: notification.createdAt
            };

            // Emit to each recipient
            notification.recipients.forEach(recipientId => {
                const userSockets = this.websocketService.userSockets.get(recipientId.toString());
                if (userSockets && userSockets.size > 0) {
                    userSockets.forEach(socketId => {
                        const socket = this.websocketService.getIO().sockets.sockets.get(socketId);
                        if (socket) {
                            socket.emit('new_notification', notificationData);
                        }
                    });
                    logger.info(`Notification emitted to user: ${recipientId}`);
                }
            });

        } catch (error) {
            logger.error(`Error emitting notification: ${error.message}`);
        }
    }

    /**
     * Mark notification as read by user
     * @param {string} notificationId - Notification ID
     * @param {string} userId - User ID
     */
    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findById(notificationId);
            if (!notification) {
                logger.error(`Notification not found: ${notificationId}`);
                return null;
            }

            // Check if user is a recipient
            if (!notification.recipients.includes(userId)) {
                logger.error(`User ${userId} is not a recipient of notification ${notificationId}`);
                return null;
            }

            await notification.markReadBy(userId);
            logger.info(`Notification ${notificationId} marked as read by user ${userId}`);

            // Emit read status update
            if (this.websocketService) {
                const userSockets = this.websocketService.userSockets.get(userId.toString());
                if (userSockets && userSockets.size > 0) {
                    userSockets.forEach(socketId => {
                        const socket = this.websocketService.getIO().sockets.sockets.get(socketId);
                        if (socket) {
                            socket.emit('notification_read', { notificationId });
                        }
                    });
                }
            }

            return notification;

        } catch (error) {
            logger.error(`Error marking notification as read: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get notifications for user
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     */
    async getNotificationsForUser(userId, options = {}) {
        try {
            const notifications = await Notification.getForUser(userId, options);
            logger.info(`Retrieved ${notifications.length} notifications for user ${userId}`);
            return notifications;
        } catch (error) {
            logger.error(`Error getting notifications for user: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get unread count for user
     * @param {string} userId - User ID
     * @param {string} roomId - Optional room ID filter
     */
    async getUnreadCount(userId, roomId = null) {
        try {
            const count = await Notification.getUnreadCount(userId, roomId);
            logger.info(`Unread count for user ${userId}: ${count}`);
            return count;
        } catch (error) {
            logger.error(`Error getting unread count: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new NotificationService();