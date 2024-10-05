// Room.js
import React from 'react';

const Room = ({ name, profileImage }) => {
    return (
        <div className="flex items-center mb-2">
            <img src={profileImage} alt={name} className="w-6 h-6 rounded-full mr-2" />
            <span className="text-sm">{name}</span>
        </div>
    );
};

export default Room;
