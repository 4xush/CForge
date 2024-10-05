const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true, // Each message is associated with a specific room
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // The user who sent the message
    },
    content: {
      type: String,
      required: true, // The actual message content
    },
  },
  { timestamps: true }
);

// Add indexes here
messageSchema.index({ room: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
