// src/context/RoomContext.jsx
import React, { createContext, useContext, useState } from 'react';

export const RoomContext = createContext();

// Create the RoomProvider component
export const RoomProvider = ({ children }) => {
    const [selectedRoom, setSelectedRoom] = useState(null);

    return (
        <RoomContext.Provider value={{ selectedRoom, setSelectedRoom }}>
            {children}
        </RoomContext.Provider>
    );
};

// Custom hook for easier access to RoomContext
export const useRoomContext = () => {
    return useContext(RoomContext);
};
