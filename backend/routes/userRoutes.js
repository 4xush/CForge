const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Controller imports
const { refreshUserPlatforms } = require('../controllers/platformDataController');
const {
  getUserDetails,
  searchUser,
  setupLeetCode,
  setupGitHub,
  setupCodeforces
} = require("../controllers/userController");


const {
  updatePassword,
  updateUsername,
  updateEmail,
  deleteUserAccount,
  updateProfilePicture,
  updateFullName,
  updateSocialNetworks,
  updateGender,
} = require("../controllers/userSettingsController");

// User profile routes
router.route("/profile")
  .get(protect, getUserDetails)
  .delete(protect, deleteUserAccount);

router.get("/search", protect, searchUser); //GET /users/search?query=johndoe

// User settings routes
router.put("/update/password", protect, updatePassword);
router.put("/update/fullName", protect, updateFullName);
router.put("/update/username", protect, updateUsername);
router.put("/update/gender", protect, updateGender);
router.route("/update/email").put(protect, updateEmail);
router.route("/update/avatar").put(protect, updateProfilePicture);
router.put("/update/social-networks", protect, updateSocialNetworks);

// User platforms update
router.put("/platform/refresh/", protect, refreshUserPlatforms);

// Platform setup routes
router.put("/platform/leetcode", protect, setupLeetCode);
router.put("/platform/github", protect, setupGitHub);
router.put("/platform/codeforces", protect, setupCodeforces);

module.exports = router;
