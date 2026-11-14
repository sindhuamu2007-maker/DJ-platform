import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('aura_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('aura_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (formData) => {
    const res = await api.register(formData);
    if (res.success && res.token) {
      localStorage.setItem('aura_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('aura_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
