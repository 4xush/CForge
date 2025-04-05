const express = require("express");

const router = express.Router();
const { signupUser, login, googleAuth } = require("../controllers/authController");


router.post("/signup", signupUser);
router.post("/login", login);
router.post("/google", googleAuth);
module.exports = router;
