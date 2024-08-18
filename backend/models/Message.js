const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
