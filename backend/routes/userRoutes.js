const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Controller imports
const { updateLeetCodeStats } = require("../jobs/leetCodeUpdater");
const {
  getUserDetails,
  deleteUserAccount,
  searchUser,
} = require("../controllers/userController");

const {
  updatePassword,
  updateUsername,
  updateEmail,
  updateLeetCodeUsername,
  updateProfilePicture,
} = require("../controllers/userSettingsController");

// User profile routes
router.route("/profile")
  .get(protect, getUserDetails)
  .delete(protect, deleteUserAccount);

router.get("/search", protect, searchUser); //GET /users/search?query=johndoe

// User settings routes
router.put("/updatePassword", protect, updatePassword);
router.put("/updateUsername", protect, updateUsername);
router.route("/updateEmail").put(protect, updateEmail);
router.route("/updateLeetcode").put(protect, updateLeetCodeUsername);
router.route("/updateAvatar").put(protect, updateProfilePicture);

router.put("/update/leetcode", protect, updateLeetCodeStats);

module.exports = router;
