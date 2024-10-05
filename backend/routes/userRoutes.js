const express = require("express");
const { getAllRoomsForUser } = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");
const { updateLeetCodeStats } = require("../jobs/leetCodeUpdater");
const {
  updatePassword,
  updateUsername,
  updateEmail,
  updateLeetCodeUsername,
  updateProfilePicture,
} = require("../controllers/userupdateSettings");
const {
  getUserDetails,
  deleteUserAccount,
  getAllUsers,
} = require("../controllers/userController");

const router = express.Router();

router.put("/update/stats", protect, updateLeetCodeStats);
router.get("/detail", protect, getUserDetails); // New route for getting user details
router.delete("/delete", protect, deleteUserAccount); // New route for deleting user account

router.get("/rooms", protect, getAllRoomsForUser);
router.get("/admin/getAll", protect, getAllUsers);
router.put("/update/password", protect, updatePassword);
router.put("/update/username", protect, updateUsername);
router.put("/update/email", protect, updateEmail);
router.put("/update/lc/username", protect, updateLeetCodeUsername);
router.put("/update/avtar", protect, updateProfilePicture);

module.exports = router;
