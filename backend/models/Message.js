const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
messageSchema.index({ room: 1, createdAt: -1 }); // Compound index for fetching room messages sorted by timestamp
messageSchema.index({ sender: 1, createdAt: -1 }); // Compound index for filtering messages by sender

module.exports = mongoose.model("Message", messageSchema);
