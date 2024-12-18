const crypto = require('crypto');

const secretKey = process.env.CRYPTO_SECRET;
const algorithm = "aes-256-cbc";
const iv = crypto.randomBytes(16);

// Encrypt the message
exports.encrypt = (plainText) => {
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
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), Buffer.from(ivHex, "hex"));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
