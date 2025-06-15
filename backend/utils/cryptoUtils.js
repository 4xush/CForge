const crypto = require('crypto');
const secretKey = process.env.CRYPTO_SECRET;
const algorithm = "aes-256-cbc";

// Encrypt the message
exports.encrypt = (plainText) => {
    // Generate a NEW IV for each encryption operation
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
        encryptedData: encrypted,
        iv: iv.toString("hex"),
    };
};

// Decrypt the message
exports.decrypt = (encryptedText, ivHex) => {
    // Add input validation
    if (!encryptedText || !ivHex) {
        throw new Error('Missing encrypted text or IV for decryption');
    }

    try {
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), Buffer.from(ivHex, "hex"));
        let decrypted = decipher.update(encryptedText, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
    }
};