const Message = require("../models/Message");
const Room = require("../models/Room");

const sendMessage = async (req, res) => {
  const { roomId } = req.params;
  const { content } = req.body;

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const newMessage = await Message.create({
      room: roomId,
      sender: req.user._id,
      content,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getRoomMessages = async (req, res) => {
  const { roomId } = req.params;

  try {
    const messages = await Message.find({ room: roomId }).populate(
      "sender",
      "username"
    );
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { sendMessage, getRoomMessages };
