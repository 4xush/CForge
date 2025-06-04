const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { checkSecretKey } = require("../middleware/checkSecretKey");

// Rate limiting middleware
const {
  api: apiRateLimit,
  platformRefresh: platformRefreshRateLimit,
  strict: strictRateLimit,
  developmentBypass
} = require("../middleware/rateLimiting/rateLimitMiddleware");

// Controller imports
const { 
  refreshUserPlatforms, 
  invalidateUserCache, 
  getPlatformStats 
} = require('../controllers/platformDataController');
const {
  getUserDetails,
  searchUser,
  setupLeetCode,
  setupGitHub,
  setupCodeforces,
  getActiveUsers,
  getActiveUsersCount
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

// Apply development bypass and general API rate limiting
router.use(developmentBypass);
router.use(apiRateLimit);

// User profile routes
router.route("/profile")
  .get(protect, getUserDetails)
  .delete(protect, strictRateLimit, deleteUserAccount);

router.get("/search", protect, searchUser); //GET /users/search?query=johndoe

// Active users routes (owner only)
router.get("/active", checkSecretKey, getActiveUsers); //GET /users/active?days=7&secretKey=YOUR_SECRET
router.get("/active/count", checkSecretKey, getActiveUsersCount); //GET /users/active/count?secretKey=YOUR_SECRET

// User settings routes (with strict rate limiting for sensitive operations)
router.put("/update/password", protect, strictRateLimit, updatePassword);
router.put("/update/fullName", protect, updateFullName);
router.put("/update/username", protect, strictRateLimit, updateUsername);
router.put("/update/gender", protect, updateGender);
router.route("/update/email").put(protect, strictRateLimit, updateEmail);
router.route("/update/avatar").put(protect, updateProfilePicture);
router.put("/update/social-networks", protect, updateSocialNetworks);

// User platforms update (with platform-specific rate limiting)
router.put("/platform/refresh/", protect, platformRefreshRateLimit, refreshUserPlatforms);

// Platform setup routes
router.put("/platform/leetcode", protect, setupLeetCode);
router.put("/platform/github", protect, setupGitHub);
router.put("/platform/codeforces", protect, setupCodeforces);

// Enhanced platform management routes
router.delete("/platform/cache", protect, invalidateUserCache); // DELETE /users/platform/cache?platform=leetcode
router.get("/platform/stats", protect, getPlatformStats); // GET /users/platform/stats

module.exports = router;
