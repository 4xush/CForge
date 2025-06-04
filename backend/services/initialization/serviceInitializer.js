const winston = require('winston');
const redisClient = require('../cache/redisClient');
const enhancedPlatformService = require('../enhancedPlatformService');
const concurrencyLimiter = require('../concurrencyLimiter');

// Logger for service initialization
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/initialization-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/initialization-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ 
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

class ServiceInitializer {
    constructor() {
        this.services = new Map();
        this.initializationOrder = [
            'redis',
            'concurrencyLimiter',
            'enhancedPlatformService'
        ];
        this.initialized = false;
        this.shuttingDown = false;
    }

    /**
     * Initialize all services in proper order
     * @returns {Promise<boolean>} - Success status
     */
    async initializeServices() {
        if (this.initialized) {
            logger.warn('Services already initialized');
            return true;
        }

        logger.info('Starting service initialization...');
        const startTime = Date.now();

        try {
            // Initialize Redis first (other services depend on it)
            await this.initializeRedis();
            
            // Initialize concurrency limiter
            await this.initializeConcurrencyLimiter();
            
            // Initialize enhanced platform service
            await this.initializeEnhancedPlatformService();

            // Validate all services are working
            await this.validateServices();

            this.initialized = true;
            const initTime = Date.now() - startTime;
            
            logger.info('All services initialized successfully', {
                initializationTime: `${initTime}ms`,
                services: Array.from(this.services.keys())
            });

            // Set up graceful shutdown handlers
            this.setupShutdownHandlers();

            return true;

        } catch (error) {
            logger.error('Service initialization failed', {
                error: error.message,
                stack: error.stack,
                initializationTime: Date.now() - startTime
            });

            // Cleanup any partially initialized services
            await this.cleanup();
            return false;
        }
    }

    /**
     * Initialize Redis service
     */
    async initializeRedis() {
        logger.info('Initializing Redis service...');
        
        try {
            // Try to connect with a timeout
            const connectPromise = redisClient.connect();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Redis initialization timeout')), 30000);
            });

            const connected = await Promise.race([connectPromise, timeoutPromise]);
            
