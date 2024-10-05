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

const signupUser = async (req, res) => {
  const { Fullname, username, email, password, gender, leetcodeUsername } =
    req.body;

  try {
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const existingUsernameUser = await User.findOne({ username });
    if (existingUsernameUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const existingLeetCodeUser = await User.findOne({
      "platforms.leetcode.username": leetcodeUsername,
    });
    if (existingLeetCodeUser) {
      return res.status(400).json({
        message: `LeetCode username "${leetcodeUsername}" is already registered with another email. Please use a different LeetCode username.`,
      });
    }

    const leetcodeExists = await checkLeetCodeUsername(leetcodeUsername);
    if (!leetcodeExists) {
      return res.status(400).json({ message: "LeetCode username not found" });
    }

    // Validate gender
    if (!["male", "female"].includes(gender)) {
      return res.status(400).json({ message: "Invalid gender value" });
    }

    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      Fullname,
      username,
      email,
      password: hashedPassword,
      gender,
      profilePicture: gender === "male" ? boyProfilePic : girlProfilePic,
      platforms: {
        leetcode: {
          username: leetcodeUsername,
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

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const isMatch = await bcrypt.compare(password, user.password);

    if (!user || !isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

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
  signupUser,
  loginUser,
};
