// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateEmail, validatePassword, validatefullName, checkLeetCodeUsername } = require("../utils/authHelpers.js");
const generateUsername = require("../utils/usernameGenerator");
const { updateUserLeetCodeStats } = require("../services/leetcodeStatsService");

const signupUser = async (req, res) => {
  const { fullName, email, password, gender, leetcodeUsername } = req.body;

  try {
    // Input validation
    const validationErrors = [];

    if (!validateEmail(email)) {
      validationErrors.push("Invalid email format");
    }
    if (!validatePassword(password)) {
      validationErrors.push("Password must be at least 8 characters long");
    }
    if (!validatefullName(fullName)) {
      validationErrors.push("Full name must be between 2 and 50 characters");
    }
    if (!leetcodeUsername?.trim()) {
      validationErrors.push("LeetCode username is required");
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    const existingEmailUser = await User.findOne({
      email: new RegExp(`^${email}$`, 'i')
    });

    if (existingEmailUser) {
      return res.status(400).json({
        message: "Email is already registered"
      });
    }

    try {
      const isValidLeetCodeUsername = await checkLeetCodeUsername(leetcodeUsername);
      if (!isValidLeetCodeUsername) {
        return res.status(400).json({
          message: "LeetCode username not found or invalid"
        });
      }
    } catch (error) {
      console.error("LeetCode username verification failed:", error);
      return res.status(503).json({
        message: "Unable to verify LeetCode username. Please try again later."
      });
    }

    const username = await generateUsername(fullName);
    const defaultAvatar = "https://ui-avatars.com/api/?background=random";
    const avatarUrl = `${defaultAvatar}&name=${encodeURIComponent(fullName)}`;

    const hashedPassword = await bcrypt.hash(password, 12);

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
          questionsSolvedByDifficulty: { easy: 0, medium: 0, hard: 0 },
          attendedContestsCount: 0,
          contestRating: 0,
          lastUpdated: new Date()
        }
      },
      createdAt: new Date(),
      lastLogin: new Date()
    });

    await newUser.save();

    let updatedUser = newUser;
    try {
      updatedUser = await updateUserLeetCodeStats(newUser, false, true);
    } catch (statsError) {
      console.error("Initial LeetCode stats fetch failed:", statsError);
    }

    const token = jwt.sign(
      {
        id: updatedUser._id,
        username: updatedUser.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

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

    const user = await User.findOne({
      email: new RegExp(`^${email}$`, 'i')
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Update failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = new Date();
      await user.save();

      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    let updatedUser = user;
    try {
      updatedUser = await updateUserLeetCodeStats(user);
    } catch (statsError) {
      console.error("LeetCode stats update failed during login:", statsError);
    }

    const token = jwt.sign(
      {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

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