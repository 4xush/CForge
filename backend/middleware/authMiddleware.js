const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('(MiddleW)Decoded Token:', decoded); // Log the decoded token

      // Fetch user data (now includes Fullname, gender, and profilePicture)
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error); // Log the error
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
};

module.exports = { protect };
