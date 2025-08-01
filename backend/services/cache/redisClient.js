const redis = require("redis")
const winston = require("winston")

// Logger for Redis operations
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: "logs/redis-error.log", level: "error" }),
        new winston.transports.File({ filename: "logs/redis-combined.log" }),
    ],
})

if (process.env.NODE_ENV !== "production") {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }))
}

class RedisClient {
    constructor() {
        this.client = null
        this.isConnected = false
        this.retryAttempts = 0
        this.maxRetries = 3
        this.connectionPromise = null // Track connection promise to prevent duplicates
        this.isConnecting = false // Track connection state

        // Cache TTL configurations (in seconds)
        this.ttlConfig = {
            leetcode: Number.parseInt(process.env.LEETCODE_CACHE_TTL) || 1800, // 30 minutes
            github: Number.parseInt(process.env.GITHUB_CACHE_TTL) || 1800, // 30 minutes
            codeforces: Number.parseInt(process.env.CODEFORCES_CACHE_TTL) || 1800, // 30 minutes
            contests: Number.parseInt(process.env.CONTESTS_CACHE_TTL) || 600, // 10 minutes for contests
            default: Number.parseInt(process.env.DEFAULT_CACHE_TTL) || 900, // 15 minutes
        }
    }

    async connect() {
        // If already connected, return true
        if (this.isConnected && this.client?.isReady) {
            logger.info("Redis: Already connected and ready")
            return true
        }

        // If connection is in progress, wait for it
        if (this.isConnecting && this.connectionPromise) {
            logger.info("Redis: Connection already in progress, waiting...")
            return await this.connectionPromise
        }

        // Start new connection
        this.isConnecting = true
        this.connectionPromise = this._performConnection()

        try {
            const result = await this.connectionPromise
            return result
        } finally {
            this.isConnecting = false
            this.connectionPromise = null
        }
    }

    async _performConnection() {
        try {
            logger.info("Redis: Starting connection attempt...")

            // If client exists but not connected, clean it up first
            if (this.client && !this.isConnected) {
                try {
                    await this.client.quit()
                } catch (error) {
                    // Ignore cleanup errors
                }
                this.client = null
            }

            const redisConfig = {
                username: process.env.REDIS_USERNAME,
                password: process.env.REDIS_PASSWORD,
                socket: {
                    host: process.env.REDIS_HOST,
                    port: Number.parseInt(process.env.REDIS_PORT),
                    connectTimeout: 10000,
                    lazyConnect: true,
                    reconnectStrategy: (retries) => {
                        if (retries > 3) {
                            logger.error("Redis: Max reconnection attempts reached");
                            return false;
                        }
                        return Math.min(retries * 50, 500);
                    },
                },
            };

            logger.info("Redis: Creating client with cloud config", {
                host: redisConfig.host,
                port: redisConfig.port,
                username: redisConfig.username,
            })

            this.client = redis.createClient(redisConfig)

            // Event handlers
            this.client.on("connect", () => {
                logger.info("Redis: Connected successfully to cloud instance")
                this.isConnected = true
            })

            this.client.on("ready", () => {
                logger.info("Redis: Ready to accept commands")
            })

            this.client.on("error", (error) => {
                logger.error("Redis: Connection error", {
                    error: error.message,
                    stack: error.stack,
                    code: error.code,
                })
                this.isConnected = false
            })

            this.client.on("end", () => {
                logger.warn("Redis: Connection ended")
                this.isConnected = false
            })

            this.client.on("reconnecting", () => {
                logger.info("Redis: Attempting to reconnect...")
                this.isConnected = false
            })

            logger.info("Redis: Attempting to connect to cloud instance...")
            await this.client.connect()
            logger.info("Redis: Connect call completed")

            // Test the connection
            logger.info("Redis: Testing connection with PING...")
            const pingResult = await this.client.ping()
            logger.info("Redis: PING result received", { result: pingResult })

            if (pingResult === "PONG") {
                logger.info("Redis: Cloud connection established and tested successfully")
                this.isConnected = true
                return true
            } else {
                throw new Error("Redis ping failed")
            }
        } catch (error) {
            logger.error("Redis: Failed to connect to cloud instance", {
                error: error.message,
                stack: error.stack,
                code: error.code,
            })
            this.isConnected = false

            // Clean up failed client
            if (this.client) {
                try {
                    await this.client.quit()
                } catch (cleanupError) {
                    // Ignore cleanup errors
                }
                this.client = null
            }

            return false
        }
    }

