const redisClient = require('./cache/redisClient');
const concurrencyLimiter = require('./concurrencyLimiter');
const { updateUserLeetCodeStats } = require('./leetcode/leetcodeStatsService');
const { updateUserGitHubStats } = require('./github/githubStatsServices');
const { updateUserCodeforcesStats } = require('./codeforces/codeforcesStatsService');
const User = require('../models/User');
const winston = require('winston');

// Logger for enhanced platform operations
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/platform-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/platform-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

class EnhancedPlatformService {
    constructor() {
        this.platformServices = {
            leetcode: updateUserLeetCodeStats,
            github: updateUserGitHubStats,
            codeforces: updateUserCodeforcesStats
        };

        // Cache TTL configurations (in seconds)
        this.cacheTTL = {
            leetcode: parseInt(process.env.LEETCODE_CACHE_TTL) || 1800, // 30 minutes
            github: parseInt(process.env.GITHUB_CACHE_TTL) || 1800,    // 30 minutes
            codeforces: parseInt(process.env.CODEFORCES_CACHE_TTL) || 1800, // 30 minutes
        };

        // Performance tracking
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            apiCalls: 0,
            errors: 0,
            totalProcessingTime: 0
        };
    }

    /**
     * Update platform stats for a single user with caching
     * @param {Object} user - User document
     * @param {string} platform - Platform name (leetcode, github, codeforces)
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} - Result object
     */
    async updateUserPlatformStats(user, platform, options = {}) {
        const { force = false, useCache = true, throwError = false } = options;
        const startTime = Date.now();
        
        try {
            // Validate inputs
            if (!user || !user._id || !platform) {
                throw new Error('Invalid user or platform specified');
            }

            if (!this.platformServices[platform]) {
                throw new Error(`Unsupported platform: ${platform}`);
            }

            if (!user.platforms?.[platform]?.username) {
                return {
                    success: false,
                    user,
                    error: {
                        code: 'NO_USERNAME',
                        message: `No ${platform} username configured for user`
                    }
                };
            }

            const userId = user._id.toString();
            const platformUsername = user.platforms[platform].username;

            logger.debug(`Starting ${platform} stats update for user`, {
                userId,
                username: user.username,
                platformUsername,
                force,
                useCache
            });

            // Check cache first (unless forced or cache disabled)
            if (useCache && !force) {
                const cachedData = await redisClient.getPlatformData(userId, platform);
                if (cachedData) {
                    this.stats.cacheHits++;
                    logger.debug(`Cache hit for ${platform} stats`, { userId, platform });
                    
                    // Update user object with cached data and return
                    const updatedUser = await this.applyCachedDataToUser(user, platform, cachedData.data);
                    return {
                        success: true,
                        user: updatedUser,
                        fromCache: true,
                        processingTime: Date.now() - startTime
                    };
                }
                this.stats.cacheMisses++;
            }

            // Fetch fresh data from platform API
            this.stats.apiCalls++;
            const platformService = this.platformServices[platform];
            const result = await platformService(user, throwError, force);

            const processingTime = Date.now() - startTime;
            this.stats.totalProcessingTime += processingTime;

            if (result.error) {
                this.stats.errors++;
                logger.warn(`Platform stats update failed`, {
                    userId,
                    platform,
                    error: result.error.message,
                    code: result.error.code,
                    processingTime
                });

                return {
                    success: false,
                    user: result.user,
                    error: result.error,
                    processingTime
                };
            }

            // Cache the successful result
            if (useCache && result.user.platforms[platform]) {
                await redisClient.setPlatformData(
                    userId, 
                    platform, 
                    result.user.platforms[platform],
                    this.cacheTTL[platform]
                );
                logger.debug(`Cached ${platform} stats`, { userId, platform });
            }

            logger.info(`Successfully updated ${platform} stats`, {
                userId,
                username: user.username,
                platform,
                processingTime
            });

            return {
                success: true,
                user: result.user,
                fromCache: false,
                processingTime
            };

        } catch (error) {
            this.stats.errors++;
            const processingTime = Date.now() - startTime;
            
            logger.error(`Critical error updating ${platform} stats`, {
                userId: user._id?.toString(),
                platform,
                error: error.message,
                stack: error.stack,
                processingTime
            });

            if (throwError) {
                throw error;
            }

            return {
                success: false,
                user,
                error: {
                    code: error.code || 'CRITICAL_ERROR',
                    message: error.message || 'An unexpected error occurred'
                },
                processingTime
            };
        }
    }

    /**
     * Bulk update platform stats for multiple users
     * @param {Array} users - Array of user documents
     * @param {string} platform - Platform name
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} - Bulk operation results
     */
    async bulkUpdatePlatformStats(users, platform, options = {}) {
        const {
            useCache = true,
            force = false,
            batchSize = parseInt(process.env.PLATFORM_BATCH_SIZE) || 10,
            maxRetries = 2,
            onProgress = null
        } = options;

        const startTime = Date.now();
        
        logger.info(`Starting bulk ${platform} stats update`, {
            userCount: users.length,
            platform,
            batchSize,
            useCache,
            force
        });

        try {
            // Filter users that have the platform configured
            const validUsers = users.filter(user => 
                user.platforms?.[platform]?.username
            );

            if (validUsers.length === 0) {
                return {
                    success: true,
                    platform,
                    results: {
                        total: users.length,
                        processed: 0,
                        successful: 0,
                        failed: 0,
                        skipped: users.length,
                        fromCache: 0
                    },
                    users: users,
                    processingTime: Date.now() - startTime
                };
            }

            // Check cache in bulk if enabled
            let cacheResults = {};
            if (useCache && !force) {
                const userIds = validUsers.map(user => user._id.toString());
                cacheResults = await redisClient.getPlatformDataBulk(userIds, platform);
                this.stats.cacheHits += Object.keys(cacheResults).length;
                this.stats.cacheMisses += userIds.length - Object.keys(cacheResults).length;
            }

            // Prepare operation function for concurrency limiter
            const updateOperation = async (user) => {
                const userId = user._id.toString();
                
                // Check if we have cached data for this user
                if (cacheResults[userId] && !force) {
                    const updatedUser = await this.applyCachedDataToUser(
                        user, 
                        platform, 
                        cacheResults[userId].data
                    );
                    return {
                        success: true,
                        user: updatedUser,
                        fromCache: true
                    };
                }

                // Fetch fresh data
                return await this.updateUserPlatformStats(user, platform, {
                    force: true, // Skip cache check since we already checked
                    useCache: true, // Still cache the result
                    throwError: false
                });
            };

            // Execute operations with concurrency control
            const bulkResults = await concurrencyLimiter.executePlatformOperations(
                validUsers,
                updateOperation,
                {
                    platform,
                    maxRetries,
                    batchSize,
                    skipFailures: true,
                    onProgress
                }
            );

            // Process results and update users map
            const updatedUsersMap = new Map();
            const results = {
                total: users.length,
                processed: bulkResults.totalProcessed,
                successful: bulkResults.successful.length,
                failed: bulkResults.failed.length,
                skipped: users.length - validUsers.length,
                fromCache: bulkResults.successful.filter(r => r.fromCache).length
            };

            // Map successful results
            bulkResults.successful.forEach(result => {
                updatedUsersMap.set(result.userId.toString(), result.data.user);
            });

            // Map failed results (keep original user data)
            bulkResults.failed.forEach(result => {
                const originalUser = validUsers.find(u => u._id.toString() === result.userId.toString());
                if (originalUser) {
                    updatedUsersMap.set(result.userId.toString(), originalUser);
                }
            });

            // Create final users array maintaining original order
            const finalUsers = users.map(user => {
                const userId = user._id.toString();
                return updatedUsersMap.get(userId) || user;
            });

            const totalProcessingTime = Date.now() - startTime;
            this.stats.totalProcessingTime += totalProcessingTime;

            logger.info(`Completed bulk ${platform} stats update`, {
                ...results,
                platform,
                processingTime: totalProcessingTime,
                avgTimePerUser: Math.round(totalProcessingTime / results.processed),
                successRate: Math.round((results.successful / results.processed) * 100)
            });

            return {
                success: true,
                platform,
                results,
                users: finalUsers,
                processingTime: totalProcessingTime,
                warnings: bulkResults.failed.map(f => ({
                    userId: f.userId,
                    username: f.username,
                    error: f.error,
                    code: f.code
                }))
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            logger.error(`Critical error in bulk ${platform} update`, {
                error: error.message,
                stack: error.stack,
                userCount: users.length,
                platform,
                processingTime
            });

            return {
                success: false,
                platform,
                error: {
                    code: error.code || 'BULK_UPDATE_ERROR',
                    message: error.message || 'Bulk update operation failed'
                },
                users,
                processingTime
            };
        }
    }

    /**
     * Update multiple platforms for a single user
     * @param {Object} user - User document
     * @param {Array} platforms - Array of platform names
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} - Multi-platform update results
     */
    async updateUserMultiplePlatforms(user, platforms, options = {}) {
        const { force = false, useCache = true } = options;
        const startTime = Date.now();

        logger.info(`Updating multiple platforms for user`, {
            userId: user._id,
            username: user.username,
            platforms,
            force,
            useCache
        });

        try {
            const results = {
                user: user,
                platforms: {},
                warnings: [],
                fromCache: {}
            };

            // Update each platform
            for (const platform of platforms) {
                if (!this.platformServices[platform]) {
                    results.warnings.push({
                        platform,
                        message: `Unsupported platform: ${platform}`,
                        code: 'UNSUPPORTED_PLATFORM'
                    });
                    continue;
                }

                const platformResult = await this.updateUserPlatformStats(user, platform, {
                    force,
                    useCache,
                    throwError: false
                });

                if (platformResult.success) {
                    results.user = platformResult.user;
                    results.platforms[platform] = platformResult.user.platforms[platform];
                    results.fromCache[platform] = platformResult.fromCache || false;
                } else {
                    results.warnings.push({
                        platform,
                        message: platformResult.error?.message || 'Update failed',
                        code: platformResult.error?.code || 'UPDATE_ERROR'
                    });
                }
            }

            const processingTime = Date.now() - startTime;

            logger.info(`Completed multi-platform update`, {
                userId: user._id,
                platforms,
                successfulPlatforms: Object.keys(results.platforms).length,
                warnings: results.warnings.length,
                processingTime
            });

            return {
                success: true,
                ...results,
                processingTime
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            logger.error(`Error in multi-platform update`, {
                userId: user._id,
                platforms,
                error: error.message,
                processingTime
            });

            return {
                success: false,
                user,
                error: {
                    code: error.code || 'MULTI_PLATFORM_ERROR',
                    message: error.message || 'Multi-platform update failed'
                },
                processingTime
            };
        }
    }

    /**
     * Apply cached data to user object
     * @param {Object} user - User document
     * @param {string} platform - Platform name
     * @param {Object} cachedData - Cached platform data
     * @returns {Promise<Object>} - Updated user document
     */
    async applyCachedDataToUser(user, platform, cachedData) {
        try {
            // Create update object for the specific platform
            const updateFields = {};
            Object.keys(cachedData).forEach(key => {
                updateFields[`platforms.${platform}.${key}`] = cachedData[key];
            });

            // Update user document in database
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { $set: updateFields },
                { new: true, runValidators: true }
            );

            return updatedUser || user;
        } catch (error) {
            logger.warn(`Failed to apply cached data to user`, {
                userId: user._id,
                platform,
                error: error.message
            });
            return user;
        }
    }

    /**
     * Invalidate cache for user(s)
     * @param {string|Array} userIds - User ID(s) to invalidate
     * @param {string} platform - Specific platform or null for all
     * @returns {Promise<boolean>} - Success status
     */
    async invalidateCache(userIds, platform = null) {
        try {
            const ids = Array.isArray(userIds) ? userIds : [userIds];
            
            if (platform) {
                // Invalidate specific platform for users
                const promises = ids.map(userId => 
                    redisClient.deletePlatformData(userId, platform)
                );
                await Promise.all(promises);
                logger.info(`Invalidated ${platform} cache for ${ids.length} users`);
            } else {
                // Invalidate all platforms for users
                const promises = ids.map(userId => 
                    redisClient.invalidateUserCache(userId)
                );
                await Promise.all(promises);
                logger.info(`Invalidated all platform cache for ${ids.length} users`);
            }

            return true;
        } catch (error) {
            logger.error('Cache invalidation failed', {
                userIds,
                platform,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Get service statistics
     * @returns {Object} - Service statistics
     */
    getStats() {
        return {
            ...this.stats,
            cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0
                ? Math.round((this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100)
                : 0,
            averageProcessingTime: this.stats.apiCalls > 0
                ? Math.round(this.stats.totalProcessingTime / this.stats.apiCalls)
                : 0,
            errorRate: this.stats.apiCalls > 0
                ? Math.round((this.stats.errors / this.stats.apiCalls) * 100)
                : 0,
            concurrencyStats: concurrencyLimiter.getStats()
        };
    }

    /**
     * Reset service statistics
     */
    resetStats() {
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            apiCalls: 0,
            errors: 0,
            totalProcessingTime: 0
        };
        concurrencyLimiter.resetStats();
        logger.info('Enhanced platform service stats reset');
    }

    // TODO: Job Queue Integration Stubs
    // Uncomment and implement when adding job queue (BullMQ, etc.)
    
    /*
    async queuePlatformUpdate(userId, platform, options = {}) {
        // Add platform update job to queue
        // const job = await platformUpdateQueue.add('updatePlatformStats', {
        //     userId,
        //     platform,
        //     options
        // }, {
        //     delay: options.delay || 0,
        //     attempts: options.attempts || 3,
        //     backoff: 'exponential'
        // });
        // return job.id;
    }

    async queueBulkPlatformUpdate(userIds, platform, options = {}) {
        // Add bulk update job to queue
        // const job = await platformUpdateQueue.add('bulkUpdatePlatformStats', {
        //     userIds,
        //     platform,
        //     options
        // }, {
        //     delay: options.delay || 0,
        //     attempts: options.attempts || 2,
        //     backoff: 'exponential'
        // });
        // return job.id;
    }

    async schedulePeriodicUpdates(schedule, platforms, options = {}) {
        // Schedule periodic platform updates
        // const job = await platformUpdateQueue.add('periodicPlatformUpdate', {
        //     platforms,
        //     options
        // }, {
        //     repeat: { cron: schedule },
        //     jobId: `periodic-${platforms.join('-')}`
        // });
        // return job.id;
    }
    */
}

// Create singleton instance
const enhancedPlatformService = new EnhancedPlatformService();

module.exports = enhancedPlatformService;