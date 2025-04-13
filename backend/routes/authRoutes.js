const express = require("express");

const router = express.Router();
const { signupUser, login, googleAuth, refreshToken } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/signup", signupUser);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/refresh-token", protect, refreshToken);

module.exports = router;
