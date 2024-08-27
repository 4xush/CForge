const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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
    const response = await axios.post("https://leetcode.com/graphql", {
      query,
    });
    return response.data.data.matchedUser !== null;
  } catch (error) {
    throw new Error("Error verifying LeetCode username");
  }
};

// User Registration
const registerUser = async (req, res) => {
  const { username, email, password, leetcodeUsername } = req.body;

  try {
    // Check if email is already registered
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Check if LeetCode username is already registered with another email
    const existingLeetCodeUser = await User.findOne({
      "platforms.leetcode.username": leetcodeUsername, // Updated field name
    });
    if (existingLeetCodeUser) {
      return res.status(400).json({
        message: `LeetCode username "${leetcodeUsername}" is already registered with another email. Please use a different LeetCode username.`,
      });
    }

    // Check if LeetCode username exists on LeetCode platform
    const leetcodeExists = await checkLeetCodeUsername(leetcodeUsername);
    if (!leetcodeExists) {
      return res.status(400).json({ message: "LeetCode username not found" });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      platforms: {
        leetcode: {
          username: leetcodeUsername, // Updated field name
          totalQuestionsSolved: 0,
          questionsSolvedByDifficulty: { easy: 0, medium: 0, hard: 0 },
          attendedContestsCount: 0,
        },
      },
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// User Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Login attempt for email:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password does not match for email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Password matched for email:", email);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("JWT token generated for user:", user._id);

    res.status(200).json({ message: "User logged in successfully", token });
  } catch (error) {
    console.error("Server error during login:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
