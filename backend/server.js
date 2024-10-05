require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// CORS middleware configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend URL without the trailing slash
    credentials: true,
  })
);

// Middleware for parsing JSON bodies
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);

const PORT = process.env.PORT || 5000;

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Join a room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  // Listen for messages
  socket.on("message", (messageData) => {
    const { roomId, message } = messageData;
    // Broadcast the message to the room
    io.to(roomId).emit("newMessage", message);
    // Optionally, save the message to the database here
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
module.exports = app;
