const express = require("express");
const {
  createRoom,
  getAllRoomsForUser,
  searchPublicRooms,
  getRoomDetails,
  sendJoinRequest,
  leaveRoom,
  updateRoomMembersLeetCodeStats,
  updateRoomMembersCodeforcesStats
} = require("../controllers/roomController");

// Enhanced room controller with improved platform stats
const {
  updateRoomMembersLeetCodeStats: enhancedUpdateLeetCode,
  updateRoomMembersCodeforcesStats: enhancedUpdateCodeforces,
  updateRoomMembersGitHubStats: enhancedUpdateGitHub,
  getRoomPlatformStatus
} = require("../controllers/enhancedRoomController");

const { protect } = require("../middleware/authMiddleware");

// Rate limiting middleware
const {
  api: apiRateLimit,
  roomOperations: roomOperationsRateLimit,
  messaging: messagingRateLimit,
  platformRefresh: platformRefreshRateLimit,
  developmentBypass
} = require("../middleware/rateLimiting/rateLimitMiddleware");

const {
  sendMessage,
  getMessages, deleteMessage, editMessage,
} = require("../controllers/messageController");

const { getLeaderboard } = require("../controllers/leaderboardController");

const {
  verifyRoomInvite,
  joinRoomByInvite
} = require("../controllers/roomInviteController");

const { bulkRefreshPlatformStats } = require("../controllers/platformDataController");

const router = express.Router();

// Apply development bypass and general API rate limiting
router.use(developmentBypass);
router.use(apiRateLimit);

router.post("/create", protect, roomOperationsRateLimit, createRoom);

router.get("/", protect, getAllRoomsForUser);

router.get("/search", protect, searchPublicRooms);

router.get("/:roomId", protect, getRoomDetails);

router.post("/:roomId/messages", protect, messagingRateLimit, sendMessage);

router.get("/:roomId/leaderboard", protect, getLeaderboard);

router.get("/:roomId/messages", protect, getMessages);

router.delete("/messages/:messageId", protect, messagingRateLimit, deleteMessage);

router.put('/messages/:messageId', protect, messagingRateLimit, editMessage);

router.post("/:roomId/join", protect, roomOperationsRateLimit, sendJoinRequest);

router.delete('/:roomId/leave', protect, roomOperationsRateLimit, leaveRoom);

router.get('/invite/:inviteCode/verify', verifyRoomInvite);
router.post('/invite/:inviteCode/join', protect, roomOperationsRateLimit, joinRoomByInvite);

// Enhanced platform stats update routes with rate limiting
router.post('/:roomId/update-leetcode-stats', protect, platformRefreshRateLimit, enhancedUpdateLeetCode);
router.post('/:roomId/update-codeforces-stats', protect, platformRefreshRateLimit, enhancedUpdateCodeforces);
router.post('/:roomId/update-github-stats', protect, platformRefreshRateLimit, enhancedUpdateGitHub);

// Bulk platform refresh endpoint
router.post('/:roomId/bulk-refresh', protect, platformRefreshRateLimit, bulkRefreshPlatformStats);

// Platform status and management
router.get('/:roomId/platform-status', protect, getRoomPlatformStatus);

// Legacy routes for backward compatibility (will use original controllers but with rate limiting)
router.post('/:roomId/legacy/update-leetcode-stats', protect, platformRefreshRateLimit, updateRoomMembersLeetCodeStats);
router.post('/:roomId/legacy/update-codeforces-stats', protect, platformRefreshRateLimit, updateRoomMembersCodeforcesStats);

module.exports = router;
