const express = require("express");

const router = express.Router();
const { signupUser, login, googleAuth, refreshToken } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Rate limiting middleware for brute force protection
const {
  auth: authRateLimit,
  registrationRateLimiter,
  api: apiRateLimit,
  developmentBypass
} = require("../middleware/rateLimiting/rateLimitMiddleware");

// Apply development bypass first
router.use(developmentBypass);

// Auth routes with appropriate rate limiting
router.post("/signup", registrationRateLimiter, signupUser);
router.post("/login", authRateLimit, login);
router.post("/google", apiRateLimit, googleAuth);
router.post("/refresh-token", protect, apiRateLimit, refreshToken);

module.exports = router;
