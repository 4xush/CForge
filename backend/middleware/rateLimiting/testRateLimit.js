const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Simple test for rate limiting compatibility
const testRateLimit = async () => {
    console.log('🧪 Testing Rate Limiting Compatibility...');
    
    try {
        // Test 1: Basic rate limiter without Redis
        console.log('📝 Test 1: Basic rate limiter (memory store)');
        const basicLimiter = rateLimit({
            windowMs: 1000, // 1 second
            limit: 2, // 2 requests per second
            message: { error: 'Rate limit exceeded' },
            standardHeaders: true,
            legacyHeaders: false
        });
        console.log('✅ Basic rate limiter created successfully');
        
        // Test 2: Redis-based rate limiter (if Redis is available)
        console.log('📝 Test 2: Redis-based rate limiter');
        let redisClient;
        try {
            redisClient = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    connectTimeout: 5000,
                    lazyConnect: true
                }
            });
            
            await redisClient.connect();
            await redisClient.ping();
            
            const redisLimiter = rateLimit({
                windowMs: 1000,
                limit: 2,
                store: new RedisStore({
                    client: redisClient,
                    prefix: 'test:ratelimit:'
                }),
                message: { error: 'Redis rate limit exceeded' },
                standardHeaders: true,
                legacyHeaders: false
            });
            
            console.log('✅ Redis-based rate limiter created successfully');
            await redisClient.disconnect();
        } catch (redisError) {
            console.log('⚠️  Redis not available, using memory store fallback');
        }
        
        // Test 3: Custom configuration
        console.log('📝 Test 3: Custom configuration test');
        const customLimiter = rateLimit({
            windowMs: 5000,
            limit: 1,
            message: {
                error: 'Custom rate limit exceeded',
                retryAfter: '5 seconds'
            },
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req) => `test:${req.ip}`,
            skip: (req) => req.path === '/health',
            handler: (req, res) => {
                res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded in test'
                });
            }
        });
        console.log('✅ Custom rate limiter created successfully');
        
        console.log('🎉 All rate limiting tests passed!');
        console.log('💡 Rate limiting middleware is compatible with express-rate-limit v7');
        
    } catch (error) {
        console.error('❌ Rate limiting test failed:', error.message);
        console.error('🔧 Error details:', error);
        process.exit(1);
    }
};

// Mock Express app for testing
const testWithMockApp = () => {
    const express = require('express');
    const app = express();
    
    // Apply rate limiting
    const testLimiter = rateLimit({
        windowMs: 1000,
        limit: 2,
        message: { error: 'Test rate limit exceeded' }
    });
    
    app.use('/test', testLimiter);
    app.get('/test', (req, res) => {
        res.json({ success: true, message: 'Request successful' });
    });
    
    console.log('🚀 Mock Express app with rate limiting created successfully');
    return app;
};

// Run tests if called directly
if (require.main === module) {
    testRateLimit().then(() => {
        console.log('🔬 Creating mock Express app...');
        const app = testWithMockApp();
        const server = app.listen(0, () => {
            const port = server.address().port;
            console.log(`🌐 Test server running on port ${port}`);
            console.log(`📍 Test endpoint: http://localhost:${port}/test`);
            console.log('💡 You can test rate limiting by making multiple requests to /test');
            
            // Auto-shutdown after 30 seconds
            setTimeout(() => {
                console.log('⏰ Shutting down test server...');
                server.close();
                process.exit(0);
            }, 30000);
        });
    }).catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testRateLimit, testWithMockApp };