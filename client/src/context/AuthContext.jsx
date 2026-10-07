import React, { createContext, useState, useEffect } from 'react';
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  getCurrentUser as apiGetMe,
  updateUserProfile as apiUpdateProfile
} from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await apiGetMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            setToken(storedToken);
          } else {
            handleLogout();
          }
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid token:', err.message);
          handleLogout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      const res = await apiRegister(userData);
      if (res.success && res.data) {
        const { user: registeredUser, token: authToken } = res.data;
        localStorage.setItem('token', authToken);
        setUser(registeredUser);
        setToken(authToken);
        return { success: true, user: registeredUser };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Login function
  const login = async (credentials) => {
    setError(null);
    try {
      const res = await apiLogin(credentials);
      if (res.success && res.data) {
        const { user: loggedInUser, token: authToken } = res.data;
        localStorage.setItem('token', authToken);
        setUser(loggedInUser);
        setToken(authToken);
        return { success: true, user: loggedInUser };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Logout function
  const logout = () => {
    handleLogout();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setError(null);
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const res = await apiUpdateProfile(profileData);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true, user: res.data.user, message: res.message };
      }
      return { success: false, message: res.message || 'Profile update failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Profile update failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    register,
    login,
    logout,
    updateProfile,
    clearError: () => setError(null)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
