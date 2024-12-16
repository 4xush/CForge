const User = require("../models/User");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const checkLeetCodeUsername = async (username) => {
  const query = `
    {
      matchedUser(username: "${username}") {
        username
      }
    }
  `;

  try {
    const response = await axios.post("https://leetcode.com/graphql", { query });
    return response.data.data.matchedUser !== null;
  } catch (error) {
    console.error("LeetCode API Error:", error.message);
    throw new Error("Error verifying LeetCode username");
  }
};


// Update user password
exports.updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
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

// Update username
exports.updateUsername = async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username },
      { new: true }
    );
    res.status(200).json({ message: "Username updated successfully", user });
  } catch (error) {
    console.error("Error updating username:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update email
exports.updateEmail = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the new email is already used by another user
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res
        .status(400)
        .json({ message: "Email is already in use by another account." });
    }

    // Update the user's email
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { email },
      { new: true }
    );

    res.status(200).json({ message: "Email updated successfully", user });
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateLeetCodeUsername = async (req, res) => {
  const { leetcodeUsername } = req.body;

  try {
    const isLeetCodeUsernameValid = await checkLeetCodeUsername(leetcodeUsername);
    if (!isLeetCodeUsernameValid) {
      return res
        .status(400)
        .json({ message: "LeetCode username does not exist" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { "platforms.leetcode.username": leetcodeUsername },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "LeetCode username updated successfully", user });
  } catch (error) {
    console.error("Error updating LeetCode username:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateProfilePicture = async (req, res) => {
  const { profilePicture } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "Profile picture updated successfully", user });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
