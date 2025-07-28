const Room = require('../models/Room');
const crypto = require('crypto');

const generateRoomInvite = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if user is an admin of the room
        if (!room.admins.includes(userId) && room.creator.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only room admins can generate invite links'
            });
        }

        // Generate a random invite code
        const inviteCode = crypto.randomBytes(8).toString('hex');

        // Set expiry date to 1 month from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        // Update room with new invite details
        // This will automatically replace any existing invite
        const updatedRoom = await Room.findOneAndUpdate(
            { roomId },
            {
                invite: {
                    code: inviteCode,
                    createdBy: userId,
                    expiresAt: expiryDate
                }
            },
            { new: true }
        );

        // Generate the frontend invite link
        const inviteLink = `${process.env.FRONTEND_URL}/rooms/join/${inviteCode}`;

        return res.status(200).json({
            success: true,
            data: {
                inviteLink,
                expiresAt: expiryDate
            }
        });

    } catch (error) {
        console.error('Error generating room invite:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate room invite'
        });
    }
};

// Verify invite code and get room details
const verifyRoomInvite = async (req, res) => {
    try {
        const { inviteCode } = req.params;

        // Find room with valid invite code
        const room = await Room.findOne({
            'invite.code': inviteCode,
            'invite.expiresAt': { $gt: new Date() }
        }).select('roomId name description isPublic maxMembers members');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired invite link'
            });
        }

        if (room.members.length >= room.maxMembers) {
            return res.status(400).json({
                success: false,
                message: 'Room has reached maximum capacity'
            });
        }

        // Return room details for joining the room
        return res.status(200).json({
            success: true,
            data: {
                roomId: room.roomId,
                name: room.name,
                description: room.description,
                memberCount: room.members.length,
                maxMembers: room.maxMembers,
                isPublic: room.isPublic
            }
        });

    } catch (error) {
        console.error('Error verifying room invite:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify room invite'
        });
    }
};

// Join room using invite code
const joinRoomByInvite = async (req, res) => {
    try {
        const { inviteCode } = req.params;
        const userId = req.user._id;

        // Find room with valid invite code
        const room = await Room.findOne({
            'invite.code': inviteCode,
            'invite.expiresAt': { $gt: new Date() }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Cannot Join! Invalid or expired invite link'
            });
        }

        if (room.members.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this room'
            });
        }

        if (room.members.length >= room.maxMembers) {
            return res.status(400).json({
                success: false,
                message: 'Room has reached maximum capacity'
            });
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            room._id,
            {
                $addToSet: { members: userId }
            },
            { new: true }
        ).select('roomId name');

        return res.status(200).json({
            success: true,
            message: 'Successfully joined the room',
            data: {
                roomId: updatedRoom.roomId,
                name: updatedRoom.name
            }
        });

    } catch (error) {
        console.error('Error joining room:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to join room'
        });
    }
};

module.exports = {
    generateRoomInvite,
    verifyRoomInvite,
    joinRoomByInvite
};
