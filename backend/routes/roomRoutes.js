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
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getMessages, deleteMessage, editMessage,
} = require("../controllers/messageController");

const { getLeaderboard } = require("../controllers/leaderboardController");

const {
  verifyRoomInvite,
  joinRoomByInvite
} = require("../controllers/roomInviteController");
const router = express.Router();

router.post("/create", protect, createRoom);

router.get("/", protect, getAllRoomsForUser);

router.get("/search", protect, searchPublicRooms);

router.get("/:roomId", protect, getRoomDetails);

router.post("/:roomId/messages", protect, sendMessage);

router.get("/:roomId/leaderboard", protect, getLeaderboard);

router.get("/:roomId/messages", protect, getMessages);

router.delete("/messages/:messageId", protect, deleteMessage);

router.put('/messages/:messageId', protect, editMessage);

router.post("/:roomId/join", protect, sendJoinRequest);

router.delete('/:roomId/leave', protect, leaveRoom);

router.get('/invite/:inviteCode/verify', verifyRoomInvite);
router.post('/invite/:inviteCode/join', protect, joinRoomByInvite);

router.post('/:roomId/update-leetcode-stats', protect, updateRoomMembersLeetCodeStats);
router.post('/:roomId/update-codeforces-stats', protect, updateRoomMembersCodeforcesStats);

module.exports = router;
