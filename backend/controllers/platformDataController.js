const User = require('../models/User');
const axios = require('axios');
const winston = require('winston');
const enhancedPlatformService = require('../services/enhancedPlatformService');
const redisClient = require('../services/cache/redisClient');

// Logger for platform data operations
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/platform-controller-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/platform-controller-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

exports.getUserQuestionStats = async (req, res) => {
    try {
        const username = req.params.username;

        // Fetch user by username, excluding sensitive information
        const user = await User.findOne({ username }).select('-password -_id');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Validate LeetCode username
        if (!user.platforms || !user.platforms.leetcode || !user.platforms.leetcode.username) {
            return res.status(400).json({
                success: false,
                message: "LeetCode username is not available for this user",
            });
        }

        const leetcodeUsername = user.platforms.leetcode.username;

        // GraphQL query for question stats
        const query = `
            {
                matchedUser(username: "${leetcodeUsername}") {
                    tagProblemCounts {
                        advanced {
                            tagName
                            problemsSolved
                        }
                        intermediate {
                            tagName
                            problemsSolved
                        }
                        fundamental {
                            tagName
                            problemsSolved
                        }
                    }
                }
            }
        `;

        const response = await axios.post(
            'https://leetcode.com/graphql',
            { query },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Referer': 'https://leetcode.com',
                },
            }
        );

        const tagProblemCounts = response.data.data.matchedUser.tagProblemCounts;

        res.status(200).json(tagProblemCounts);

    } catch (error) {
        console.error("Error fetching user question stats:", error.message);

        if (error.response) {
            console.error("Response Data:", error.response.data);
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.refreshUserPlatforms = async (req, res) => {
    const userId = req.user.id;
    const startTime = Date.now();

    try {
        // Check rate limiting for user
        const rateLimitKey = `platform-refresh:user:${userId}`;
        const rateLimitCheck = await redisClient.checkRateLimit(rateLimitKey, 1, 600); // 1 request per 10 minutes
        
        if (!rateLimitCheck.allowed) {
            logger.warn('Platform refresh rate limit exceeded', { userId, ip: req.ip });
            return res.status(429).json({
                success: false,
                message: "Platform refresh rate limit exceeded. Please wait before refreshing again.",
                retryAfter: "10 minutes",
                rateLimitInfo: {
                    remaining: rateLimitCheck.remaining,
                    resetTime: new Date(Date.now() + 600000).toISOString()
                }
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Update rate limit tracking
        await User.findByIdAndUpdate(userId, {
            $set: {
                'rateLimitInfo.lastPlatformRefresh': new Date(),
                'rateLimitInfo.platformRefreshCount': (user.rateLimitInfo?.platformRefreshCount || 0) + 1
            }
        });

        const { leetcode, github, codeforces } = user.platforms;
        if (!leetcode?.username && !github?.username && !codeforces?.username) {
            return res.status(400).json({ 
                success: false,
                message: "No linked platform to refresh" 
            });
        }

        logger.info('Starting platform refresh for user', {
            userId,
            username: user.username,
            platforms: {
                leetcode: !!leetcode?.username,
                github: !!github?.username,
                codeforces: !!codeforces?.username
            }
        });

        // Determine which platforms to update
        const platformsToUpdate = [];
        if (leetcode?.username) platformsToUpdate.push('leetcode');
        if (github?.username) platformsToUpdate.push('github');
        if (codeforces?.username) platformsToUpdate.push('codeforces');

        // Use enhanced platform service for multi-platform update
        const result = await enhancedPlatformService.updateUserMultiplePlatforms(
            user, 
            platformsToUpdate, 
            { 
                force: req.query.force === 'true',
                useCache: req.query.noCache !== 'true'
            }
        );

        const processingTime = Date.now() - startTime;

        if (!result.success) {
            logger.error('Platform refresh failed for user', {
                userId,
                error: result.error,
                processingTime
            });

            return res.status(500).json({
                success: false,
                message: "Failed to refresh platform data. Please try again later.",
                error: process.env.NODE_ENV === 'development' ? result.error : undefined,
                processingTime
            });
        }

        logger.info('Platform refresh completed for user', {
            userId,
            username: user.username,
            platformsUpdated: Object.keys(result.platforms),
            warnings: result.warnings.length,
            processingTime,
            fromCache: result.fromCache
        });

        // Return enhanced response
        res.status(200).json({
            success: true,
            message: "Platform data refreshed successfully",
            platforms: result.platforms,
            fromCache: result.fromCache,
            warnings: result.warnings.length > 0 ? result.warnings : undefined,
            metadata: {
                processingTime,
                refreshedAt: new Date().toISOString(),
                rateLimitRemaining: rateLimitCheck.remaining
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        
        logger.error('Critical error in platform refresh', {
            userId,
            error: error.message,
            stack: error.stack,
            processingTime
        });

        res.status(500).json({
            success: false,
            message: "Failed to refresh platform data. Please try again later.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            processingTime
        });
    }
};

// Enhanced bulk platform refresh for room operations
exports.bulkRefreshPlatformStats = async (req, res) => {
    const { platform, userIds } = req.body;
    const roomId = req.params.roomId;
    const requesterId = req.user.id;
    const startTime = Date.now();

    try {
        // Validate inputs
        if (!platform || !userIds || !Array.isArray(userIds)) {
            return res.status(400).json({
                success: false,
                message: "Platform and userIds array are required"
            });
        }

        if (!['leetcode', 'github', 'codeforces'].includes(platform)) {
            return res.status(400).json({
                success: false,
                message: "Invalid platform specified"
            });
        }

        // Check rate limiting for room-based refresh
        const rateLimitKey = `platform-refresh:room:${roomId}`;
        const rateLimitCheck = await redisClient.checkRateLimit(rateLimitKey, 1, 600); // 1 request per 10 minutes per room
        
        if (!rateLimitCheck.allowed) {
            logger.warn('Room platform refresh rate limit exceeded', { roomId, requesterId, platform });
            return res.status(429).json({
                success: false,
                message: "Room platform refresh rate limit exceeded. Please wait before refreshing again.",
                retryAfter: "10 minutes"
            });
        }

        logger.info('Starting bulk platform refresh', {
            platform,
            userCount: userIds.length,
            roomId,
            requesterId
        });

        // Fetch users
        const users = await User.find({ _id: { $in: userIds } });
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No valid users found"
            });
        }

        // Progress tracking function
        let progressUpdates = 0;
        const onProgress = (progress) => {
            progressUpdates++;
            if (progressUpdates % 10 === 0 || progress.completed === progress.total) {
                logger.info('Bulk refresh progress', {
                    platform,
                    roomId,
                    progress: `${progress.completed}/${progress.total}`,
                    successful: progress.successful,
                    failed: progress.failed
                });
            }
        };

        // Execute bulk update using enhanced platform service
        const result = await enhancedPlatformService.bulkUpdatePlatformStats(
            users,
            platform,
            {
                useCache: true,
                force: req.query.force === 'true',
                batchSize: parseInt(process.env.BULK_BATCH_SIZE) || 10,
                onProgress
            }
        );

        const processingTime = Date.now() - startTime;

        if (!result.success) {
            logger.error('Bulk platform refresh failed', {
                platform,
                roomId,
                error: result.error,
                processingTime
            });

            return res.status(500).json({
                success: false,
                message: "Bulk platform refresh failed",
                error: process.env.NODE_ENV === 'development' ? result.error : undefined,
                processingTime
            });
        }

        logger.info('Bulk platform refresh completed', {
            platform,
            roomId,
            results: result.results,
            processingTime
        });

        // Return comprehensive results
        res.status(200).json({
            success: true,
            message: `Bulk ${platform} refresh completed`,
            platform,
            results: result.results,
            warnings: result.warnings || [],
            metadata: {
                processingTime,
                refreshedAt: new Date().toISOString(),
                batchProcessing: true,
                avgTimePerUser: Math.round(processingTime / result.results.processed)
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        
        logger.error('Critical error in bulk platform refresh', {
            platform,
            roomId,
            requesterId,
            error: error.message,
            stack: error.stack,
            processingTime
        });

        res.status(500).json({
            success: false,
            message: "Bulk platform refresh failed due to server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            processingTime
        });
    }
};

// Cache management endpoints
exports.invalidateUserCache = async (req, res) => {
    const userId = req.user.id;
    const { platform } = req.query;

    try {
        const success = await enhancedPlatformService.invalidateCache(userId, platform);
        
        if (success) {
            logger.info('Cache invalidated for user', { userId, platform: platform || 'all' });
            res.status(200).json({
                success: true,
                message: `Cache invalidated for ${platform || 'all platforms'}`
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Cache invalidation failed"
            });
        }
    } catch (error) {
        logger.error('Cache invalidation error', { userId, platform, error: error.message });
        res.status(500).json({
            success: false,
            message: "Cache invalidation failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Platform service statistics endpoint
exports.getPlatformStats = async (req, res) => {
    try {
        const stats = enhancedPlatformService.getStats();
        const redisHealth = await redisClient.healthCheck();
        
        res.status(200).json({
            success: true,
            platformService: stats,
            cache: redisHealth,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting platform stats', { error: error.message });
        res.status(500).json({
            success: false,
            message: "Failed to get platform statistics",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
