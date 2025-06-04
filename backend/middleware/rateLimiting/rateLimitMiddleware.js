const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../../services/cache/redisClient');
const winston = require('winston');

// Logger for rate limiting operations
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/ratelimit-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/ratelimit-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// Rate limit configurations
const rateLimitConfigs = {
    // Authentication endpoints
    auth: {
        windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        limit: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 attempts per window
        message: {
            error: 'Too many authentication attempts, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Don't count successful logins
        skipFailedRequests: false // Count failed attempts
    },

    // Platform refresh endpoints
    platformRefresh: {
        windowMs: parseInt(process.env.PLATFORM_REFRESH_WINDOW) || 10 * 60 * 1000, // 10 minutes
        limit: parseInt(process.env.PLATFORM_REFRESH_MAX) || 1, // 1 request per window
        message: {
            error: 'Platform refresh rate limit exceeded. Please wait before refreshing again.',
            retryAfter: '10 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            // Rate limit per user for individual refreshes, per room for room refreshes
            if (req.params.roomId) {
                return `platform-refresh:room:${req.params.roomId}`;
            }
            return `platform-refresh:user:${req.user?.id || req.ip}`;
        }
    },

    // Room operations (create, join, etc.)
    roomOperations: {
        windowMs: parseInt(process.env.ROOM_OPERATIONS_WINDOW) || 5 * 60 * 1000, // 5 minutes
        limit: parseInt(process.env.ROOM_OPERATIONS_MAX) || 10, // 10 operations per window
        message: {
            error: 'Too many room operations, please slow down.',
            retryAfter: '5 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => `room-ops:${req.user?.id || req.ip}`
    },

    // Message sending
    messaging: {
        windowMs: parseInt(process.env.MESSAGING_RATE_WINDOW) || 1 * 60 * 1000, // 1 minute
        limit: parseInt(process.env.MESSAGING_RATE_MAX) || 30, // 30 messages per minute
        message: {
            error: 'Too many messages sent, please slow down.',
            retryAfter: '1 minute'
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => `messaging:${req.user?.id || req.ip}`
    },

    // API endpoints (general)
    api: {
        windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        limit: parseInt(process.env.API_RATE_LIMIT_MAX) || 100, // 100 requests per window
        message: {
            error: 'API rate limit exceeded, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => `api:${req.user?.id || req.ip}`
    },

    // Strict rate limiting for sensitive operations
    strict: {
        windowMs: parseInt(process.env.STRICT_RATE_LIMIT_WINDOW) || 1 * 60 * 1000, // 1 minute
        limit: parseInt(process.env.STRICT_RATE_LIMIT_MAX) || 3, // 3 requests per minute
        message: {
            error: 'Rate limit exceeded for sensitive operation.',
            retryAfter: '1 minute'
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => `strict:${req.user?.id || req.ip}`
    }
};

// Custom Redis store factory
const createRedisStore = () => {
    try {
        if (redisClient.isReady()) {
            return new RedisStore({
                client: redisClient.client,
                prefix: 'ratelimit:',
            });
        }
    } catch (error) {
        logger.warn('Redis store not available for rate limiting, using memory store', {
            error: error.message
        });
    }
    return undefined; // Will use default memory store
};

// Enhanced rate limiter factory
const createRateLimiter = (config, options = {}) => {
    const enhancedConfig = {
        ...config,
        store: options.useRedis !== false ? createRedisStore() : undefined,
        handler: (req, res) => {
            const rateLimitInfo = {
                ip: req.ip,
                userId: req.user?.id,
                endpoint: req.originalUrl,
                method: req.method,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            };

            logger.warn('Rate limit exceeded', rateLimitInfo);

            // Enhanced error response
            res.status(429).json({
                success: false,
                error: config.message.error,
                retryAfter: config.message.retryAfter,
                limit: {
                    limit: config.limit,
                    windowMs: config.windowMs,
                    resetTime: new Date(Date.now() + config.windowMs).toISOString()
                },
                debug: process.env.NODE_ENV === 'development' ? rateLimitInfo : undefined
            });
        },

        skip: (req) => {
            // Skip rate limiting for health checks
            if (req.path === '/health' || req.path === '/ping') {
                return true;
            }
            
            // Skip for certain user roles if specified
            if (options.skipForRoles && req.user?.role) {
                return options.skipForRoles.includes(req.user.role);
            }
            
            return false;
        },
        // Add request context to headers and handle rate limit logging
        onHit: (req, res, options) => {
            if (process.env.NODE_ENV === 'development') {
                res.set('X-RateLimit-Context', JSON.stringify({
                    endpoint: req.originalUrl,
                    userId: req.user?.id,
                    timestamp: new Date().toISOString()
                }));
            }
            
            // Log when approaching rate limit
            const remaining = parseInt(res.getHeader('X-RateLimit-Remaining') || '0');
            if (remaining <= 1) {
                logger.warn('Rate limit threshold reached', {
                    ip: req.ip,
                    userId: req.user?.id,
                    endpoint: req.originalUrl,
                    limit: options.limit,
                    windowMs: options.windowMs,
                    remaining: remaining
                });
            }
        }
    };

    return rateLimit(enhancedConfig);
};

// Pre-configured rate limiters
const rateLimiters = {
    // Authentication rate limiter
    auth: createRateLimiter(rateLimitConfigs.auth, {
        useRedis: true
    }),

    // Platform refresh rate limiter
    platformRefresh: createRateLimiter(rateLimitConfigs.platformRefresh, {
        useRedis: true
    }),

    // Room operations rate limiter
    roomOperations: createRateLimiter(rateLimitConfigs.roomOperations, {
        useRedis: true
    }),

    // Messaging rate limiter
    messaging: createRateLimiter(rateLimitConfigs.messaging, {
        useRedis: true
    }),

    // General API rate limiter
    api: createRateLimiter(rateLimitConfigs.api, {
        useRedis: true
    }),

    // Strict rate limiter for sensitive operations
    strict: createRateLimiter(rateLimitConfigs.strict, {
        useRedis: true
    })
};

// Dynamic rate limiter for custom configurations
const createDynamicRateLimiter = (customConfig, options = {}) => {
    const config = {
        ...rateLimitConfigs.api, // Default base config
        ...customConfig
    };
    return createRateLimiter(config, options);
};

// Middleware for bypassing rate limits in development
const developmentBypass = (req, res, next) => {
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMITING === 'true') {
        logger.debug('Rate limiting bypassed in development mode');
        return next();
    }
    next();
};

// Conditional rate limiter that applies different limits based on conditions
const conditionalRateLimiter = (conditions) => {
    return (req, res, next) => {
        // Apply development bypass first
        if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMITING === 'true') {
            return next();
        }

        // Find matching condition
        const matchingCondition = conditions.find(condition => {
            if (condition.path && !req.path.match(condition.path)) return false;
            if (condition.method && req.method !== condition.method) return false;
            if (condition.userRole && req.user?.role !== condition.userRole) return false;
            if (condition.custom && !condition.custom(req)) return false;
            return true;
        });

        if (matchingCondition) {
            const limiter = rateLimiters[matchingCondition.limiter] || rateLimiters.api;
            return limiter(req, res, next);
        }

        // Default to API rate limiter if no specific condition matches
        return rateLimiters.api(req, res, next);
    };
};

// IP-based rate limiter for anonymous requests
const ipRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // 50 requests per IP per window
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    keyGenerator: (req) => `ip:${req.ip}`,
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for user registration to prevent spam accounts
const registrationRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 3, // 3 registrations per IP per hour
    message: {
        error: 'Too many registration attempts from this IP, please try again later.',
        retryAfter: '1 hour'
    },
    keyGenerator: (req) => `registration:${req.ip}`,
    standardHeaders: true,
    legacyHeaders: false
});

// Password reset rate limiter
const passwordResetRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // 5 password reset attempts per IP per hour
    message: {
        error: 'Too many password reset attempts, please try again later.',
        retryAfter: '1 hour'
    },
    keyGenerator: (req) => `password-reset:${req.ip}`,
    standardHeaders: true,
    legacyHeaders: false
});

// Health check for rate limiting system
const healthCheck = async () => {
    try {
        const redisHealth = await redisClient.healthCheck();
        return {
            status: 'healthy',
            redis: redisHealth,
            rateLimiters: {
                configured: Object.keys(rateLimiters),
                redisEnabled: redisClient.isReady()
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = {
    // Pre-configured rate limiters
    auth: rateLimiters.auth,
    platformRefresh: rateLimiters.platformRefresh,
    roomOperations: rateLimiters.roomOperations,
    messaging: rateLimiters.messaging,
    api: rateLimiters.api,
    strict: rateLimiters.strict,
    
    // Special purpose rate limiters
    ipRateLimiter,
    registrationRateLimiter,
    passwordResetRateLimiter,
    
    // Utility functions
    createDynamicRateLimiter,
    conditionalRateLimiter,
    developmentBypass,
    healthCheck,
    
    // Rate limit configurations for reference
    configs: rateLimitConfigs
};