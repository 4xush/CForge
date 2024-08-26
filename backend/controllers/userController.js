const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.updateUserSettings = async (req, res) => {
  const { username, password, leetcodeUsername, email } = req.body;
  try {
    const updateData = { username, leetcodeUsername, email };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    });
    res
      .status(200)
      .json({ message: "User settings updated successfully", user });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
