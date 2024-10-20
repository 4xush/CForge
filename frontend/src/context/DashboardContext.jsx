import React, { createContext, useState } from 'react';

// Create a context for the dashboard
export const DashboardContext = createContext();

// Provider component to wrap around the dashboard
export const DashboardProvider = ({ children }) => {
    const [activeSection, setActiveSection] = useState('rooms'); // Default section is 'rooms'
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // New state for Settings overlay

    // Value object to be provided to children
    const contextValue = {
        activeSection,
        setActiveSection,
        isSettingsOpen,
        setIsSettingsOpen
    };

    return (
        <DashboardContext.Provider value={contextValue}>
            {children}
        </DashboardContext.Provider>
    );
};