    async disconnect() {
        try {
            if (this.client) {
                await this.client.quit()
                logger.info("Redis: Disconnected gracefully")
                this.isConnected = false
                this.client = null
            }
        } catch (error) {
            logger.error("Redis: Error during disconnect", { error: error.message })
        }
    }

    isReady() {
        return this.isConnected && this.client?.isReady
    }

    // Contest-specific caching methods
    async getContestData(platform) {
        try {
            if (!this.isReady()) {
                return null
            }

            const key = `contests:${platform}`
            const cachedData = await this.client.get(key)

            if (cachedData) {
                const parsed = JSON.parse(cachedData)
                logger.debug(`Redis: Cache hit for ${platform} contests`)
                return parsed
            }

            logger.debug(`Redis: Cache miss for ${platform} contests`)
            return null
        } catch (error) {
            logger.error("Redis: Error getting contest data", {
                error: error.message,
                platform,
            })
            return null
        }
    }

    async setContestData(platform, data, customTTL = null) {
        try {
            if (!this.isReady()) {
                logger.warn("Redis: Not ready, skipping contest cache set")
                return false
            }

            const key = `contests:${platform}`
            const ttl = customTTL || this.ttlConfig.contests

            // Add metadata to cached data
            const cacheData = {
                ...data,
                cachedAt: new Date().toISOString(),
                platform,
            }

            await this.client.setEx(key, ttl, JSON.stringify(cacheData))
            logger.debug(`Redis: Cached ${platform} contest data`, {
                platform,
                ttl,
                ongoingCount: data.ongoing?.length || 0,
                upcomingCount: data.upcoming?.length || 0,
            })

            return true
        } catch (error) {
            logger.error("Redis: Error setting contest data", {
                error: error.message,
                platform,
            })
            return false
        }
    }

    // Platform data caching methods (keeping your existing methods)
    async getPlatformData(userId, platform) {
        try {
            if (!this.isReady()) {
                return null
            }

            const key = this.generatePlatformKey(userId, platform)
            const cachedData = await this.client.get(key)

            if (cachedData) {
                const parsed = JSON.parse(cachedData)
                logger.debug(`Redis: Cache hit for ${platform} data`, { userId, platform })
                return parsed
            }

            logger.debug(`Redis: Cache miss for ${platform} data`, { userId, platform })
            return null
        } catch (error) {
            logger.error("Redis: Error getting platform data", {
                error: error.message,
                userId,
                platform,
            })
            return null
        }
    }

    async setPlatformData(userId, platform, data, customTTL = null) {
        try {
            if (!this.isReady()) {
                logger.warn("Redis: Not ready, skipping cache set")
                return false
            }

            const key = this.generatePlatformKey(userId, platform)
            const ttl = customTTL || this.ttlConfig[platform] || this.ttlConfig.default

            // Add metadata to cached data
            const cacheData = {
                data,
                cachedAt: new Date().toISOString(),
                platform,
                userId: userId.toString(),
            }

            await this.client.setEx(key, ttl, JSON.stringify(cacheData))
            logger.debug(`Redis: Cached ${platform} data`, {
                userId,
                platform,
                ttl,
                dataSize: JSON.stringify(data).length,
            })

            return true
        } catch (error) {
            logger.error("Redis: Error setting platform data", {
                error: error.message,
                userId,
                platform,
            })
            return false
        }
    }

    async deletePlatformData(userId, platform) {
        try {
            if (!this.isReady()) {
                return false
            }

            const key = this.generatePlatformKey(userId, platform)
            const result = await this.client.del(key)

            if (result > 0) {
                logger.debug(`Redis: Deleted ${platform} cache`, { userId, platform })
                return true
            }

            return false
        } catch (error) {
            logger.error("Redis: Error deleting platform data", {
                error: error.message,
                userId,
                platform,
            })
            return false
        }
    }

    async invalidateUserCache(userId) {
        try {
            if (!this.isReady()) {
                return false
            }

            const platforms = ["leetcode", "github", "codeforces"]
            const deletePromises = platforms.map((platform) => this.deletePlatformData(userId, platform))

            await Promise.all(deletePromises)
            logger.info(`Redis: Invalidated all platform cache for user`, { userId })
            return true
        } catch (error) {
            logger.error("Redis: Error invalidating user cache", {
                error: error.message,
                userId,
            })
            return false
        }
    }

