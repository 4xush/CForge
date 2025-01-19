const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateEmail, validatePassword, validateFullName, checkLeetCodeUsername, checkGitHubUsername, checkCodeforcesUsername } = require("../utils/authHelpers.js");
const generateUsername = require("../utils/usernameGenerator");
const { updateUserLeetCodeStats } = require("../services/leetcodeStatsService");

const signupUser = async (req, res) => {
  const { fullName, email, password, gender, leetcodeUsername, githubUsername, codeforcesUsername } = req.body;

  try {
    // Input validation
    const validationErrors = [];

    // Basic field validations
    if (!validateEmail(email)) {
      validationErrors.push("Invalid email format");
    }
    if (!validatePassword(password)) {
      validationErrors.push("Password must be at least 8 characters long");
    }
    if (!validateFullName(fullName)) {
      validationErrors.push("Full name must be between 2 and 50 characters");
    }
    if (!["male", "female", "other"].includes(gender?.toLowerCase())) {
      validationErrors.push("Gender must be either 'male', 'female', or 'other'");
    }

    // Platform username validations
    if (!leetcodeUsername?.trim()) {
      validationErrors.push("LeetCode username is required");
    }

    if (githubUsername && typeof githubUsername !== 'string') {
      validationErrors.push("Invalid GitHub username format");
    }

    if (codeforcesUsername && typeof codeforcesUsername !== 'string') {
      validationErrors.push("Invalid Codeforces username format");
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // Check if email is already registered
    const existingEmailUser = await User.findOne({
      email: new RegExp(`^${email}$`, 'i')
    });
    if (existingEmailUser) {
      return res.status(400).json({
        message: "Email is already registered"
      });
    }

    // Validate platform usernames
    try {
      // LeetCode validation (required)
      const isValidLeetCodeUsername = await checkLeetCodeUsername(leetcodeUsername);
      if (!isValidLeetCodeUsername) {
        return res.status(400).json({
          message: "LeetCode username not found or invalid"
        });
      }

      // GitHub validation (optional)
      if (githubUsername) {
        const isValidGitHubUsername = await checkGitHubUsername(githubUsername);
        if (!isValidGitHubUsername) {
          return res.status(400).json({
            message: "GitHub username not found or invalid"
          });
        }
      }

      // Codeforces validation (optional)
      if (codeforcesUsername) {
        const isValidCodeforcesUsername = await checkCodeforcesUsername(codeforcesUsername);
        if (!isValidCodeforcesUsername) {
          return res.status(400).json({
            message: "Codeforces username not found or invalid"
          });
        }
      }
    } catch (error) {
      console.error("Platform username verification failed:", error);
      return res.status(503).json({
        message: "Unable to verify platform usernames. Please try again later."
      });
    }

    // Generate username and avatar
    const username = await generateUsername(fullName);
    const defaultAvatar = "https://ui-avatars.com/api/?background=random";
    const avatarUrl = `${defaultAvatar}&name=${encodeURIComponent(fullName)}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user object with proper platform structure
    const newUser = new User({
      fullName: fullName.trim(),
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      gender: gender.toLowerCase(),
      profilePicture: avatarUrl,
      platforms: {
        leetcode: {
          username: leetcodeUsername.trim(),
          totalQuestionsSolved: 0,
          questionsSolvedByDifficulty: {
            easy: 0,
            medium: 0,
            hard: 0
          },
          attendedContestsCount: 0,
          contestRating: 0
        },
        github: githubUsername ? {
          username: githubUsername.trim(),
          publicRepos: 0,
          followers: 0,
          following: 0,
          contributions: 0,
          stars: 0
        } : { username: null },
        codeforces: codeforcesUsername ? {
          username: codeforcesUsername.trim(),
          currentRating: 0,
          maxRating: 0,
          rank: "",
          maxRank: "",
          contribution: 0,
          friendOfCount: 0
        } : { username: null }
      }
    });

    // Validate and save user
    await newUser.validate();
    await newUser.save();

    // Update LeetCode stats
    let updatedUser = newUser;
    try {
      updatedUser = await updateUserLeetCodeStats(newUser, false, true);
    } catch (statsError) {
      console.error("Initial LeetCode stats fetch failed:", statsError);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: updatedUser._id,
        username: updatedUser.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Send response
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        platforms: updatedUser.platforms
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation failed",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Username already exists"
      });
    }
    res.status(500).json({
      message: "Registration failed. Please try again later."
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Input validation
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    // Find user
    const user = await User.findOne({
      email: new RegExp(`^${email}$`, 'i')
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // Update login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Update LeetCode stats
    let updatedUser = user;
    try {
      updatedUser = await updateUserLeetCodeStats(user);
    } catch (statsError) {
      console.error("LeetCode stats update failed during login:", statsError);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        platforms: updatedUser.platforms
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed. Please try again later."
    });
  }
};

module.exports = {
  signupUser,
  loginUser
};