const { OAuth2Client } = require('google-auth-library');
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  validateEmail,
  validatePassword,
  validateFullName,
} = require("../utils/authHelpers.js");
const generateUsername = require("../utils/usernameGenerator");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


/**
 * Generate JWT token with consistent payload
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

/**
 * Google OAuth authentication
 */
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    if (!email || !name) {
      return res.status(400).json({ message: "Invalid Google token payload" });
    }

    // Check if user already exists
    let user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Generate username for new user
      const username = await generateUsername(name);

      // Create new user
      user = await User.create({
        fullName: name,
        email: email.toLowerCase(),
        username,
        googleId: sub,
        profilePicture: picture || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(name)}`,
        isGoogleAuth: true,
        password: await bcrypt.hash(email + sub, 12), // Secure password based on email + googleId
        platforms: {
          leetcode: { username: null },
          github: { username: null },
          codeforces: { username: null },
        },
        socialNetworks: {
          linkedin: "",
          twitter: ""
        },
        rateLimitInfo: {
          dailyApiCalls: 0,
          lastApiCallReset: new Date(),
          platformRefreshCount: 0,
          lastPlatformRefresh: new Date()
        },
        isProfileComplete: false,
        lastActiveAt: new Date()
      });
    } else {
      // Update existing user
      const updates = {
        lastActiveAt: new Date(),
        lastLogin: new Date()
      };

      if (!user.googleId) {
        updates.googleId = sub;
        updates.isGoogleAuth = true;
      }

      if (!user.profilePicture && picture) {
        updates.profilePicture = picture;
      }

      // Ensure social networks and rate limit info exist
      if (!user.socialNetworks) {
        updates.socialNetworks = { linkedin: "", twitter: "" };
      }

      if (!user.rateLimitInfo) {
        updates.rateLimitInfo = {
          dailyApiCalls: 0,
          lastApiCallReset: new Date(),
          platformRefreshCount: 0,
          lastPlatformRefresh: new Date()
        };
      }

      await User.findByIdAndUpdate(user._id, updates, { new: true });
      user = await User.findById(user._id); // Get updated user
    }

    // Refresh platform data for existing users (not new users as they don't have platform usernames yet)

    // Generate JWT token
    const token = generateToken(user);

    // Return minimal user data for Google authentication
    res.status(200).json({
      message: "Google authentication successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        platforms: user.platforms,
        isProfileComplete: user.isProfileComplete
      }
    });

  } catch (error) {
    console.error('Google authentication error:', error);

    if (error.message.includes('Token used too early') || error.message.includes('Invalid token')) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    res.status(500).json({ message: 'Google authentication failed. Please try again.' });
  }
};

/**
 * Refresh token endpoint
 */
const refreshToken = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user still exists and is active
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Update last active timestamp
    await User.findByIdAndUpdate(userId, {
      lastActiveAt: new Date()
    });

    // Generate a new JWT token
    const token = generateToken(user);

    res.status(200).json({
      message: "Token refreshed successfully",
      token
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Failed to refresh token. Please log in again." });
  }
};

/**
 * User registration
 */
const signupUser = async (req, res) => {
  // Direct signup is disabled, only Google Auth is allowed
  return res.status(403).json({
    message: "Direct signup is currently disabled. Please use Google Authentication instead.",
    googleAuthRequired: true
  });
};

/**
 * User login with platform refresh
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Find user
    const user = await User.findOne({
      email: new RegExp(`^${email.trim()}$`, 'i')
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update login timestamp and last active
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      lastActiveAt: new Date()
    });

    // Generate JWT token
    const token = generateToken(user);

    // Send minimal response (no extra data)
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        platforms: user.platforms,
        isProfileComplete: user.isProfileComplete
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Invalid input data" });
    }

    res.status(500).json({ message: "Login failed. Please try again later." });
  }
};

/**
 * Logout endpoint (optional - for server-side token blacklisting)
 */
const logout = async (req, res) => {
  try {
    // If you implement token blacklisting, add the logic here
    // For now, just acknowledge the logout

    const userId = req.user?.id;
    if (userId) {
      // Update last active timestamp
      await User.findByIdAndUpdate(userId, {
        lastActiveAt: new Date()
      });
    }

    res.status(200).json({
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

module.exports = {
  signupUser,
  login,
  googleAuth,
  refreshToken,
  logout
};