import { useState } from "react";
import api from '../config/api';

const useSignup = () => {
    const [loading, setLoading] = useState(false);

    const signup = async (userData) => {
        setLoading(true);
        try {
            const response = await api.post("/auth/signup", userData);
            const { token } = response.data;
            localStorage.setItem("token", token);
            setLoading(false);
            return response.data;
        } catch (error) {
            setLoading(false);
            throw new Error(error.response?.data?.message || "An unexpected error occurred");
        }
    };

    return { loading, signup };
};

export default useSignup;

// This function doesn't need to be changed as it doesn't involve API calls
function handleInputErrors({ fullName, username, password, confirmPassword, gender }) {
    if (!fullName || !username || !password || !confirmPassword || !gender) {
        toast.error("Please fill in all fields");
        return false;
    }
    if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return false;
    }
    return true;
}