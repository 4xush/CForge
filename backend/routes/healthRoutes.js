const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { checkSecretKey } = require("../middleware/checkSecretKey");

// Health controller
const {
    getHealth,
    getDetailedHealth,
    getPlatformServiceStats,
    getCacheStatus,
    getDatabaseStatus,
    restartService,
    getReadiness,
    getLiveness
} = require("../controllers/healthController");

// Basic health check (no auth required)
router.get("/", getHealth);
router.get("/ping", getHealth);

// Kubernetes/Docker probes (no auth required)
router.get("/ready", getReadiness);
router.get("/live", getLiveness);

// Detailed health checks (require authentication)
router.get("/detailed", protect, getDetailedHealth);
router.get("/services", protect, getPlatformServiceStats);
router.get("/cache", protect, getCacheStatus);
router.get("/database", protect, getDatabaseStatus);

// Admin-only endpoints
router.post("/restart/:serviceName", restartService);

module.exports = router;