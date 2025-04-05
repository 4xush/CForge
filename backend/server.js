require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const websocketService = require("./services/websocketService");

// Enable Socket.IO debugging if not in production
if (process.env.NODE_ENV !== 'production') {
  process.env.DEBUG = 'socket.io:*';
}

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const adminRoomRoutes = require("./routes/adminRoomRoutes");
const publicRoutes = require("./routes/publicRoutes");

const { checkPlatformStatus, includeMetaData } = require('./middleware/platformStatusMiddleware');
const { initSchedulers } = require('./schedulers');

const app = express();

const isProduction = process.env.NODE_ENV === "production";

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS configuration - more permissive for development to allow WebSocket connections
const allowedOrigins = isProduction
  ? ["https://www.cforge.live", "https://cforge-bbuxjfid8-ayushkumarkvg99-gmailcoms-projects.vercel.app", "https://cforge-three.vercel.app/"]
  : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: isProduction ? allowedOrigins : "*",
    methods: ['DELETE', 'GET', 'POST', 'PUT', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Middleware for parsing JSON bodies
app.use(express.json());

// Add these after basic middleware but before routes
app.use(includeMetaData);
app.use(checkPlatformStatus);

connectDB().then(() => {
  // Initialize schedulers
  initSchedulers();
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err.message);
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/rooms/admin", adminRoomRoutes);
app.use("/api", publicRoutes);

// Serve static assets in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize WebSocket service
console.log('Initializing WebSocket service...');
websocketService.initialize(server);
console.log('WebSocket service initialized successfully');

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`WebSocket server available at ws://localhost:${PORT}`);
});

module.exports = { app, server };