    // Rate limiting helpers
    async checkRateLimit(key, limit, windowSeconds) {
        try {
            if (!this.isReady()) {
                return { allowed: true, remaining: limit, reset: Date.now() + windowSeconds * 1000 } // Allow if Redis is down
            }

            const multi = this.client.multi()
            multi.incr(key)
            multi.expire(key, windowSeconds)
            multi.ttl(key)

            const results = await multi.exec()
            const current = results[0]
            const ttl = results[2]

            const remaining = Math.max(0, limit - current)
            const allowed = current <= limit
            const resetTime = ttl > 0 ? Date.now() + ttl * 1000 : Date.now() + windowSeconds * 1000

            return { allowed, remaining, current, reset: resetTime }
        } catch (error) {
            logger.error("Redis: Error checking rate limit", { error: error.message, key })
            return { allowed: true, remaining: limit, reset: Date.now() + windowSeconds * 1000 } // Allow if error
        }
    }

    // Bulk operations for performance
    async getPlatformDataBulk(userIds, platform) {
        try {
            if (!this.isReady() || !userIds.length) {
                return {}
            }

            const keys = userIds.map((userId) => this.generatePlatformKey(userId, platform))
            const values = await this.client.mGet(keys)

            const result = {}
            userIds.forEach((userId, index) => {
                if (values[index]) {
                    try {
                        result[userId] = JSON.parse(values[index])
                    } catch (parseError) {
                        logger.warn("Redis: Failed to parse cached data", { userId, platform })
                    }
                }
            })

            logger.debug(`Redis: Bulk cache retrieval`, {
                platform,
                requested: userIds.length,
                found: Object.keys(result).length,
            })

            return result
        } catch (error) {
            logger.error("Redis: Error in bulk platform data retrieval", {
                error: error.message,
                platform,
            })
            return {}
        }
    }

    async setPlatformDataBulk(platformDataMap, platform, customTTL = null) {
        try {
            if (!this.isReady() || !Object.keys(platformDataMap).length) {
                return false
            }

            const ttl = customTTL || this.ttlConfig[platform] || this.ttlConfig.default
            const multi = this.client.multi()

            Object.entries(platformDataMap).forEach(([userId, data]) => {
                const key = this.generatePlatformKey(userId, platform)
                const cacheData = {
                    data,
                    cachedAt: new Date().toISOString(),
                    platform,
                    userId,
                }
                multi.setEx(key, ttl, JSON.stringify(cacheData))
            })

            await multi.exec()
            logger.info(`Redis: Bulk cached ${platform} data`, {
                count: Object.keys(platformDataMap).length,
                platform,
                ttl,
            })

            return true
        } catch (error) {
            logger.error("Redis: Error in bulk platform data storage", {
                error: error.message,
                platform,
            })
            return false
        }
    }

    // Generic cache methods
    async get(key) {
        try {
            if (!this.isReady()) return null
            return await this.client.get(key)
        } catch (error) {
            logger.error("Redis: Error getting key", { error: error.message, key })
            return null
        }
    }

    async set(key, value, ttl = null) {
        try {
            if (!this.isReady()) return false
            if (ttl) {
                await this.client.setEx(key, ttl, value)
            } else {
                await this.client.set(key, value)
            }
            return true
        } catch (error) {
            logger.error("Redis: Error setting key", { error: error.message, key })
            return false
        }
    }

    async del(key) {
        try {
            if (!this.isReady()) return false
            const result = await this.client.del(key)
            return result > 0
        } catch (error) {
            logger.error("Redis: Error deleting key", { error: error.message, key })
            return false
        }
    }

    // Helper methods
    generatePlatformKey(userId, platform) {
        return `platform:${platform}:${userId}`
    }

    generateRateLimitKey(identifier, endpoint) {
        return `ratelimit:${endpoint}:${identifier}`
    }

    // Health check
    async healthCheck() {
        try {
            if (!this.isReady()) {
                return { status: "disconnected", error: "Redis not connected" }
            }

            const start = Date.now()
            await this.client.ping()
            const latency = Date.now() - start

            return {
                status: "healthy",
                latency: `${latency}ms`,
                connected: this.isConnected,
            }
        } catch (error) {
            return {
                status: "error",
                error: error.message,
                connected: this.isConnected,
            }
        }
    }
}

// Create singleton instance
const redisClient = new RedisClient()

// REMOVED: Auto-connection on module load
// The ServiceInitializer will handle the connection

// Graceful shutdown handling
process.on("SIGINT", async () => {
    console.log("Redis: Received SIGINT, closing connection...")
    await redisClient.disconnect()
    process.exit(0)
})

process.on("SIGTERM", async () => {
    console.log("Redis: Received SIGTERM, closing connection...")
    await redisClient.disconnect()
    process.exit(0)
})

module.exports = redisClient