if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const websocketService = require('./services/websocketService');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'logs/server-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/server-combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'ENCRYPTION_KEY', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Enable Socket.IO debugging only in development
if (process.env.NODE_ENV !== 'production') {
  process.env.DEBUG = 'socket.io:*';
}

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const adminRoomRoutes = require('./routes/adminRoomRoutes');
const publicRoutes = require('./routes/publicRoutes');
const healthRoutes = require('./routes/healthRoutes');
const contestsRoutes = require('./routes/contests');
const reviewRoutes = require('./routes/reviewRoutes');
// Enhanced services
const serviceInitializer = require('./services/initialization/serviceInitializer');

const { checkPlatformStatus, includeMetaData } = require('./middleware/platformStatusMiddleware');
const { initSchedulers } = require('./schedulers');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", process.env.FRONTEND_URL, `wss://${process.env.DOMAIN || 'yourdomain.com'}`],
          scriptSrc: ["'self'", process.env.FRONTEND_URL],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', process.env.FRONTEND_URL],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      }
      : false
  })
);

// CORS configuration
app.use(
  cors({
    origin: isProduction ? [process.env.FRONTEND_URL] : '*',
    methods: ['DELETE', 'GET', 'POST', 'PUT', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Middleware for parsing JSON bodies
app.use(express.json());

// Add platform status middleware
app.use(includeMetaData);
app.use(checkPlatformStatus);

// Connect to MongoDB with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await connectDB();
      logger.info('MongoDB connected successfully');

      // Initialize enhanced services
      logger.info('Initializing enhanced services...');
      const servicesInitialized = await serviceInitializer.initializeServices();
      if (!servicesInitialized) {
        logger.warn('Some services failed to initialize, continuing with limited functionality');
      } else {
        logger.info('All enhanced services initialized successfully');
      }

      // Initialize schedulers
      initSchedulers();
      return;
    } catch (err) {
      logger.error(`MongoDB connection attempt ${i + 1} failed: ${err.message}`);
      if (i === retries - 1) {
        logger.error('Max MongoDB connection retries reached. Exiting...');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

connectWithRetry();

// API routes
app.get('/ping', (req, res) => {
  res.send('pong');
});
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms/admin', adminRoomRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contests', contestsRoutes);
app.use('/api', publicRoutes);



// Serve static assets in production (if frontend is hosted with backend)
if (isProduction) {
  const staticPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(staticPath, 'index.html'));
  });

  // Serve sitemap
  app.use('/sitemap.xml', express.static(path.join(__dirname, 'public', 'sitemap.xml')));
}

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Server error: ${err.stack}`);
  res.status(500).json({ message: 'Internal server error', error: isProduction ? undefined : err.message });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize WebSocket service
logger.info('Initializing WebSocket service...');
websocketService.initialize(server);
logger.info('WebSocket service initialized successfully');

server.listen(PORT, () => {
  const domain = isProduction ? process.env.DOMAIN || 'cforge.onrender.com' : 'localhost';
  const protocol = isProduction ? 'wss' : 'ws';
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`WebSocket server available at ${protocol}://${domain}:${PORT}`);
});

module.exports = { app, server };