            if (connected) {
                this.services.set('redis', {
                    instance: redisClient,
                    status: 'connected',
                    initializedAt: new Date()
                });
                logger.info('Redis service initialized successfully');
            } else {
                throw new Error('Redis connection failed');
            }
        } catch (error) {
            // Redis is optional - continue without it but log the issue
            logger.warn('Redis initialization failed, continuing without cache', {
                error: error.message,
                stack: error.stack
            });
            
            this.services.set('redis', {
                instance: null,
                status: 'failed',
                error: error.message,
                initializedAt: new Date()
            });
        }
    }

    /**
     * Initialize concurrency limiter
     */
    async initializeConcurrencyLimiter() {
        logger.info('Initializing concurrency limiter...');
        
        try {
            // Concurrency limiter doesn't need async initialization
            this.services.set('concurrencyLimiter', {
                instance: concurrencyLimiter,
                status: 'ready',
                initializedAt: new Date()
            });
            
            logger.info('Concurrency limiter initialized successfully', {
                limits: concurrencyLimiter.limits
            });
        } catch (error) {
            logger.error('Concurrency limiter initialization failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Initialize enhanced platform service
     */
    async initializeEnhancedPlatformService() {
        logger.info('Initializing enhanced platform service...');
        
        try {
            // Enhanced platform service doesn't need async initialization
            this.services.set('enhancedPlatformService', {
                instance: enhancedPlatformService,
                status: 'ready',
                initializedAt: new Date()
            });
            
            logger.info('Enhanced platform service initialized successfully');
        } catch (error) {
            logger.error('Enhanced platform service initialization failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Validate all services are working properly
     */
    async validateServices() {
        logger.info('Validating services...');
        
        const validationResults = [];

        // Validate Redis if available
        const redisService = this.services.get('redis');
        if (redisService && redisService.status === 'connected') {
            try {
                const healthCheck = await redisClient.healthCheck();
                validationResults.push({
                    service: 'redis',
                    status: healthCheck.status,
                    details: healthCheck
                });
            } catch (error) {
                validationResults.push({
                    service: 'redis',
                    status: 'validation_failed',
                    error: error.message
                });
            }
        }

        // Validate concurrency limiter
        try {
            const stats = concurrencyLimiter.getStats();
            validationResults.push({
                service: 'concurrencyLimiter',
                status: 'healthy',
                stats
            });
        } catch (error) {
            validationResults.push({
                service: 'concurrencyLimiter',
                status: 'validation_failed',
                error: error.message
            });
        }

        // Validate enhanced platform service
        try {
            const stats = enhancedPlatformService.getStats();
            validationResults.push({
                service: 'enhancedPlatformService',
                status: 'healthy',
                stats
            });
        } catch (error) {
            validationResults.push({
                service: 'enhancedPlatformService',
                status: 'validation_failed',
                error: error.message
            });
        }

        logger.info('Service validation completed', { validationResults });

        // Check for critical failures
        const criticalFailures = validationResults.filter(r => 
            r.status === 'validation_failed' && 
            ['concurrencyLimiter', 'enhancedPlatformService'].includes(r.service)
        );

        if (criticalFailures.length > 0) {
            throw new Error(`Critical service validation failures: ${criticalFailures.map(f => f.service).join(', ')}`);
        }
    }

    /**
     * Get service status
     * @returns {Object} - Service status information
     */
    getServiceStatus() {
        const status = {
            initialized: this.initialized,
            shuttingDown: this.shuttingDown,
            services: {},
            health: 'unknown'
        };

        for (const [serviceName, serviceInfo] of this.services) {
            status.services[serviceName] = {
                status: serviceInfo.status,
                initializedAt: serviceInfo.initializedAt,
                error: serviceInfo.error
            };
        }

        // Determine overall health
        const serviceStatuses = Object.values(status.services).map(s => s.status);
        if (serviceStatuses.every(s => ['connected', 'ready', 'healthy'].includes(s))) {
            status.health = 'healthy';
        } else if (serviceStatuses.some(s => s === 'failed')) {
            status.health = 'degraded';
        } else {
            status.health = 'unhealthy';
        }

        return status;
    }

    /**
     * Health check endpoint data
     * @returns {Promise<Object>} - Health check data
     */
    async getHealthCheck() {
        const baseStatus = this.getServiceStatus();
        
        // Get real-time health from services that support it
        if (this.services.has('redis') && this.services.get('redis').status === 'connected') {
            try {
                baseStatus.services.redis.realtime = await redisClient.healthCheck();
            } catch (error) {
                baseStatus.services.redis.realtimeError = error.message;
            }
        }

        if (this.services.has('concurrencyLimiter')) {
            try {
                baseStatus.services.concurrencyLimiter.realtime = concurrencyLimiter.getStats();
            } catch (error) {
                baseStatus.services.concurrencyLimiter.realtimeError = error.message;
            }
        }

        if (this.services.has('enhancedPlatformService')) {
            try {
                baseStatus.services.enhancedPlatformService.realtime = enhancedPlatformService.getStats();
            } catch (error) {
                baseStatus.services.enhancedPlatformService.realtimeError = error.message;
            }
        }

        return {
            ...baseStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version
        };
    }

    /**
     * Setup graceful shutdown handlers
     */
    setupShutdownHandlers() {
        const gracefulShutdown = async (signal) => {
            if (this.shuttingDown) {
                logger.warn(`Received ${signal} but shutdown already in progress`);
                return;
            }

            logger.info(`Received ${signal}, starting graceful shutdown...`);
            this.shuttingDown = true;

            try {
                await this.cleanup();
                logger.info('Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                logger.error('Error during graceful shutdown', {
                    error: error.message,
                    stack: error.stack
                });
                process.exit(1);
            }
        };

        // Handle various shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception', {
                error: error.message,
                stack: error.stack
            });
            gracefulShutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection', {
                reason: reason?.message || reason,
                stack: reason?.stack,
                promise: promise.toString()
            });
            gracefulShutdown('unhandledRejection');
        });
    }

    /**
     * Cleanup all services
     */
    async cleanup() {
        logger.info('Cleaning up services...');
        
        const cleanupPromises = [];

        // Disconnect Redis
        if (this.services.has('redis') && this.services.get('redis').instance) {
            cleanupPromises.push(
                redisClient.disconnect().catch(error => 
                    logger.error('Redis cleanup error', { error: error.message })
                )
            );
        }

        // Reset stats for other services
        if (this.services.has('concurrencyLimiter')) {
            try {
                concurrencyLimiter.resetStats();
            } catch (error) {
                logger.error('Concurrency limiter cleanup error', { error: error.message });
            }
        }

        if (this.services.has('enhancedPlatformService')) {
            try {
                enhancedPlatformService.resetStats();
            } catch (error) {
                logger.error('Enhanced platform service cleanup error', { error: error.message });
            }
        }

        // Wait for all cleanup operations
        await Promise.allSettled(cleanupPromises);
        
        this.services.clear();
        this.initialized = false;
        
        logger.info('Service cleanup completed');
    }

    /**
     * Restart specific service
     * @param {string} serviceName - Name of service to restart
     * @returns {Promise<boolean>} - Success status
     */
    async restartService(serviceName) {
        if (!this.services.has(serviceName)) {
            throw new Error(`Unknown service: ${serviceName}`);
        }

        logger.info(`Restarting service: ${serviceName}`);

        try {
            switch (serviceName) {
                case 'redis':
                    await redisClient.disconnect();
                    await this.initializeRedis();
                    break;
                    
                case 'concurrencyLimiter':
                    concurrencyLimiter.resetStats();
                    await this.initializeConcurrencyLimiter();
                    break;
                    
                case 'enhancedPlatformService':
                    enhancedPlatformService.resetStats();
                    await this.initializeEnhancedPlatformService();
                    break;
                    
                default:
                    throw new Error(`Service restart not implemented for: ${serviceName}`);
            }

            logger.info(`Service restarted successfully: ${serviceName}`);
            return true;

        } catch (error) {
            logger.error(`Service restart failed: ${serviceName}`, {
                error: error.message,
                stack: error.stack
            });
            return false;
        }
    }
}

// Create singleton instance
const serviceInitializer = new ServiceInitializer();

module.exports = serviceInitializer;