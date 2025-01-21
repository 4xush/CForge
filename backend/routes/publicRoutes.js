const express = require("express");
const router = express.Router();

const { getPublicUserProfile, getPublicUserHeatMaps } = require("../controllers/publicControllers");

router.get("/u/:username", getPublicUserProfile);
router.get("/u_hmap/:username", getPublicUserHeatMaps); // for platforms heatmap data

module.exports = router;
