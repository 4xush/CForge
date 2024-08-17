const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");

dotenv.config(); // Load environment variables from .env file

const app = express();

// Middleware for parsing JSON bodies
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
