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
 * Format complete user response with all necessary fields
 * This ensures consistent response format across all auth endpoints
 */
const formatCompleteUserResponse = (user) => {
  return {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    gender: user.gender || null,
    isGoogleAuth: user.isGoogleAuth || false,
    profilePicture: user.profilePicture,
    isProfileComplete: user.isProfileComplete || false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastActiveAt: user.lastActiveAt || user.lastLogin || new Date(),

    // Platform data
    platforms: user.platforms || {
      leetcode: { username: null },
      github: { username: null },
      codeforces: { username: null }
    },

    // Social networks
    socialNetworks: user.socialNetworks || {
      linkedin: "",
      twitter: ""
    },

    // Rate limit info
    rateLimitInfo: {
      dailyApiCalls: user.rateLimitInfo?.dailyApiCalls || 0,
      lastApiCallReset: user.rateLimitInfo?.lastApiCallReset || new Date(),
      platformRefreshCount: user.rateLimitInfo?.platformRefreshCount || 0,
      lastPlatformRefresh: user.rateLimitInfo?.lastPlatformRefresh || new Date()
    },

    id: user._id.toString() // Include both _id and id for consistency
  };
};

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

    // Return complete user data
    res.status(200).json({
      message: "Google authentication successful",
      token,
      user: formatCompleteUserResponse(user)
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
  try {
    const { fullName, email, password, gender } = req.body;

    // Input validation
    const validationErrors = [];

    if (!fullName?.trim()) validationErrors.push("Full name is required");
    if (!email?.trim()) validationErrors.push("Email is required");
    if (!password?.trim()) validationErrors.push("Password is required");
    if (!gender?.trim()) validationErrors.push("Gender is required");

    if (!validateEmail(email)) validationErrors.push("Invalid email format");
    if (!validatePassword(password)) validationErrors.push("Password must be at least 8 characters long");
    if (!validateFullName(fullName)) validationErrors.push("Full name must be between 2 and 50 characters");
    if (!["male", "female", "other"].includes(gender?.toLowerCase())) {
      validationErrors.push("Gender must be either 'male', 'female', or 'other'");
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({
      email: new RegExp(`^${email.trim()}$`, 'i')
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Generate username and avatar
    const username = await generateUsername(fullName.trim());
    const avatarUrl = `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(fullName.trim())}`;

    // Create user with complete structure
    const newUser = await User.create({
      fullName: fullName.trim(),
      username,
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 12),
      gender: gender.toLowerCase(),
      profilePicture: avatarUrl,
      platforms: {
        leetcode: { username: null },
        github: { username: null },
        codeforces: { username: null }
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
      isGoogleAuth: false,
      lastActiveAt: new Date()
    });

    // Generate JWT token
    const token = generateToken(newUser);

    // Send complete response
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: formatCompleteUserResponse(newUser)
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
      // Handle duplicate key errors
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({ message: "Registration failed. Please try again later." });
  }
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

    // Send complete response with fresh platform data
    res.status(200).json({
      message: "Login successful",
      token,
      user: formatCompleteUserResponse(user)
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