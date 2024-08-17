const express = require("express");
const {
  registerUser,
  loginUser,
  updateLeetCodeStats,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Route to register a new user
router.post("/register", registerUser);

// Route to login a user
router.post("/login", loginUser);

// Route to update LeetCode stats for a logged-in user
router.put("/update-stats", protect, updateLeetCodeStats);

module.exports = router;
