const express = require("express");
const {
  updateLeetCodeStats,
  updateUserSettings,
} = require("../controllers/userController");
const { registerUser, loginUser } = require("../controllers/authController"); // Import auth functions from authController
const { getAllRooms } = require("../controllers/roomController"); // Import getAllRooms from roomController
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Auth routes (these don't need protection)
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected user routes
router.put("/update-stats", protect, updateLeetCodeStats);
router.patch("/settings", protect, updateUserSettings);

// Route to get rooms the user is connected to (protected)
// This route is now handled by the roomController
router.get("/rooms", protect, getAllRooms);

module.exports = router;
