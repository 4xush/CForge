const express = require("express");
const router = express.Router();
const {
  generateRoomInvite
} = require("../controllers/roomInviteController");
const { protect } = require("../middleware/authMiddleware");
const {
  updateRoom,
  addAdmin,
  removeAdmin,
  muteUser,
  unmuteUser,
  kickUser,
  approveJoinRequest,
  rejectJoinRequest,
  deleteRoom,
} = require("../controllers/adminRoomController");

router.post('/:roomId/invite', protect, generateRoomInvite);

// Room management routes
router.put("/:roomId", protect, updateRoom);
router.delete("/:roomId", protect, deleteRoom);

// Admin management routes
router.post("/:roomId/admins/add", protect, addAdmin);
router.post("/:roomId/admins/remove", protect, removeAdmin);

// User management routes
router.post("/:roomId/mute", protect, muteUser);
router.post("/:roomId/unmute", protect, unmuteUser);
router.post("/:roomId/kick", protect, kickUser);

// Join request management
router.post("/:roomId/join-requests/approve", protect, approveJoinRequest);
router.post("/:roomId/join-requests/reject", protect, rejectJoinRequest);


module.exports = router;
// http://localhost:5173/rooms/join/5d7d8fd615