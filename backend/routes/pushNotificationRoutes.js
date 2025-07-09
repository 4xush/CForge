const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  subscribe,
  unsubscribe,
  getVapidPublicKey,
  sendTestNotification
} = require("../controllers/pushNotificationController");

// Public route to get VAPID public key
router.get("/vapid-public-key", getVapidPublicKey);

// Protected routes
router.post("/subscribe", protect, subscribe);
router.post("/unsubscribe", protect, unsubscribe);
router.post("/test", protect, sendTestNotification);

module.exports = router;