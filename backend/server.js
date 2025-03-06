require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const adminRoomRoutes = require("./routes/adminRoomRoutes");
const publicRoutes = require("./routes/publicRoutes");

const app = express();

// Production vs Development environment
const isProduction = process.env.NODE_ENV === "production";

// Security middleware
app.use(helmet());

// CORS configuration - more restrictive for production
app.use(
  cors({
    origin: isProduction ? "https://cforge.live" : "*",
    methods: ['DELETE', 'GET', 'POST', 'PUT'],
    credentials: true,
  })
);

// Middleware for parsing JSON bodies
app.use(express.json());

// Connect to MongoDB
connectDB();

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/rooms/admin", adminRoomRoutes);
app.use("/api", publicRoutes);

// Serve static assets in production
if (isProduction) {
  // Use this (adjusting for your actual directory structure)
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Create an HTTP server
const server = http.createServer(app);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;