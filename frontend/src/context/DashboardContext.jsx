import React, { createContext, useContext, useState } from 'react';

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteDetails, setInviteDetails] = useState(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState(null);

    const contextValue = {
        isSettingsOpen,
        setIsSettingsOpen,
        isInviteModalOpen,
        setIsInviteModalOpen,
        inviteDetails,
        setInviteDetails,
        inviteLoading,
        setInviteLoading,
        inviteError,
        setInviteError,
        resetInviteState: () => {
            setInviteDetails(null);
            setInviteError(null);
            setIsInviteModalOpen(false);
        }
    };

    return (
        <DashboardContext.Provider value={contextValue}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboardContext = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboardContext must be used within a DashboardProvider');
    }
    return context;
};
