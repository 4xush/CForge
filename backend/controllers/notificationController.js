const notificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/notification-controller.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

/**
 * Get notifications for the authenticated user
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            roomId = null,
            limit = 50,
            skip = 0,
            unreadOnly = false
        } = req.query;

        const options = {
            roomId,
            limit: parseInt(limit),
            skip: parseInt(skip),
            unreadOnly: unreadOnly === 'true'
        };

        const notifications = await notificationService.getNotificationsForUser(userId, options);

        // Add read status for each notification
        const notificationsWithReadStatus = notifications.map(notification => ({
            ...notification,
            isRead: notification.readBy ? (notification.readBy instanceof Map ? notification.readBy.has(userId.toString()) : !!notification.readBy[userId.toString()]) : false
        }));

        logger.info(`Retrieved ${notifications.length} notifications for user ${userId}`);

        res.status(200).json({
            success: true,
            data: notificationsWithReadStatus,
            pagination: {
                limit: options.limit,
                skip: options.skip,
                hasMore: notifications.length === options.limit
            }
        });

    } catch (error) {
        logger.error(`Error getting notifications: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Mark a notification as read
 */
const markNotificationAsRead = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await notificationService.markAsRead(notificationId, userId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or access denied'
            });
        }

        logger.info(`Notification ${notificationId} marked as read by user ${userId}`);

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: { notificationId, readAt: new Date() }
        });

    } catch (error) {
        logger.error(`Error marking notification as read: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const { roomId = null } = req.query;

        const count = await notificationService.getUnreadCount(userId, roomId);

        logger.info(`Unread count for user ${userId}: ${count}`);

        res.status(200).json({
            success: true,
            data: {
                unreadCount: count,
                roomId: roomId || null
            }
        });

    } catch (error) {
        logger.error(`Error getting unread count: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Mark all notifications as read for user
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { roomId = null } = req.body;

        // Get all unread notifications for user
        const notifications = await notificationService.getNotificationsForUser(userId, {
            unreadOnly: true,
            roomId,
            limit: 1000 // Large limit to get all unread
        });

        // Mark each as read
        const markPromises = notifications.map(notification =>
            notificationService.markAsRead(notification._id, userId)
        );

        await Promise.all(markPromises);

        logger.info(`Marked ${notifications.length} notifications as read for user ${userId}`);

        res.status(200).json({
            success: true,
            message: `Marked ${notifications.length} notifications as read`,
            data: { markedCount: notifications.length }
        });

    } catch (error) {
        logger.error(`Error marking all notifications as read: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getNotifications,
    markNotificationAsRead,
    getUnreadCount,
    markAllAsRead
};