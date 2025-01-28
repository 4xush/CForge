const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Controller imports
const { updateLeetCodeStats } = require("../jobs/leetCodeUpdater");
const {
  getUserDetails,
  searchUser, setupPlatforms,
} = require("../controllers/userController");

const {
  updatePassword,
  updateUsername,
  updateEmail,
  updateLeetCodeUsername,
  deleteUserAccount,
  updateProfilePicture,
  updateFullName,
  updateSocialNetworks,
} = require("../controllers/userSettingsController");

// User profile routes
router.route("/profile")
  .get(protect, getUserDetails)
  .delete(protect, deleteUserAccount);

router.get("/search", protect, searchUser); //GET /users/search?query=johndoe

// Setup platforms -
router.post("/setup-platforms", protect, setupPlatforms);
// User settings routes
router.put("/update/password", protect, updatePassword);
router.put("/update/fullName", protect, updateFullName);
router.put("/update/username", protect, updateUsername);
router.route("/update/email").put(protect, updateEmail);
router.route("/update/leetcodeUsername").put(protect, updateLeetCodeUsername);
router.route("/update/avatar").put(protect, updateProfilePicture);

router.put("/update/leetcode", protect, updateLeetCodeStats);


router.put("/update/social-networks", protect, updateSocialNetworks);

module.exports = router;
