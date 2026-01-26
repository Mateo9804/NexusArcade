import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Forzar la URL base sin el prefijo /api si las rutas están en web.php
axios.defaults.baseURL = 'http://localhost:8000'; 
axios.defaults.headers.post['Content-Type'] = 'application/json';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/me');
      setUser(response.data);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/login', { email, password });
    const { access_token, user: userData } = response.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('token', access_token);
    return response.data;
  };

  const register = async (name, email, password, password_confirmation) => {
    const response = await axios.post('/register', { 
      name, 
      email, 
      password, 
      password_confirmation 
    });
    const { access_token, user: userData } = response.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('token', access_token);
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post('/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
