import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL  = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_BASE = `${API_URL}/api`;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

/* ── helpers for persisting known emails ── */
const KNOWN_EMAILS_KEY = 'knownEmails';

function getKnownEmails() {
  try {
    return JSON.parse(localStorage.getItem(KNOWN_EMAILS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveKnownEmail(email) {
  if (!email) return;
  const list = getKnownEmails();
  if (!list.includes(email)) {
    list.unshift(email);          // most-recent first
    localStorage.setItem(KNOWN_EMAILS_KEY, JSON.stringify(list.slice(0, 10)));
  }
}

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await loadUser();
      } else {
        setLoading(false);
      }
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API_BASE}/user/profile`, {
        timeout: 12000  // 12s — generous but won't hang forever
      });
      setUser(response.data.data);
    } catch (err) {
      // Only logout on 401 (invalid/expired token)
      if (err.response?.status === 401) {
        logout();
      } else {
        // DB timeout, network error, 500 — keep user logged in
        console.warn('Profile load failed (DB may be slow):', err.message);
        // Decode basic info from JWT so the UI still works
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser(prev => prev || { id: payload.id, name: 'User', email: '' });
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  /* shared helper — called after any successful auth */
  const applyAuth = ({ token: newToken, ...userData }) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    saveKnownEmail(userData.email);
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    applyAuth(response.data.data);
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
    applyAuth(response.data.data);
    return response.data;
  };

  /* Google Sign-In — receives the credential (ID token) from @react-oauth/google */
  const googleLogin = async (credential) => {
    const response = await axios.post(`${API_BASE}/auth/google`, { credential });
    applyAuth(response.data.data);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  /* update user in context after profile edit */
  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    getKnownEmails,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
