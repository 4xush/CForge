const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Check if token exists
      if (!token) {
        return res.status(401).json({ message: "Not authorized, token missing" });
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('(MiddleW)Decoded Token:', decoded);

      // Retrieve the user from the decoded token
      req.user = await User.findById(decoded.id).select("-password");

      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      // Continue to the next middleware
      next();
    } catch (error) {
      // Token verification errors
      console.error('Token verification error:', error);

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
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
