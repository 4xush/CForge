const mongoose = require('mongoose');
const serviceInitializer = require('../services/initialization/serviceInitializer');
const redisClient = require('../services/cache/redisClient');
const enhancedPlatformService = require('../services/enhancedPlatformService');
const concurrencyLimiter = require('../services/concurrencyLimiter');
const { healthCheck: rateLimitHealthCheck } = require('../middleware/rateLimiting/rateLimitMiddleware');
const winston = require('winston');

// Logger for health checks
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/health-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/health-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

/**
 * Basic health check endpoint
 */
exports.getHealth = async (req, res) => {
    try {
        const health = await serviceInitializer.getHealthCheck();
        
        const isHealthy = health.health === 'healthy';
        const statusCode = isHealthy ? 200 : 503;

        res.status(statusCode).json({
            status: isHealthy ? 'ok' : 'degraded',
            timestamp: health.timestamp,
            uptime: health.uptime,
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
};

/**
 * Detailed health check with service breakdown
 */
exports.getDetailedHealth = async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Get comprehensive health data
        const serviceHealth = await serviceInitializer.getHealthCheck();
        const dbHealth = await checkDatabaseHealth();
        const rateLimitHealth = await rateLimitHealthCheck();
        
        const healthData = {
            status: serviceHealth.health,
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime,
            system: {
                uptime: serviceHealth.uptime,
                memory: serviceHealth.memoryUsage,
                nodeVersion: serviceHealth.nodeVersion,
                environment: process.env.NODE_ENV || 'development',
                version: process.env.npm_package_version || '1.0.0'
            },
            services: {
                ...serviceHealth.services,
                database: dbHealth,
                rateLimiting: rateLimitHealth
            },
            initialized: serviceHealth.initialized,
            shuttingDown: serviceHealth.shuttingDown
        };

        // Determine overall status
        const allServicesHealthy = Object.values(healthData.services).every(service => 
            ['connected', 'ready', 'healthy'].includes(service.status)
        );

        const statusCode = allServicesHealthy ? 200 : 503;
        
        res.status(statusCode).json(healthData);
        
    } catch (error) {
        logger.error('Detailed health check failed', { 
            error: error.message,
            stack: error.stack 
        });
        
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Detailed health check failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Platform service statistics endpoint
 */
exports.getPlatformServiceStats = async (req, res) => {
    try {
        const enhancedStats = enhancedPlatformService.getStats();
        const concurrencyStats = concurrencyLimiter.getStats();
        
        let redisStats = null;
        if (redisClient.isReady()) {
            redisStats = await redisClient.healthCheck();
        }

        const stats = {
            timestamp: new Date().toISOString(),
            platformService: enhancedStats,
            concurrency: concurrencyStats,
            cache: redisStats,
            performance: {
                averageProcessingTime: enhancedStats.averageProcessingTime,
                cacheHitRate: enhancedStats.cacheHitRate,
                errorRate: enhancedStats.errorRate,
                successRate: concurrencyStats.successRate
            }
        };

        res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        logger.error('Platform service stats error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to get platform service statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Redis cache status and statistics
 */
exports.getCacheStatus = async (req, res) => {
    try {
        if (!redisClient.isReady()) {
            return res.status(503).json({
                status: 'disconnected',
                message: 'Redis cache is not available',
                connected: false
            });
        }

        const health = await redisClient.healthCheck();
        const enhancedStats = enhancedPlatformService.getStats();
        
        const cacheStats = {
            status: health.status,
            connected: health.connected,
            latency: health.latency,
            cacheHits: enhancedStats.cacheHits,
            cacheMisses: enhancedStats.cacheMisses,
            hitRate: enhancedStats.cacheHitRate,
            timestamp: new Date().toISOString()
        };

        res.status(200).json(cacheStats);

    } catch (error) {
        logger.error('Cache status check failed', { error: error.message });
        res.status(503).json({
            status: 'error',
            connected: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Database connectivity check
 */
exports.getDatabaseStatus = async (req, res) => {
    try {
        const dbHealth = await checkDatabaseHealth();
        const statusCode = dbHealth.status === 'connected' ? 200 : 503;
        
        res.status(statusCode).json(dbHealth);
        
    } catch (error) {
        logger.error('Database status check failed', { error: error.message });
        res.status(503).json({
            status: 'error',
            connected: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Service restart endpoint (admin only)
 */
exports.restartService = async (req, res) => {
    try {
        const { serviceName } = req.params;
        const { secretKey } = req.body;

        // Verify admin access
        if (secretKey !== process.env.OWNER_SECRET_KEY) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Invalid secret key'
            });
        }

        logger.info(`Service restart requested: ${serviceName}`, {
            requesterId: req.user?.id || 'anonymous',
            ip: req.ip
        });

        const success = await serviceInitializer.restartService(serviceName);
        
        if (success) {
            res.status(200).json({
                success: true,
                message: `Service ${serviceName} restarted successfully`,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                message: `Failed to restart service ${serviceName}`,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        logger.error('Service restart failed', { 
            serviceName: req.params.serviceName,
            error: error.message 
        });
        
        res.status(500).json({
            success: false,
            message: 'Service restart failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Readiness probe (for Kubernetes/Docker)
 */
exports.getReadiness = async (req, res) => {
    try {
        const isReady = serviceInitializer.getServiceStatus().initialized;
        
        if (isReady) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                status: 'not_ready',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Liveness probe (for Kubernetes/Docker)
 */
exports.getLiveness = async (req, res) => {
    try {
        const serviceStatus = serviceInitializer.getServiceStatus();
        
        if (!serviceStatus.shuttingDown) {
            res.status(200).json({
                status: 'alive',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                status: 'shutting_down',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Helper function to check database health
 */
const checkDatabaseHealth = async () => {
    try {
        const startTime = Date.now();
        
        // Check MongoDB connection
        const dbState = mongoose.connection.readyState;
        const stateMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        if (dbState === 1) {
            // Perform a simple query to test responsiveness
            await mongoose.connection.db.admin().ping();
            
            const responseTime = Date.now() - startTime;
            
            return {
                status: 'connected',
                state: stateMap[dbState],
                responseTime: `${responseTime}ms`,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name,
                timestamp: new Date().toISOString()
            };
        } else {
            return {
                status: 'disconnected',
                state: stateMap[dbState],
                timestamp: new Date().toISOString()
            };
        }
        
    } catch (error) {
        return {
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};