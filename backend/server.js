require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const adminRoomRoutes = require("./routes/adminRoomRoutes");
const publicRoutes = require("./routes/publicRoutes");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
// CORS configuration - more restrictive for production

const allowedOrigins = isProduction
  ? ["https://cforge.live", "https://cforge-bbuxjfid8-ayushkumarkvg99-gmailcoms-projects.vercel.app", "https://cforge-three.vercel.app/"]
  : "*";

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['DELETE', 'GET', 'POST', 'PUT'],
    credentials: true,
  })
);

// Middleware for parsing JSON bodies
app.use(express.json());

connectDB();

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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;