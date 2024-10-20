import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({
        username: 'johndoe',  // Default or fetch from API/localStorage
        email: 'john@example.com',
        profilePicture: '/default-avatar.png',
        platforms: {
            leetcode: {
                username: 'leetcode_john'
            }
        }
    });

    const updateUserData = (field, value) => {
        setUser(prev => {
            if (field === 'leetcodeUsername') {
                return {
                    ...prev,
                    platforms: {
                        ...prev.platforms,
                        leetcode: {
                            ...prev.platforms.leetcode,
                            username: value
                        }
                    }
                };
            }
            return {
                ...prev,
                [field]: value
            };
        });
    };

    return (
        <UserContext.Provider value={{ user, setUser, updateUserData }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};