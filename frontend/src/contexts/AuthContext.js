import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      // Verify token with backend
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      // You could fetch user profile here if needed
    }

    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });

      if (response.data.success) {
        const { token, user } = response.data.data;

        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', user._id);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        setUser(user);
        setIsAuthenticated(true);

        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);

      if (response.data.success) {
        const { token, user } = response.data.data;

        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', user._id);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        setUser(user);
        setIsAuthenticated(true);

        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    delete axios.defaults.headers.common['Authorization'];

    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};