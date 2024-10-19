const express = require("express");
const {
  createRoom,
  getAllRoomsForUser,
  searchPublicRooms,
  getRoomDetails,
  sendJoinRequest,
  leaveRoom
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");

const { getLeaderboard } = require("../controllers/getLeaderBoard");

const router = express.Router();

router.post("/create", protect, createRoom);

router.get("/", protect, getAllRoomsForUser);

router.get("/search", protect, searchPublicRooms);

router.get("/:roomId", protect, getRoomDetails);

router.post("/:roomId/messages", protect, sendMessage);

router.get("/:roomId/leaderboard", getLeaderboard);

router.get("/:roomId/messages", protect, getMessages);

router.post("/:roomId/join", protect, sendJoinRequest);

router.delete('/:roomId/leave', protect, leaveRoom);


module.exports = router;
