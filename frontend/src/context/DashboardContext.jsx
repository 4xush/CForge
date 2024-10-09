import React, { createContext, useState } from 'react';

// Create a context for the dashboard
export const DashboardContext = createContext();

// Provider component to wrap around the dashboard
export const DashboardProvider = ({ children }) => {
    const [activeSection, setActiveSection] = useState('rooms'); // Default section is 'rooms'
    const [selectedRoom, setSelectedRoom] = useState(null); // Currently selected room

    return (
        <DashboardContext.Provider
            value={{ activeSection, setActiveSection, selectedRoom, setSelectedRoom }}
        >
            {children}
        </DashboardContext.Provider>
    );
};