const express = require("express");

const router = express.Router();
const { signupUser, loginUser, googleAuth } = require("../controllers/authController");


router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);

module.exports = router;
