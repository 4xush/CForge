const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Importing the User model
const { getLeetCodeStats } = require("../services/leetcodeService"); // Importing the LeetCode service

// User Registration
exports.registerUser = async (req, res) => {
  const { username, email, password, leetcodeUsername } = req.body;
  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the hashed password
    const user = new User({
      username,
      email,
      password: hashedPassword,
      leetcodeUsername,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// User Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Login attempt for email:", email);

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user);

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password does not match for email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Password matched for email:", email);

    // Generate JWT (JSON Web Token)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("JWT token generated for user:", user._id);

    // Return success message with token
    res.status(200).json({ message: "User logged in successfully", token });
  } catch (error) {
    console.error("Server error during login:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update LeetCode Statistics for a User
exports.updateLeetCodeStats = async (req, res) => {
  const { leetcodeUsername } = req.user; // Assume the user is already authenticated and their username is available
  try {
    // Fetch the latest stats from LeetCode
    const stats = await getLeetCodeStats(leetcodeUsername);

    // Update the user's stats in the database
    await User.findOneAndUpdate(
      { leetcodeUsername },
      {
        attendedContestsCount: stats.attendedContestsCount,
        globalRanking: stats.globalRanking,
      },
      { new: true } // Return the updated document
    );

    res
      .status(200)
      .json({ message: "LeetCode stats updated successfully", stats });
  } catch (error) {
    console.error("Error updating LeetCode stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
