import { useState } from 'react';
import axios from 'axios';

const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });

      const { token } = response.data; // Assuming the response contains a token
      localStorage.setItem('token', token); // Save token in local storage

      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  };

  return { login, loading };
};

export default useLogin;
