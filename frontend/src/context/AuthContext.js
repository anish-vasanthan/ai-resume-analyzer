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
    list.unshift(email);
    localStorage.setItem(KNOWN_EMAILS_KEY, JSON.stringify(list.slice(0, 10)));
  }
}

/**
 * Ping the /health endpoint to wake the Render free-tier server before
 * making authenticated requests. Render spins down after 15 min of inactivity
 * and the cold-start takes up to 50s. We fire-and-forget with a long timeout
 * so the server is warm by the time the real requests go out.
 */
async function wakeServer() {
  try {
    await axios.get(`${API_URL}/health`, { timeout: 60000 });
  } catch {
    // Ignore — even a failed ping attempt gives the server time to wake
  }
}

export const AuthProvider = ({ children }) => {
  const [user,         setUser]         = useState(null);
  const [token,        setToken]        = useState(localStorage.getItem('token'));
  const [loading,      setLoading]      = useState(true);
  const [serverWaking, setServerWaking] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await loadUser();
      } else {
        // No token — still wake the server in the background so it's ready
        // when the user logs in.
        wakeServer();
        setLoading(false);
      }
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API_BASE}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000  // 60s — Render free tier cold-start can take ~50s
      });
      setUser(response.data.data);
    } catch (err) {
      if (err.response?.status === 401) {
        // Token is genuinely invalid/expired — log out
        logout();
      } else {
        // Timeout or network error — server is waking up but token is fine.
        // Show a warning in the UI and keep the user logged in using JWT data.
        console.warn('Profile load failed (server waking up):', err.message);
        setServerWaking(true);
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser(prev => prev || {
            id:    payload.id,
            name:  payload.name  || 'User',
            email: payload.email || ''
          });
        } catch {}
        // Retry once in the background after 15s — server should be up by then
        setTimeout(async () => {
          try {
            const response = await axios.get(`${API_BASE}/user/profile`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 30000
            });
            setUser(response.data.data);
            setServerWaking(false);
          } catch {
            setServerWaking(false);
          }
        }, 15000);
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

  const googleLogin = async (credential) => {
    const response = await axios.post(`${API_BASE}/auth/google`, { credential });
    applyAuth(response.data.data);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setServerWaking(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const value = {
    user,
    token,
    loading,
    serverWaking,
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
