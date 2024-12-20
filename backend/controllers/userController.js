const User = require("../models/User");

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.searchUser = async (req, res) => {
  const { query } = req.query; // `query` parameter from the request URL (e.g., `/search?query=johndoe`).

  try {
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query cannot be empty" });
    }

    // Perform a case-insensitive search for users based on username or email
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } }, // Case-insensitive match on username
        { email: { $regex: query, $options: "i" } },    // Case-insensitive match on email
      ],
    }).select("-password"); // Exclude the password field.

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found matching the query" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
