const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Not authorized, token missing" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log(decoded);
      req.user = await User.findById(decoded.id).select("-password");

      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      // Update lastActiveAt if more than 1 hour has passed
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      if (!req.user.lastActiveAt || req.user.lastActiveAt < oneHourAgo) {
        // Update in background without blocking the request
        User.findByIdAndUpdate(
          req.user._id,
          { lastActiveAt: now },
          { new: false }
        ).catch(error => {
          console.error('Failed to update lastActiveAt:', error);
        });
      }

      next();
    } catch (error) {
      // Token verification errors
      console.error('Token verification error:', error.message); // Log only the message

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired for user" });
      } else if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      } else {
        return res.status(401).json({ message: "Not authorized, token failed" });
      }
    }
  } else {
    // No Authorization header or no Bearer token
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };
