const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Controller imports
const { updateLeetCodeStats } = require("../jobs/leetCodeUpdater");
const {
  getUserDetails,
  deleteUserAccount,
  getAllUsers,
} = require("../controllers/userController");
const {
  updatePassword,
  updateUsername,
  updateEmail,
  updateLeetCodeUsername,
  updateProfilePicture,
} = require("../controllers/userSettingsController");
const { getAllRoomsForUser } = require("../controllers/roomController");

// User profile routes
router.get("/profile", protect, getUserDetails);
router.delete("/profile", protect, deleteUserAccount);

// User settings routes
router.put("/settings/password", protect, updatePassword);
router.route("/settings/username").put(protect, updateUsername);
router.route("/settings/email").put(protect, updateEmail);
router.route("/settings/leetcode").put(protect, updateLeetCodeUsername);
router.route("/settings/avatar").put(protect, updateProfilePicture);

// Room routes
router.get("/rooms", protect, getAllRoomsForUser);

// Stats routes
router.put("/update/lcstats", protect, updateLeetCodeStats);

// Admin routes
router.get("/admin/users", protect, getAllUsers);

module.exports = router;