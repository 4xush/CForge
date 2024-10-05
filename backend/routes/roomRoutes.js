const express = require("express");
const {
  createRoom,
  getAllRoomsForUser,
  searchPublicRooms,
  getRoomDetails,
  getLeaderboard,
  sendJoinRequest,
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");

const router = express.Router();

router.post("/create", protect, createRoom);

router.get("/", protect, getAllRoomsForUser);

router.get("/search", protect, searchPublicRooms);

router.get("/:roomId", protect, getRoomDetails);

router.post("/:roomId/messages", protect, sendMessage);

router.get("/:roomId/leaderboard", protect, getLeaderboard);

router.get("/:roomId/messages", protect, getMessages);

router.post("/:roomId/join", protect, sendJoinRequest);

module.exports = router;
