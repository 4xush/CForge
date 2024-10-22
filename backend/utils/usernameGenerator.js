const User = require("../models/User");

// Username generator with retry logic
const generateUsername = async (fullName, maxAttempts = 5) => {
    const nameParts = fullName.toLowerCase().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const randomNum = Math.floor(Math.random() * 10000);
        const username = `${firstName}${lastName}${randomNum}`;

        const exists = await checkUsernameExists(username);
        if (!exists) return username;
    }

    throw new Error("Unable to generate unique username. Please try again.");
};

const checkUsernameExists = async (username) => {
    try {
        const existingUser = await User.findOne({ username });
        return !!existingUser;
    } catch (error) {
        throw new Error("Database error while checking username");
    }
};

module.exports = generateUsername;
