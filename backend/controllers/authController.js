const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// Function to generate a random username based on full name
const generateUsername = (fullName) => {
  const nameParts = fullName.toLowerCase().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  const randomNum = Math.floor(Math.random() * 10000);
  return `${firstName}${lastName}${randomNum}`;
};

// Function to check if a username already exists
const checkUsernameExists = async (username) => {
  const existingUser = await User.findOne({ username });
  return !!existingUser;
};

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
    throw new Error("Error verifying LeetCode username");
  }
};

const signupUser = async (req, res) => {
  const { Fullname, email, password, gender, leetcodeUsername } = req.body;
  try {
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Generate a unique username
    let username;
    let usernameExists = true;
    while (usernameExists) {
      username = generateUsername(Fullname);
      usernameExists = await checkUsernameExists(username);
    }

    const leetcodeExists = await checkLeetCodeUsername(leetcodeUsername);
    if (!leetcodeExists) {
      return res.status(400).json({ message: "LeetCode username not found" });
    }

    if (!["male", "female"].includes(gender)) {
      return res.status(400).json({ message: "Invalid gender value" });
    }

    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      Fullname,
      username, // Auto-generated username
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
      username, // Include the generated username in the response
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
  loginUser, // Assuming loginUser function remains unchanged
};