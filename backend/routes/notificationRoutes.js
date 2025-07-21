const express = require('express');
const expressValidator = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const {
    getNotifications,
    markNotificationAsRead,
    getUnreadCount,
    markAllAsRead
} = require('../controllers/notificationController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for authenticated user
 * @access  Private
 * @query   roomId, limit, skip, unreadOnly
 */
router.get('/', [
    expressValidator.query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    expressValidator.query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be non-negative'),
    expressValidator.query('unreadOnly').optional().isBoolean().withMessage('UnreadOnly must be boolean'),
    expressValidator.query('roomId').optional().isMongoId().withMessage('Invalid room ID')
], getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 * @query   roomId (optional)
 */
router.get('/unread-count', [
    expressValidator.query('roomId').optional().isMongoId().withMessage('Invalid room ID')
], getUnreadCount);

/**
 * @route   POST /api/notifications/:notificationId/read
 * @desc    Mark specific notification as read
 * @access  Private
 */
router.post('/:notificationId/read', [
    expressValidator.param('notificationId').isMongoId().withMessage('Invalid notification ID')
], markNotificationAsRead);

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Mark all notifications as read (optionally for specific room)
 * @access  Private
 */
router.post('/mark-all-read', [
    expressValidator.body('roomId').optional().isMongoId().withMessage('Invalid room ID')
], markAllAsRead);

module.exports = router;