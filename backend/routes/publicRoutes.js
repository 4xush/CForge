const express = require("express");
const router = express.Router();

const { getPublicUserProfile, getPublicUserHeatMaps } = require("../controllers/publicControllers");
const { getUserQuestionStats } = require("../controllers/platformDataController");

router.get("/u/:username", getPublicUserProfile);
router.get("/u/hmap/:username", getPublicUserHeatMaps); // for platforms heatmap data
router.get('/u/lc-stats/:username', getUserQuestionStats); // for leetcode Q tag stats

module.exports = router;
