const User = require("../models/User");
const bcrypt = require("bcryptjs");
const authHelper = require("../utils/authHelpers");

exports.updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    if (!authHelper.validatePassword(newPassword)) {
      return res
        .status(400)
        .json({ message: "New password does not meet complexity requirements" });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.updateUsername = async (req, res) => {
  const { username } = req.body;

  try {
    if (!username || typeof username !== "string" || username.length < 2 || username.length > 50) {
      return res.status(400).json({ message: "Invalid username format" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username },
      { new: true }
    );

    res.status(200).json({ message: "Username updated successfully" });
  } catch (error) {
    console.error("Error updating username:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateEmail = async (req, res) => {
  const { email } = req.body;

  try {
    if (!authHelper.validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res
        .status(400)
        .json({ message: "Email is already in use by another account" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { email },
      { new: true }
    );

    res.status(200).json({ message: "Email updated successfully" });
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateLeetCodeUsername = async (req, res) => {
  const { leetcodeUsername } = req.body;

  // Validate input
  if (!leetcodeUsername || typeof leetcodeUsername !== "string") {
    return res.status(400).json({ message: "Invalid LeetCode username format" });
  }

  try {
    // Check if the LeetCode username exists
    const isLeetCodeUsernameValid = await authHelper.checkLeetCodeUsername(
      leetcodeUsername
    );
    if (!isLeetCodeUsernameValid) {
      return res
        .status(400)
        .json({ message: "LeetCode username does not exist" });
    }

    // Find the user by ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize platforms and LeetCode object if not present
    user.platforms ||= {};
    user.platforms.leetcode ||= {};
    user.platforms.leetcode.username = leetcodeUsername;

    // Save the updated user
    await user.save();

    // // Exclude sensitive fields from the response
    // const sanitizedUser = user.toObject();
    // delete sanitizedUser.password;

    res
      .status(200)
      .json({ message: "LeetCode username updated successfully" });
  } catch (error) {
    console.error(
      `Error updating LeetCode username for user ${req.user.id}:`,
      error
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.updateProfilePicture = async (req, res) => {
  const { profilePicture } = req.body;

  try {
    const isValidURL = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i.test(
      profilePicture
    );
    if (!isValidURL) {
      return res
        .status(400)
        .json({ message: "Invalid profile picture URL" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "Profile picture updated successfully" });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
