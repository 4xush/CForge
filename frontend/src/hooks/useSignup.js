import { useState } from "react";
import api from '../config/api';
import toast from 'react-hot-toast';

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

export function handleInputErrors({ fullName, username, password, confirmPassword, gender }) {
    if (!fullName || !username || !password || !confirmPassword || !gender) {
        toast.error("Please fill in all fields");
        return false;
    }
    if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return false;
    }
    if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return false;
    }
    return true;
}

export default useSignup;
