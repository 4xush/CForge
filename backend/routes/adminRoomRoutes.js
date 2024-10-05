const express = require("express");
const router = express.Router();
const {
  approveJoinRequest,
  declineJoinRequest,
  updateRoom,
  addAdmin,
  removeAdmin,
  muteUser,
  unmuteUser,
  toggleAdminOnlyMode,
  removeUser,
} = require("../controllers/adminRoomController");
const protect = require("../middleware/authMiddleware");

router.post(
  "/:roomId/requests/:requestId/approve",
  protect,
  approveJoinRequest
);

router.post(
  "/:roomId/requests/:requestId/decline",
  protect,
  declineJoinRequest
);

router.patch("/:roomId", protect, updateRoom);

router.post("/:roomId/admins", protect, addAdmin);

router.delete("/:roomId/admins", protect, removeAdmin);

router.post("/:roomId/mute", protect, muteUser);

router.post("/:roomId/unmute", protect, unmuteUser);

router.patch("/:roomId/admin-only", protect, toggleAdminOnlyMode);

router.delete("/:roomId/remove-user", protect, removeUser);

module.exports = router;
