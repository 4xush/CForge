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

const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Hash the email as the password
      const hashedPassword = await bcrypt.hash(email, 12);

      // Create new user
      user = await User.create({
        fullName: name,
        email,
        username: email.split('@')[0], // Simple username creation
        googleId: sub,
        profilePicture: picture,
        isGoogleAuth: true,
        password: hashedPassword, // Set password as email
        platforms: {
          leetcode: { username: null },
          github: { username: null },
          codeforces: { username: null },
        },
        isProfileComplete: false, // Align with signupUser
      });
    } else if (!user.googleId) {
      // Link Google ID to existing account
      user.googleId = sub;
      if (!user.profilePicture && picture) {
        user.profilePicture = picture;
      }
      if (!user.password) {
        user.password = await bcrypt.hash(email, 12); // Set password if not present
      }
      if (!user.gender) {
        user.gender = "other"; // Set default gender if missing
      }
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data and token aligned with signupUser and login
    res.status(200).json({
      message: "Google authentication successful",
      user: {
        _id: user._id.toString(), // Include _id
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        platforms: user.platforms || {
          leetcode: { username: null },
          github: { username: null },
          codeforces: { username: null },
        },
        isProfileComplete: user.isProfileComplete || false,
      },
      token,
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

/**
 * Refresh token endpoint - creates a new token for authenticated users
 * Uses the current token to generate a new one with extended expiry
 */
const refreshToken = async (req, res) => {
  try {
    // The user is already authenticated through the auth middleware
    // We just need to generate a new token
    const userId = req.user.id;
    
    // Verify user still exists and is active
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Generate a new JWT token with extended expiration
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" } // Can be adjusted as needed
    );
    
    // Return the new token
    res.status(200).json({
      message: "Token refreshed successfully",
      token
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Failed to refresh token. Please log in again." });
  }
};

signupUser = async (req, res) => {
  const { fullName, email, password, gender } = req.body;

  try {
    // Input validation
    const validationErrors = [];

    // Basic field validations
    if (!validateEmail(email)) validationErrors.push("Invalid email format");
    if (!validatePassword(password)) validationErrors.push("Password must be at least 8 characters long");
    if (!validateFullName(fullName)) validationErrors.push("Full name must be between 2 and 50 characters");
    if (!["male", "female", "other"].includes(gender?.toLowerCase())) {
      validationErrors.push("Gender must be either 'male', 'female', or 'other'");
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }

    // Check if email is already registered
    const existingEmailUser = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (existingEmailUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Generate username and avatar
    const username = await generateUsername(fullName);
    const avatarUrl = `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(fullName)}`;

    // Create user object with empty platform structure
    const newUser = new User({
      fullName: fullName.trim(),
      username,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 12),
      gender: gender.toLowerCase(),
      profilePicture: avatarUrl,
      platforms: {
        leetcode: { username: null },
        github: { username: null },
        codeforces: { username: null }
      },
      isProfileComplete: false // New field to track if user has added platform usernames
    });

    // Validate and save user
    await newUser.validate();
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Send response
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        profilePicture: newUser.profilePicture,
        platforms: newUser.platforms,
        isProfileComplete: newUser.isProfileComplete
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
      return res.status(400).json({ message: "Username already exists" });
    }
    res.status(500).json({ message: "Registration failed. Please try again later." });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Input validation
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Find user
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Send response
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
    res.status(500).json({ message: "Login failed. Please try again later." });
  }
};

module.exports = {
  signupUser,
  login,
  googleAuth,
  refreshToken
};