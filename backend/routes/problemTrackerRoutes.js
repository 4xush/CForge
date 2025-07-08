const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Rate limiting middleware
const {
  api: apiRateLimit,
  strict: strictRateLimit,
  developmentBypass
} = require("../middleware/rateLimiting/rateLimitMiddleware");

// Controller imports
const {
  syncRecentProblems,
  getTrackedProblems,
  updateTrackedProblem,
  deleteTrackedProblem,
  getDashboardStats
} = require("../controllers/problemTrackerController");

const {
  createReminders,
  getPendingReminders,
  getProblemReminders,
  completeReminder,
  skipReminder,
  deleteReminders
} = require("../controllers/reminderController");

// Apply development bypass and general API rate limiting
router.use(developmentBypass);
router.use(apiRateLimit);

// Problem tracking routes
router.post("/sync", protect, syncRecentProblems); // POST /api/leetcode-tracker/sync
router.get("/problems", protect, getTrackedProblems); // GET /api/leetcode-tracker/problems
router.put("/problems/:problemId", protect, updateTrackedProblem); // PUT /api/leetcode-tracker/problems/:problemId
router.delete("/problems/:problemId", protect, strictRateLimit, deleteTrackedProblem); // DELETE /api/leetcode-tracker/problems/:problemId
router.get("/stats", protect, getDashboardStats); // GET /api/leetcode-tracker/stats

// Reminder routes
router.post("/problems/:problemId/reminders", protect, createReminders); // POST /api/leetcode-tracker/problems/:problemId/reminders
router.get("/reminders/pending", protect, (req, res, next) => {
  // console.log('🔍 Route: /reminders/pending called');
  getPendingReminders(req, res, next);
}); // GET /api/leetcode-tracker/reminders/pending
router.get("/problems/:problemId/reminders", protect, getProblemReminders); // GET /api/leetcode-tracker/problems/:problemId/reminders
router.put("/reminders/:reminderId/complete", protect, completeReminder); // PUT /api/leetcode-tracker/reminders/:reminderId/complete
router.put("/reminders/:reminderId/skip", protect, skipReminder); // PUT /api/leetcode-tracker/reminders/:reminderId/skip
router.delete("/problems/:problemId/reminders", protect, strictRateLimit, deleteReminders); // DELETE /api/leetcode-tracker/problems/:problemId/reminders

module.exports = router;