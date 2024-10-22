const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateEmail, validatePassword, validatefullName, checkLeetCodeUsername, generateAvatarUrl } = require("../utils/authHelpers.js");
const generateUsername = require("../utils/usernameGenerator");
const { getLeetCodeStats } = require("../services/leetcodeService");

const updateUserLeetCodeStats = async (user, throwError = false) => {
  try {
    // Validate user object
    if (!user?._id || !user?.platforms?.leetcode?.username) {
      const error = new Error("Invalid user data or missing LeetCode username");
      error.code = "INVALID_USER_DATA";
      throw error;
    }

    const leetcodeUsername = user.platforms.leetcode.username;

    // Fetch LeetCode stats
    const stats = await getLeetCodeStats(leetcodeUsername);

    // Validate stats response
    if (!stats || typeof stats.totalQuestionsSolved !== 'number') {
      const error = new Error("Invalid LeetCode API response");
      error.code = "INVALID_LEETCODE_RESPONSE";
      throw error;
    }

    // Prepare stats update object with default values as fallback
    const statsToUpdate = {
      "platforms.leetcode.totalQuestionsSolved": stats.totalQuestionsSolved || 0,
      "platforms.leetcode.questionsSolvedByDifficulty.easy": stats.questionsSolvedByDifficulty?.easy || 0,
      "platforms.leetcode.questionsSolvedByDifficulty.medium": stats.questionsSolvedByDifficulty?.medium || 0,
      "platforms.leetcode.questionsSolvedByDifficulty.hard": stats.questionsSolvedByDifficulty?.hard || 0,
      "platforms.leetcode.attendedContestsCount": stats.attendedContestsCount || 0,
      "platforms.leetcode.contestRating": stats.contestRating || 0,
      "platforms.leetcode.lastUpdated": new Date()
    };

    // Update user document
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: statsToUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      const error = new Error("User not found during stats update");
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    return updatedUser;

  } catch (error) {
    console.error(`LeetCode stats update failed for user ${user?._id}:`, {
      error: error.message,
      code: error.code,
      stack: error.stack
    });

    if (throwError) {
      throw error;
    }

    // Return original user if update fails and throwError is false
    return user;
  }
};

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

    // Check for existing email (case-insensitive)
    const existingEmailUser = await User.findOne({
      email: new RegExp(`^${email}$`, 'i')
    });

    if (existingEmailUser) {
      return res.status(400).json({
        message: "Email is already registered"
      });
    }

    // Verify LeetCode username existence
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

    // Generate username
    const username = await generateUsername(fullName);

    // Generate avatar URL
    let avatarUrl = '';
    if (['male', 'female'].includes(gender.toLowerCase())) {
      avatarUrl = generateAvatarUrl(gender, username);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
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

    // Update LeetCode stats
    let updatedUser = newUser;
    try {
      updatedUser = await updateUserLeetCodeStats(newUser, false);
    } catch (statsError) {
      console.error("Initial LeetCode stats fetch failed:", statsError);
      // Continue with signup process
    }

    // Generate JWT
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
        username: updatedUser.username,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        leetcodeStats: updatedUser.platforms.leetcode
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

    // Find user (case-insensitive)
    const user = await User.findOne({
      email: new RegExp(`^${email}$`, 'i')
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // Check account lock
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes
    if (user.failedLoginAttempts >= 5 &&
      user.lastFailedLogin &&
      (Date.now() - user.lastFailedLogin.getTime()) < lockoutDuration) {
      const remainingLockTime = Math.ceil(
        (lockoutDuration - (Date.now() - user.lastFailedLogin.getTime())) / 60000
      );
      return res.status(429).json({
        message: `Account temporarily locked. Please try again in ${remainingLockTime} minutes.`
      });
    }

    // Verify password
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

    // Reset failed attempts and update last login
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    // Update LeetCode stats
    let updatedUser = user;
    try {
      // Check if stats are stale (more than 1 hour old)
      const isStale = !user.platforms?.leetcode?.lastUpdated ||
        (Date.now() - user.platforms.leetcode.lastUpdated.getTime()) > 3600000;

      if (isStale) {
        updatedUser = await updateUserLeetCodeStats(user, false);
      }
    } catch (statsError) {
      console.error("LeetCode stats update failed during login:", statsError);
      // Continue with login process
    }

    // Generate JWT
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
        username: updatedUser.username,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        leetcodeStats: updatedUser.platforms.leetcode
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