require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const adminRoomRoutes = require("./routes/adminRoomRoutes");
const publicRoutes = require("./routes/publicRoutes");

const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// CORS middleware configuration with wildcard for testing
app.use(
  cors({
    origin: "*",  // Allow all origins temporarily for testing
    methods: ['DELETE', 'GET', 'POST', 'PUT'],
    credentials: true,
  })
);

// Preflight request handler for all routes
app.options('*', cors());  // Allow all preflight OPTIONS requests

// Middleware for parsing JSON bodies
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.get("/api", (req, res) => {
  console.log("Test Ok");
  res.status(200).json({ message: "Hello Cforgers" });
});


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/rooms/admin", adminRoomRoutes);
app.use("/api", publicRoutes);

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
