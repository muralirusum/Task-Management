import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('novatech_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('novatech_token') || null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);
  const [previewRole, setPreviewRole] = useState(null);

  // Fetch demo accounts list for fast switcher
  useEffect(() => {
    const loadDemoUsers = async () => {
      try {
        const res = await api.get('/auth/demo-users');
        if (res.success) {
          setDemoUsers(res.users);
        }
      } catch (err) {
        console.error('Failed to load demo users', err);
      }
    };
    loadDemoUsers();
  }, []);

  // Verify auth on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('novatech_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.error('Auth verification failed', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('novatech_token', res.token);
        localStorage.setItem('novatech_user', JSON.stringify(res.user));
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const switchDemo = async (email) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/switch-demo', { email });
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('novatech_token', res.token);
        localStorage.setItem('novatech_user', JSON.stringify(res.user));
        setLoading(false);
        return { success: true };
      }
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message || 'Switch failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('novatech_token');
    localStorage.removeItem('novatech_user');
  };

  const updateLocalUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('novatech_user', JSON.stringify(updated));
      return updated;
    });
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.patch('/auth/password', { currentPassword, newPassword });
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to change password' };
    }
  };

  const updatePresence = async (presenceStatus) => {
    try {
      const res = await api.patch('/users/presence', { presenceStatus });
      if (res.success) {
        updateLocalUser({ presenceStatus: res.presenceStatus });
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to update status' };
    }
  };

  const isActualCEO = user?.role === 'ceo' || user?.role === 'main' || user?.level === 1;
  const effectiveRole = previewRole || user?.role;
  const effectiveLevel = previewRole === 'ceo' ? 1 : previewRole === 'manager' ? 2 : previewRole === 'employee' ? 3 : user?.level;

  const isCEO = effectiveRole === 'ceo' || effectiveRole === 'main' || effectiveLevel === 1;
  const isManager = effectiveRole === 'manager' || effectiveRole === 'middle' || effectiveLevel === 2;
  const isEmployee = effectiveRole === 'employee' || effectiveRole === 'last' || effectiveLevel >= 3;

  // Backward-compatible aliases
  const isMain = isCEO;
  const isMiddle = isManager;
  const isLast = isEmployee;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isActualCEO,
        previewRole,
        setPreviewRole,
        isCEO,
        isManager,
        isEmployee,
        isMain,
        isMiddle,
        isLast,
        demoUsers,
        login,
        switchDemo,
        logout,
        updateLocalUser,
        changePassword,
        updatePresence,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
