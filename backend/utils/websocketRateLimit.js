const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/websocket-ratelimit.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

class WebSocketRateLimit {
    constructor() {
        // Rate limit configurations
        this.limits = {
            messages: {
                windowMs: 60000, // 1 minute
                maxRequests: 30, // 30 messages per minute
                blockDurationMs: 300000 // 5 minutes block
            },
            roomJoins: {
                windowMs: 60000, // 1 minute
                maxRequests: 10, // 10 room joins per minute
                blockDurationMs: 60000 // 1 minute block
            },
            messageEdits: {
                windowMs: 60000, // 1 minute
                maxRequests: 15, // 15 edits per minute
                blockDurationMs: 120000 // 2 minutes block
            }
        };

        // Storage for rate limit data
        // Structure: userId -> { action -> { count, windowStart, blockedUntil } }
        this.userLimits = new Map();
        
        // Cleanup interval - run every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 300000);
    }

    /**
     * Check if user is rate limited for a specific action
     * @param {string} userId - User ID
     * @param {string} action - Action type (messages, roomJoins, messageEdits)
     * @returns {Object} - { allowed: boolean, retryAfter?: number, reason?: string }
     */
    checkRateLimit(userId, action) {
        if (!userId || !action || !this.limits[action]) {
            return { allowed: false, reason: 'Invalid parameters' };
        }

        const now = Date.now();
        const limit = this.limits[action];
        
        // Get or create user data
        if (!this.userLimits.has(userId)) {
            this.userLimits.set(userId, new Map());
        }
        
        const userActions = this.userLimits.get(userId);
        
        // Get or create action data
        if (!userActions.has(action)) {
            userActions.set(action, {
                count: 0,
                windowStart: now,
                blockedUntil: 0
            });
        }
        
        const actionData = userActions.get(action);
        
        // Check if user is currently blocked
        if (actionData.blockedUntil > now) {
            const retryAfter = Math.ceil((actionData.blockedUntil - now) / 1000);
            logger.warn(`Rate limit block active for user ${userId}, action ${action}. Retry after ${retryAfter}s`);
            return { 
                allowed: false, 
                retryAfter,
                reason: `Blocked due to rate limit violation. Try again in ${retryAfter} seconds.`
            };
        }
        
        // Check if we need to reset the window
        if (now - actionData.windowStart > limit.windowMs) {
            actionData.count = 0;
            actionData.windowStart = now;
        }
        
        // Check if user has exceeded the limit
        if (actionData.count >= limit.maxRequests) {
            // Block the user
            actionData.blockedUntil = now + limit.blockDurationMs;
            const retryAfter = Math.ceil(limit.blockDurationMs / 1000);
            
            logger.warn(`Rate limit exceeded for user ${userId}, action ${action}. Blocked for ${retryAfter}s`);
            
            return { 
                allowed: false, 
                retryAfter,
                reason: `Rate limit exceeded. Blocked for ${retryAfter} seconds.`
            };
        }
        
        // Increment counter and allow
        actionData.count++;
        
        // Log if approaching limit
        if (actionData.count > limit.maxRequests * 0.8) {
            logger.info(`User ${userId} approaching rate limit for ${action}: ${actionData.count}/${limit.maxRequests}`);
        }
        
        return { allowed: true };
    }

    /**
     * Get current rate limit status for a user and action
     * @param {string} userId - User ID
     * @param {string} action - Action type
     * @returns {Object} - Current status
     */
    getRateLimitStatus(userId, action) {
        if (!this.userLimits.has(userId)) {
            return { count: 0, limit: this.limits[action]?.maxRequests || 0, blocked: false };
        }
        
        const userActions = this.userLimits.get(userId);
        if (!userActions.has(action)) {
            return { count: 0, limit: this.limits[action]?.maxRequests || 0, blocked: false };
        }
        
        const actionData = userActions.get(action);
        const now = Date.now();
        
        return {
            count: actionData.count,
            limit: this.limits[action].maxRequests,
            blocked: actionData.blockedUntil > now,
            blockedUntil: actionData.blockedUntil > now ? actionData.blockedUntil : null,
            windowStart: actionData.windowStart
        };
    }

    /**
     * Reset rate limits for a specific user (admin function)
     * @param {string} userId - User ID
     * @param {string} action - Optional specific action to reset
     */
    resetUserLimits(userId, action = null) {
        if (!this.userLimits.has(userId)) {
            return false;
        }
        
        if (action) {
            const userActions = this.userLimits.get(userId);
            if (userActions.has(action)) {
                userActions.delete(action);
                logger.info(`Reset rate limits for user ${userId}, action ${action}`);
                return true;
            }
        } else {
            this.userLimits.delete(userId);
            logger.info(`Reset all rate limits for user ${userId}`);
            return true;
        }
        
        return false;
    }

    /**
     * Clean up expired data
     */
    cleanup() {
        const now = Date.now();
        let cleanedUsers = 0;
        let cleanedActions = 0;
        
        for (const [userId, userActions] of this.userLimits.entries()) {
            for (const [action, actionData] of userActions.entries()) {
                // Remove expired blocks and old windows
                const limit = this.limits[action];
                if (limit && (
                    actionData.blockedUntil < now && 
                    (now - actionData.windowStart) > limit.windowMs * 2
                )) {
                    userActions.delete(action);
                    cleanedActions++;
                }
            }
            
            // Remove users with no active limits
            if (userActions.size === 0) {
                this.userLimits.delete(userId);
                cleanedUsers++;
            }
        }
        
        if (cleanedUsers > 0 || cleanedActions > 0) {
            logger.info(`Rate limit cleanup: removed ${cleanedActions} expired actions for ${cleanedUsers} users`);
        }
    }

    /**
     * Get statistics about current rate limiting
     */
    getStats() {
        let totalUsers = this.userLimits.size;
        let totalActions = 0;
        let blockedUsers = 0;
        const now = Date.now();
        
        for (const [userId, userActions] of this.userLimits.entries()) {
            totalActions += userActions.size;
            
            // Check if user has any active blocks
            for (const [action, actionData] of userActions.entries()) {
                if (actionData.blockedUntil > now) {
                    blockedUsers++;
                    break;
                }
            }
        }
        
        return {
            totalUsers,
            totalActions,
            blockedUsers,
            limits: this.limits
        };
    }

    /**
     * Destroy the rate limiter and cleanup
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.userLimits.clear();
        logger.info('WebSocket rate limiter destroyed');
    }
}

module.exports = WebSocketRateLimit;