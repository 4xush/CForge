// src/components/RoomDetails.jsx
import React from 'react';

const RoomDetails = ({ room }) => {
    if (!room) {
        return <div className="text-gray-500">Select a room to view its details</div>;
    }

    return (
        <div className="p-4 bg-gray-700 text-white rounded-lg">
            <h3 className="text-lg font-bold">{room.name}</h3>
            <p className="text-sm">Room ID: {room.id}</p>
            <p className="text-sm">Number of members: {room.members.length}</p>
            {/* Add more details or actions here */}
        </div>
    );
};

export default RoomDetails;
