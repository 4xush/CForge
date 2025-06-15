const Room = require('../models/Room');
const User = require('../models/User');
const enhancedPlatformService = require('../services/enhancedPlatformService');
const redisClient = require('../services/cache/redisClient');
const winston = require('winston');

// Logger for enhanced room operations
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/room-controller-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/room-controller-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// Helper function to check if user is member or admin
const isMember = (room, userId) => {
    return room.members.some(member => member.toString() === userId.toString());
};

const isAdminOrMember = (room, userId) => {
    return room.admins.includes(userId) || isMember(room, userId);
};

/**
 * Enhanced LeetCode stats update for room members
 */
exports.updateRoomMembersLeetCodeStats = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user._id;
    const startTime = Date.now();
    let room = null; // Initialize room variable at function scope

    try {
        // Find room
        room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        // Check permissions
        // if (!isAdminOrMember(room, userId)) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "You don't have permission to update this room's stats"
        //     });
        // }

        // Check rate limiting for room-based refresh
        const rateLimitKey = `platform-refresh:room:${roomId}:leetcode`;
        const rateLimitCheck = await redisClient.checkRateLimit(rateLimitKey, 1, 172800); // 1 request per 48 hours per room

        if (!rateLimitCheck.allowed) {
            logger.warn('Room LeetCode refresh rate limit exceeded', { roomId, userId });
            return res.status(429).json({
                success: false,
                message: "LeetCode stats were recently updated. Please wait before updating again.",
                retryAfter: "2 hours",
                lastUpdated: room.platformStats?.leetcode?.lastUpdated,
                nextUpdateAvailable: new Date(Date.now() + 172800000).toISOString()
            });
        }

        // Check if last update was recent (unless forced)
        const lastUpdate = room.platformStats?.leetcode?.lastUpdated;
        const isForced = req.query.force === 'true';

        if (!isForced && lastUpdate) {
            const twoHoursAgo = new Date(Date.now() - 172800000);
            if (lastUpdate > twoHoursAgo) {
                return res.status(200).json({
                    success: true,
                    message: "LeetCode stats were recently updated",
                    lastUpdated: lastUpdate,
                    nextUpdateAvailable: new Date(lastUpdate.getTime() + 172800000),
                    skipReason: "RECENT_UPDATE"
                });
            }
        }

        logger.info('Starting LeetCode stats update for room', {
            roomId,
            memberCount: room.members.length,
            requesterId: userId,
            forced: isForced
        });

        // Set updating status
        await Room.findByIdAndUpdate(room._id, {
            'platformStats.leetcode.updateStatus': 'updating',
            'platformStats.leetcode.lastUpdateStarted': new Date()
        });

        // Fetch room members
        const members = await User.find({ _id: { $in: room.members } });

        // Filter members with LeetCode usernames
        const membersWithLeetCode = members.filter(member =>
            member.platforms?.leetcode?.username
        );

        if (membersWithLeetCode.length === 0) {
            await Room.findByIdAndUpdate(room._id, {
                'platformStats.leetcode.updateStatus': 'completed',
                'platformStats.leetcode.lastUpdated': new Date()
            });

            return res.status(200).json({
                success: true,
                message: "No members have LeetCode usernames configured",
                results: {
                    total: members.length,
                    processed: 0,
                    successful: 0,
                    failed: 0,
                    skipped: members.length
                }
            });
        }

        // Progress tracking
        let progressCount = 0;
        const onProgress = (progress) => {
            progressCount++;
            if (progressCount % 5 === 0 || progress.completed === progress.total) {
                logger.info('LeetCode update progress', {
                    roomId,
                    progress: `${progress.completed}/${progress.total}`,
                    successful: progress.successful,
                    failed: progress.failed
                });
            }
        };

        // Execute bulk update using enhanced platform service
        const bulkResult = await enhancedPlatformService.bulkUpdatePlatformStats(
            membersWithLeetCode,
            'leetcode',
            {
                useCache: !isForced,
                force: isForced,
                batchSize: parseInt(process.env.ROOM_BATCH_SIZE) || 5,
                maxRetries: 2,
                onProgress
            }
        );

        const processingTime = Date.now() - startTime;

        // Validate bulkResult structure before proceeding
        if (!bulkResult || typeof bulkResult !== 'object') {
            throw new Error('Invalid bulk result returned from platform service');
        }

        // Ensure required properties exist with defaults
        const safeResults = {
            processed: bulkResult.results?.processed || 0,
            successful: bulkResult.results?.successful || 0,
            failed: bulkResult.results?.failed || 0,
            fromCache: bulkResult.results?.fromCache || 0
        };

        // Update room stats
        const roomStatsUpdate = {
            'platformStats.leetcode.updateStatus': bulkResult.success ? 'completed' : 'failed',
            'platformStats.leetcode.lastUpdated': new Date(),
            'platformStats.leetcode.lastResults': {
                ...safeResults,
                processingTime,
                warnings: bulkResult.warnings || []
            }
        };

        await Room.findByIdAndUpdate(room._id, roomStatsUpdate);

        // Prepare response in expected format with safe array access
        const updateResults = {
            success: (bulkResult.successful || []).map(s => s.username).filter(Boolean),
            failed: (bulkResult.failed || []).map(f => ({
                username: f.username,
                reason: f.error || f.code || 'Update failed'
            }))
        };

        // Add warnings to failed results
        if (bulkResult.warnings && Array.isArray(bulkResult.warnings)) {
            bulkResult.warnings.forEach(warning => {
                if (!updateResults.failed.find(f => f.username === warning.username)) {
                    updateResults.failed.push({
                        username: warning.username,
                        reason: warning.message
                    });
                }
            });
        }

        logger.info('LeetCode stats update completed for room', {
            roomId,
            results: safeResults,
            processingTime
        });

        res.status(200).json({
            success: true,
            message: "LeetCode stats update completed",
            updateResults,
            summary: {
                totalMembers: members.length,
                membersWithLeetCode: membersWithLeetCode.length,
                processed: safeResults.processed,
                successful: safeResults.successful,
                failed: safeResults.failed,
                fromCache: safeResults.fromCache
            },
            metadata: {
                processingTime,
                updatedAt: new Date().toISOString(),
                forced: isForced
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;

        logger.error('Critical error in LeetCode stats update', {
            roomId,
            userId,
            error: error.message,
            stack: error.stack,
            processingTime
        });

        // Update room status to failed (only if room exists)
        if (room && room._id) {
            await Room.findByIdAndUpdate(room._id, {
                'platformStats.leetcode.updateStatus': 'failed',
                'platformStats.leetcode.lastError': error.message
            }).catch((updateError) => {
                logger.error('Failed to update room status after error', {
                    roomId,
                    updateError: updateError.message
                });
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update LeetCode stats",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            processingTime
        });
    }
};

/**
 * Enhanced Codeforces stats update for room members
 */
exports.updateRoomMembersCodeforcesStats = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user._id;
    const startTime = Date.now();
    let room = null; // Initialize room variable at function scope

    try {
        // Find room
        room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        // Check permissions
        // if (!isAdminOrMember(room, userId)) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "You don't have permission to update this room's stats"
        //     });
        // }

        // Check rate limiting for room-based refresh
        const rateLimitKey = `platform-refresh:room:${roomId}:codeforces`;
        const rateLimitCheck = await redisClient.checkRateLimit(rateLimitKey, 1, 172800); // 1 request per 2 hours per room

        if (!rateLimitCheck.allowed) {
            logger.warn('Room Codeforces refresh rate limit exceeded', { roomId, userId });
            return res.status(429).json({
                success: false,
                message: "Codeforces stats were recently updated. Please wait before updating again.",
                retryAfter: "2 hours",
                lastUpdated: room.platformStats?.codeforces?.lastUpdated,
                nextUpdateAvailable: new Date(Date.now() + 172800000).toISOString()
            });
        }

        // Check if last update was recent (unless forced)
        const lastUpdate = room.platformStats?.codeforces?.lastUpdated;
        const isForced = req.query.force === 'true';

        if (!isForced && lastUpdate) {
            const twoHoursAgo = new Date(Date.now() - 172800000);
            if (lastUpdate > twoHoursAgo) {
                return res.status(200).json({
                    success: true,
                    message: "Codeforces stats were recently updated",
                    lastUpdated: lastUpdate,
                    nextUpdateAvailable: new Date(lastUpdate.getTime() + 172800000),
                    skipReason: "RECENT_UPDATE"
                });
            }
        }

        logger.info('Starting Codeforces stats update for room', {
            roomId,
            memberCount: room.members.length,
            requesterId: userId,
            forced: isForced
        });

        // Set updating status
        await Room.findByIdAndUpdate(room._id, {
            'platformStats.codeforces.updateStatus': 'updating',
            'platformStats.codeforces.lastUpdateStarted': new Date()
        });

        // Fetch room members
        const members = await User.find({ _id: { $in: room.members } });

        // Filter members with Codeforces usernames
        const membersWithCodeforces = members.filter(member =>
            member.platforms?.codeforces?.username
        );

        if (membersWithCodeforces.length === 0) {
            await Room.findByIdAndUpdate(room._id, {
                'platformStats.codeforces.updateStatus': 'completed',
                'platformStats.codeforces.lastUpdated': new Date()
            });

            return res.status(200).json({
                success: true,
                message: "No members have Codeforces usernames configured",
                results: {
                    total: members.length,
                    processed: 0,
                    successful: 0,
                    failed: 0,
                    skipped: members.length
                }
            });
        }

        // Progress tracking
        let progressCount = 0;
        const onProgress = (progress) => {
            progressCount++;
            if (progressCount % 5 === 0 || progress.completed === progress.total) {
                logger.info('Codeforces update progress', {
                    roomId,
                    progress: `${progress.completed}/${progress.total}`,
                    successful: progress.successful,
                    failed: progress.failed
                });
            }
        };

        // Execute bulk update using enhanced platform service
        const bulkResult = await enhancedPlatformService.bulkUpdatePlatformStats(
            membersWithCodeforces,
            'codeforces',
            {
                useCache: !isForced,
                force: isForced,
                batchSize: parseInt(process.env.ROOM_BATCH_SIZE) || 5,
                maxRetries: 3, // Codeforces can be flaky
                onProgress
            }
        );

        const processingTime = Date.now() - startTime;

        // Validate bulkResult structure before proceeding
        if (!bulkResult || typeof bulkResult !== 'object') {
            throw new Error('Invalid bulk result returned from platform service');
        }

        // Ensure required properties exist with defaults
        const safeResults = {
            processed: bulkResult.results?.processed || 0,
            successful: bulkResult.results?.successful || 0,
            failed: bulkResult.results?.failed || 0,
            fromCache: bulkResult.results?.fromCache || 0
        };

        // Prepare response in expected format with safe array access
        const updateResults = {
            success: (bulkResult.successful || []).map(s => s.username).filter(Boolean),
            failed: (bulkResult.failed || []).map(f => ({
                username: f.username,
                reason: f.error || f.code || 'Update failed'
            }))
        };

        // Add warnings to failed results
        if (bulkResult.warnings && Array.isArray(bulkResult.warnings)) {
            bulkResult.warnings.forEach(warning => {
                if (!updateResults.failed.find(f => f.username === warning.username)) {
                    updateResults.failed.push({
                        username: warning.username,
                        reason: warning.message
                    });
                }
            });
        }

        logger.info('Codeforces stats update completed for room', {
            roomId,
            results: safeResults,
            processingTime
        });

        // Update room stats with proper success/failure status
        const roomStatsUpdate = {
            'platformStats.codeforces.updateStatus': bulkResult.success ? 'completed' : 'failed',
            'platformStats.codeforces.lastUpdated': new Date(),
            'platformStats.codeforces.lastResults': {
                ...safeResults,
                processingTime,
                warnings: bulkResult.warnings || []
            }
        };

        await Room.findByIdAndUpdate(room._id, roomStatsUpdate);

        res.status(200).json({
            success: true,
            message: "Codeforces stats update completed",
            updateResults,
            summary: {
                totalMembers: members.length,
                membersWithCodeforces: membersWithCodeforces.length,
                processed: safeResults.processed,
                successful: safeResults.successful,
                failed: safeResults.failed,
                fromCache: safeResults.fromCache
            },
            metadata: {
                processingTime,
                updatedAt: new Date().toISOString(),
                forced: isForced
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;

        logger.error('Critical error in Codeforces stats update', {
            roomId,
            userId,
            error: error.message,
            stack: error.stack,
            processingTime
        });

        // Update room status to failed (only if room exists)
        if (room && room._id) {
            await Room.findByIdAndUpdate(room._id, {
                'platformStats.codeforces.updateStatus': 'failed',
                'platformStats.codeforces.lastError': error.message
            }).catch((updateError) => {
                logger.error('Failed to update room status after error', {
                    roomId,
                    updateError: updateError.message
                });
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update Codeforces stats",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            processingTime
        });
    }
};

/**
 * Enhanced GitHub stats update for room members
 */
exports.updateRoomMembersGitHubStats = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user._id;
    const startTime = Date.now();
    let room = null; // Initialize room variable at function scope

    try {
        // Find room
        room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        // Check permissions
        // if (!isAdminOrMember(room, userId)) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "You don't have permission to update this room's stats"
        //     });
        // }

        // Check rate limiting for room-based refresh
        const rateLimitKey = `platform-refresh:room:${roomId}:github`;
        const rateLimitCheck = await redisClient.checkRateLimit(rateLimitKey, 1, 3600); // 1 request per 1 hour per room (GitHub has stricter limits)

        if (!rateLimitCheck.allowed) {
            logger.warn('Room GitHub refresh rate limit exceeded', { roomId, userId });
            return res.status(429).json({
                success: false,
                message: "GitHub stats were recently updated. Please wait before updating again.",
                retryAfter: "1 hour",
                lastUpdated: room.platformStats?.github?.lastUpdated,
                nextUpdateAvailable: new Date(Date.now() + 3600000).toISOString()
            });
        }

        // Check if last update was recent (unless forced)
        const lastUpdate = room.platformStats?.github?.lastUpdated;
        const isForced = req.query.force === 'true';

        if (!isForced && lastUpdate) {
            const oneHourAgo = new Date(Date.now() - 3600000);
            if (lastUpdate > oneHourAgo) {
                return res.status(200).json({
                    success: true,
                    message: "GitHub stats were recently updated",
                    lastUpdated: lastUpdate,
                    nextUpdateAvailable: new Date(lastUpdate.getTime() + 3600000),
                    skipReason: "RECENT_UPDATE"
                });
            }
        }

        logger.info('Starting GitHub stats update for room', {
            roomId,
            memberCount: room.members.length,
            requesterId: userId,
            forced: isForced
        });

        // Set updating status
        await Room.findByIdAndUpdate(room._id, {
            'platformStats.github.updateStatus': 'updating',
            'platformStats.github.lastUpdateStarted': new Date()
        });

        // Fetch room members
        const members = await User.find({ _id: { $in: room.members } });

        // Filter members with GitHub usernames
        const membersWithGitHub = members.filter(member =>
            member.platforms?.github?.username
        );

        if (membersWithGitHub.length === 0) {
            await Room.findByIdAndUpdate(room._id, {
                'platformStats.github.updateStatus': 'completed',
                'platformStats.github.lastUpdated': new Date()
            });

            return res.status(200).json({
                success: true,
                message: "No members have GitHub usernames configured",
                results: {
                    total: members.length,
                    processed: 0,
                    successful: 0,
                    failed: 0,
                    skipped: members.length
                }
            });
        }

        // Progress tracking
        let progressCount = 0;
        const onProgress = (progress) => {
            progressCount++;
            if (progressCount % 5 === 0 || progress.completed === progress.total) {
                logger.info('GitHub update progress', {
                    roomId,
                    progress: `${progress.completed}/${progress.total}`,
                    successful: progress.successful,
                    failed: progress.failed
                });
            }
        };

        // Execute bulk update using enhanced platform service
        const bulkResult = await enhancedPlatformService.bulkUpdatePlatformStats(
            membersWithGitHub,
            'github',
            {
                useCache: !isForced,
                force: isForced,
                batchSize: parseInt(process.env.ROOM_BATCH_SIZE) || 3, // Smaller batches for GitHub
                maxRetries: 2,
                onProgress
            }
        );

        const processingTime = Date.now() - startTime;

        // Validate bulkResult structure before proceeding
        if (!bulkResult || typeof bulkResult !== 'object') {
            throw new Error('Invalid bulk result returned from platform service');
        }

        // Ensure required properties exist with defaults
        const safeResults = {
            processed: bulkResult.results?.processed || 0,
            successful: bulkResult.results?.successful || 0,
            failed: bulkResult.results?.failed || 0,
            fromCache: bulkResult.results?.fromCache || 0
        };

        // Update room stats
        const roomStatsUpdate = {
            'platformStats.github.updateStatus': bulkResult.success ? 'completed' : 'failed',
            'platformStats.github.lastUpdated': new Date(),
            'platformStats.github.lastResults': {
                ...safeResults,
                processingTime,
                warnings: bulkResult.warnings || []
            }
        };

        await Room.findByIdAndUpdate(room._id, roomStatsUpdate);

        // Prepare response in expected format with safe array access
        const updateResults = {
            success: (bulkResult.successful || []).map(s => s.username).filter(Boolean),
            failed: (bulkResult.failed || []).map(f => ({
                username: f.username,
                reason: f.error || f.code || 'Update failed'
            }))
        };

        // Add warnings to failed results
        if (bulkResult.warnings && Array.isArray(bulkResult.warnings)) {
            bulkResult.warnings.forEach(warning => {
                if (!updateResults.failed.find(f => f.username === warning.username)) {
                    updateResults.failed.push({
                        username: warning.username,
                        reason: warning.message
                    });
                }
            });
        }

        logger.info('GitHub stats update completed for room', {
            roomId,
            results: safeResults,
            processingTime
        });

        res.status(200).json({
            success: true,
            message: "GitHub stats update completed",
            updateResults,
            summary: {
                totalMembers: members.length,
                membersWithGitHub: membersWithGitHub.length,
                processed: safeResults.processed,
                successful: safeResults.successful,
                failed: safeResults.failed,
                fromCache: safeResults.fromCache
            },
            metadata: {
                processingTime,
                updatedAt: new Date().toISOString(),
                forced: isForced
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;

        logger.error('Critical error in GitHub stats update', {
            roomId,
            userId,
            error: error.message,
            stack: error.stack,
            processingTime
        });

        // Update room status to failed (only if room exists)
        if (room && room._id) {
            await Room.findByIdAndUpdate(room._id, {
                'platformStats.github.updateStatus': 'failed',
                'platformStats.github.lastError': error.message
            }).catch((updateError) => {
                logger.error('Failed to update room status after error', {
                    roomId,
                    updateError: updateError.message
                });
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update GitHub stats",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            processingTime
        });
    }
};

/**
 * Get room platform update status
 */
exports.getRoomPlatformStatus = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        if (!isAdminOrMember(room, userId)) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view this room's stats"
            });
        }

        res.status(200).json({
            success: true,
            platformStats: room.platformStats || {},
            memberCount: room.members.length
        });

    } catch (error) {
        logger.error('Error getting room platform status', {
            roomId: req.params.roomId,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: "Failed to get room platform status",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};