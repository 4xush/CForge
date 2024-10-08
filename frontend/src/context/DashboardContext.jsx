import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const useAuthContext = () => {
    return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(
        JSON.parse(localStorage.getItem("chat-user")) || null
    );

    const [loading, setLoading] = useState(false);  // Optional: loading state
    const [error, setError] = useState(null);       // Optional: error state

    // Optionally handle side-effects like fetching user data from API
    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                // Perform async operation here if needed (like fetching user data)
                // e.g., const userData = await api.getUser();
                setAuthUser(JSON.parse(localStorage.getItem("chat-user")));
            } catch (err) {
                setError("Failed to fetch user data");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    // Logout function to clear user session
    const logout = () => {
        setAuthUser(null);
        localStorage.removeItem("chat-user");
    };

    return (
        <AuthContext.Provider value={{ authUser, setAuthUser, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
