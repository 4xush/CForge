//////DashboardContext (UI-Related State)

import React, { createContext, useState } from 'react';

// Create a context for the dashboard
export const DashboardContext = createContext();

// Provider component to wrap around the dashboard
export const DashboardProvider = ({ children }) => {
    const [activeSection, setActiveSection] = useState('rooms'); // Default section is 'rooms'
    // to pass this value to child compoenent we need dashboard provider
    return (
        <DashboardContext.Provider value={{ activeSection, setActiveSection }}>
            {children}
        </DashboardContext.Provider>
    );
};
