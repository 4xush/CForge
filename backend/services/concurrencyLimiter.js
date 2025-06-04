const pLimit = require('p-limit');
const winston = require('winston');

// Logger for concurrency operations
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/concurrency-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/concurrency-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

class ConcurrencyLimiter {
    constructor() {
        // Configure concurrency limits from environment variables
        this.limits = {
            platform: parseInt(process.env.PLATFORM_CONCURRENCY_LIMIT) || 5,  // Platform API calls
            database: parseInt(process.env.DATABASE_CONCURRENCY_LIMIT) || 10, // Database operations
            general: parseInt(process.env.GENERAL_CONCURRENCY_LIMIT) || 8,    // General operations
            external: parseInt(process.env.EXTERNAL_CONCURRENCY_LIMIT) || 3   // External API calls
        };

        // Create limiters for different operation types
        this.limiters = {
            platform: pLimit(this.limits.platform),
            database: pLimit(this.limits.database),
            general: pLimit(this.limits.general),
            external: pLimit(this.limits.external)
        };

        // Performance tracking
        this.stats = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            totalProcessingTime: 0
        };
    }

    /**
     * Execute platform data fetching operations with concurrency control
     * @param {Array} users - Array of user objects
     * @param {Function} fetchFunction - Function to fetch data for a single user
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} - Results with success/failure breakdown
     */
    async executePlatformOperations(users, fetchFunction, options = {}) {
        const {
            platform = 'unknown',
            maxRetries = 2,
            retryDelay = 1000,
            skipFailures = true,
            batchSize = null,
            onProgress = null
        } = options;

        const startTime = Date.now();
        const results = {
            successful: [],
            failed: [],
            skipped: [],
            totalProcessed: 0,
            processingTime: 0,
            platform
        };

        logger.info(`Starting platform operations for ${platform}`, {
            userCount: users.length,
            concurrencyLimit: this.limits.platform,
            maxRetries,
            batchSize: batchSize || 'unlimited'
        });

        try {
            // Process users in batches if specified
            const userBatches = batchSize ? this.createBatches(users, batchSize) : [users];
            
            for (let batchIndex = 0; batchIndex < userBatches.length; batchIndex++) {
                const batch = userBatches[batchIndex];
                logger.info(`Processing batch ${batchIndex + 1}/${userBatches.length} (${batch.length} users)`);

                const batchPromises = batch.map(user => 
                    this.limiters.platform(() => 
                        this.executeWithRetry(
                            () => fetchFunction(user),
                            maxRetries,
                            retryDelay,
                            `${platform}-${user._id || user.id || 'unknown'}`
                        )
                    )
                );

                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach((result, index) => {
                    const user = batch[index];
                    results.totalProcessed++;

                    if (result.status === 'fulfilled' && result.value.success) {
                        results.successful.push({
                            userId: user._id || user.id,
                            username: user.username,
                            data: result.value.data,
                            processingTime: result.value.processingTime
                        });
                        this.stats.successfulOperations++;
                    } else {
                        const error = result.status === 'rejected' ? result.reason : result.value.error;
                        const errorInfo = {
                            userId: user._id || user.id,
                            username: user.username,
                            error: error?.message || 'Unknown error',
                            code: error?.code || 'UNKNOWN_ERROR'
                        };

                        if (skipFailures) {
                            results.failed.push(errorInfo);
                            logger.warn(`Failed to process ${platform} for user`, errorInfo);
                        } else {
                            results.skipped.push(errorInfo);
                            logger.info(`Skipped ${platform} for user due to error`, errorInfo);
                        }
                        this.stats.failedOperations++;
                    }

                    // Progress callback
                    if (onProgress) {
                        onProgress({
                            completed: results.totalProcessed,
                            total: users.length,
                            successful: results.successful.length,
                            failed: results.failed.length,
                            platform
                        });
                    }
                });

                // Add delay between batches to prevent overwhelming external APIs
                if (batchIndex < userBatches.length - 1 && batchSize) {
                    await this.delay(500);
                }
            }

            results.processingTime = Date.now() - startTime;
            this.stats.totalOperations += results.totalProcessed;
            this.stats.totalProcessingTime += results.processingTime;

            logger.info(`Completed platform operations for ${platform}`, {
                totalProcessed: results.totalProcessed,
                successful: results.successful.length,
                failed: results.failed.length,
                processingTime: `${results.processingTime}ms`,
                avgTimePerUser: `${Math.round(results.processingTime / results.totalProcessed)}ms`
            });

            return results;

        } catch (error) {
            logger.error(`Critical error in platform operations for ${platform}`, {
                error: error.message,
                stack: error.stack,
                usersProcessed: results.totalProcessed,
                processingTime: Date.now() - startTime
            });

            results.processingTime = Date.now() - startTime;
            results.criticalError = {
                message: error.message,
                code: error.code || 'CRITICAL_ERROR'
            };

            return results;
        }
    }

    /**
     * Execute database operations with concurrency control
     * @param {Array} operations - Array of database operations
     * @param {Object} options - Configuration options
     * @returns {Promise<Array>} - Results array
     */
    async executeDatabaseOperations(operations, options = {}) {
        const { maxRetries = 1, retryDelay = 500 } = options;
        const startTime = Date.now();

        logger.info(`Starting database operations`, {
            operationCount: operations.length,
            concurrencyLimit: this.limits.database,
            maxRetries
        });

        try {
            const promises = operations.map((operation, index) =>
                this.limiters.database(() =>
                    this.executeWithRetry(
                        operation,
                        maxRetries,
                        retryDelay,
                        `db-operation-${index}`
                    )
                )
            );

            const results = await Promise.allSettled(promises);
            const processingTime = Date.now() - startTime;

            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.length - successful;

            logger.info(`Completed database operations`, {
                total: results.length,
                successful,
                failed,
                processingTime: `${processingTime}ms`
            });

            return results;

        } catch (error) {
            logger.error(`Critical error in database operations`, {
                error: error.message,
                processingTime: Date.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Execute operation with retry logic
     * @param {Function} operation - Operation to execute
     * @param {number} maxRetries - Maximum retry attempts
     * @param {number} retryDelay - Delay between retries in ms
     * @param {string} operationId - Identifier for logging
     * @returns {Promise<Object>} - Result object
     */
    async executeWithRetry(operation, maxRetries, retryDelay, operationId) {
        const startTime = Date.now();
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                return {
                    success: true,
                    data: result,
                    attempts: attempt + 1,
                    processingTime: Date.now() - startTime
                };
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
                    logger.warn(`Retry attempt ${attempt + 1} for ${operationId}`, {
                        error: error.message,
                        nextRetryIn: `${delay}ms`
                    });
                    await this.delay(delay);
                } else {
                    logger.error(`Operation failed after ${maxRetries + 1} attempts: ${operationId}`, {
                        error: error.message,
                        totalTime: Date.now() - startTime
                    });
                }
            }
        }

        return {
            success: false,
            error: lastError,
            attempts: maxRetries + 1,
            processingTime: Date.now() - startTime
        };
    }

    /**
     * Create batches from array
     * @param {Array} items - Items to batch
     * @param {number} batchSize - Size of each batch
     * @returns {Array<Array>} - Array of batches
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current statistics
     * @returns {Object} - Statistics object
     */
    getStats() {
        return {
            ...this.stats,
            averageProcessingTime: this.stats.totalOperations > 0 
                ? Math.round(this.stats.totalProcessingTime / this.stats.totalOperations)
                : 0,
            successRate: this.stats.totalOperations > 0
                ? Math.round((this.stats.successfulOperations / this.stats.totalOperations) * 100)
                : 0,
            activeLimiters: {
                platform: this.limiters.platform.activeCount,
                database: this.limiters.database.activeCount,
                general: this.limiters.general.activeCount,
                external: this.limiters.external.activeCount
            },
            pendingCounts: {
                platform: this.limiters.platform.pendingCount,
                database: this.limiters.database.pendingCount,
                general: this.limiters.general.pendingCount,
                external: this.limiters.external.pendingCount
            }
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            totalProcessingTime: 0
        };
        logger.info('Concurrency limiter stats reset');
    }

    /**
     * Update concurrency limits dynamically
     * @param {Object} newLimits - New limit values
     */
    updateLimits(newLimits) {
        Object.keys(newLimits).forEach(key => {
            if (this.limits[key] !== undefined && newLimits[key] > 0) {
                this.limits[key] = newLimits[key];
                this.limiters[key] = pLimit(newLimits[key]);
                logger.info(`Updated ${key} concurrency limit to ${newLimits[key]}`);
            }
        });
    }
}

// Create singleton instance
const concurrencyLimiter = new ConcurrencyLimiter();

module.exports = concurrencyLimiter;