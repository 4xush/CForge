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
    iv: {
      type: String,
      required: true,
    },
    isEdited: {
      type: Boolean, // Indicates if the message was edited
      default: false,
    },
    editedAt: {
      type: Date,
      default: null
    },
    attachments: {
      type: [String], // Stores an array of attachment URLs
      default: [],
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Indexes for optimizing queries
messageSchema.index({ room: 1, createdAt: -1 }); // For fetching messages in a room, sorted by creation date
messageSchema.index({ sender: 1, createdAt: -1 }); // For fetching messages by sender, sorted by creation date

module.exports = mongoose.model("Message", messageSchema);
