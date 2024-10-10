import { useState } from 'react';
import api from '../config/api';

const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw new Error(error.response?.data?.message || 'An unexpected error occurred');
    }
  };

  return { login, loading };
};

export default useLogin;