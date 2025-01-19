const User = require('../models/User');

exports.getPublicUserProfile = async (req, res) => {
    try {
        // Get username from URL parameter
        const username = req.params.username;
        // Find user by username, exclude sensitive information
        const user = await User.findOne({ username }).select('-password -_id')

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};