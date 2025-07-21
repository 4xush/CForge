const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['chat_new_message', 'room_user_joined'],
    index: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  data: {
    roomName: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    messagePreview: {
      type: String,
      maxLength: 100
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  readBy: {
    type: Map,
    of: Date,
    default: new Map()
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ recipients: 1, createdAt: -1 });
notificationSchema.index({ roomId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Instance method to check if notification is read by user
notificationSchema.methods.isReadBy = function(userId) {
  return this.readBy.has(userId.toString());
};

// Instance method to mark as read by user
notificationSchema.methods.markReadBy = function(userId) {
  this.readBy.set(userId.toString(), new Date());
  return this.save();
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId, roomId = null) {
  const query = {
    recipients: userId,
    [`readBy.${userId}`]: { $exists: false }
  };
  
  if (roomId) {
    query.roomId = roomId;
  }
  
  return this.countDocuments(query);
};

// Static method to get notifications for user
notificationSchema.statics.getForUser = function(userId, options = {}) {
  const {
    roomId = null,
    limit = 50,
    skip = 0,
    unreadOnly = false
  } = options;
  
  const query = { recipients: userId };
  
  if (roomId) {
    query.roomId = roomId;
  }
  
  if (unreadOnly) {
    query[`readBy.${userId}`] = { $exists: false };
  }
  
  return this.find(query)
    .populate('triggeredBy', 'username profilePicture')
    .populate('roomId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

module.exports = mongoose.model('Notification', notificationSchema);