const express = require("express");
const router = express.Router();

const { getPublicUserProfile } = require("../controllers/publicControllers");

router.get("/u/:username", getPublicUserProfile);




module.exports = router;
