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
  const [previewRole, setPreviewRole] = useState(null);

  // Verify auth on mount and keep session valid across browser refreshes
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
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  const register = async ({ name, full_name, email, password, confirmPassword, role = 'employee', position, department }) => {
    try {
      const res = await api.post('/auth/register', {
        name: name || full_name,
        full_name: full_name || name,
        email,
        password,
        confirmPassword,
        role,
        position,
        department,
      });

      if (res.success) {
        if (res.token) {
          setToken(res.token);
          setUser(res.user);
          localStorage.setItem('novatech_token', res.token);
          localStorage.setItem('novatech_user', JSON.stringify(res.user));
        }
        return { success: true, user: res.user };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('novatech_token', res.token);
        localStorage.setItem('novatech_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
    } catch (err) {
      return { success: false, message: err.message || 'OTP verification failed' };
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await api.post('/auth/resend-otp', { email });
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to resend OTP' };
    }
  };

  const requestDeleteOtp = async () => {
    try {
      const res = await api.post('/auth/request-delete-otp');
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to request delete OTP' };
    }
  };

  const confirmDeleteAccount = async (otp) => {
    try {
      const res = await api.delete('/auth/delete-account', { data: { otp } });
      if (res.success) {
        logout();
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to delete account' };
    }
  };

  const deleteAccountWithPassword = async (password) => {
    try {
      const res = await api.delete('/auth/delete-account-password', { data: { password } });
      if (res.success) {
        logout();
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to delete account' };
    }
  };

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
      return {
        success: false,
        isUnverified: err.isUnverified || false,
        email: err.email || '',
        message: err.message || 'Invalid email or password',
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to request password reset' };
    }
  };

  const resetPassword = async (resetToken, password, confirmPassword) => {
    try {
      const res = await api.post(`/auth/reset-password/${resetToken}`, { password, confirmPassword });
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to reset password' };
    }
  };

  const verifyEmail = async (verificationToken) => {
    try {
      const res = await api.post('/auth/verify-email', { verificationToken });
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to verify email' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPreviewRole(null);
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

  const updateProfile = async (updates) => {
    try {
      const res = await api.put(`/users/${user.id || user._id}`, updates);
      if (res.success) {
        updateLocalUser(res.user);
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to update profile' };
    }
  };

  // Role detection logic
  const isActualCEO = user?.role === 'ceo' || user?.role === 'employer' || user?.role === 'main' || user?.level === 1;
  const effectiveRole = previewRole || user?.role;
  const effectiveLevel = previewRole === 'ceo' || previewRole === 'employer' ? 1 : previewRole === 'manager' ? 2 : previewRole === 'employee' ? 3 : user?.level;

  const isCEO = effectiveRole === 'ceo' || effectiveRole === 'employer' || effectiveRole === 'main' || effectiveLevel === 1;
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
        register,
        verifyOtp,
        resendOtp,
        requestDeleteOtp,
        confirmDeleteAccount,
        deleteAccountWithPassword,
        login,
        forgotPassword,
        resetPassword,
        verifyEmail,
        logout,
        updateLocalUser,
        changePassword,
        updatePresence,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
