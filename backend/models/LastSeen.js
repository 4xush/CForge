const mongoose = require("mongoose");

const lastSeenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
        },
        lastSeenMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            required: true,
        },
    },
    { timestamps: true }
);

lastSeenSchema.index({ user: 1, room: 1 }, { unique: true });

module.exports = mongoose.model("LastSeen", lastSeenSchema);
