import { useState } from "react";
import axios from "axios";

const useSignup = () => {
    const [loading, setLoading] = useState(false);

    const signup = async (userData) => {
        setLoading(true);
        try {
            const response = await axios.post("/api/auth/signup", userData);

            const { token } = response.data;
            localStorage.setItem("token", token);
            setLoading(false);
            return response.data;
        } catch (error) {
            setLoading(false);
            if (error.response && error.response.data) {
                throw new Error(error.response.data.message);
            } else {
                throw new Error("An unexpected error occurred");
            }
        }
    };

    return { loading, signup };
};

export default useSignup;

function handleInputErrors({ fullName, username, password, gender }) {
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
