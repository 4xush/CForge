const express = require("express");
const {
  registerUser,
  loginUser,
  updateLeetCodeStats,
  updateUserSettings,
  getAllRooms,
} = require("../controllers/userController"); // Ensure these are imported correctly
const { protect } = require("../middleware/authMiddleware"); // Ensure this is correctly imported

const router = express.Router();

// User registration route
router.post("/register", registerUser);

// User login route
router.post("/login", loginUser);

// Update LeetCode stats route (protected)
router.put("/update-stats", protect, updateLeetCodeStats);

// Route to update user settings (protected)
router.patch("/settings", protect, updateUserSettings);

// Route to get rooms the user is connected to (protected)
router.get("/rooms", protect, getAllRooms); // New route to fetch user rooms

module.exports = router;
