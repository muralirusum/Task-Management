import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { Trash2, AlertTriangle, X, Lock, Eye, EyeOff, Clock } from 'lucide-react';

export const DeleteAccountModal = ({ isOpen, onClose }) => {
  const { user, deleteAccountWithPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2-Minute Timer State (120 seconds)
  const [timer, setTimer] = useState(120);

  useEffect(() => {
    let interval = null;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, timer]);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShowPassword(false);
      setTimer(120); // Reset timer to 2 minutes on open
    }
  }, [isOpen]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setError('');

    if (timer <= 0) {
      setError('Deletion session expired. Please re-open the dialog to delete account.');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    const res = await deleteAccountWithPassword(password);
    if (!res.success) {
      setError(res.message || 'Incorrect password. Account deletion failed.');
      setLoading(false);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 min-h-screen overflow-y-auto animate-in fade-in">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md my-auto rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 z-10">
        
        {/* Header */}
        <div className="p-6 bg-rose-50/70 border-b border-rose-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Account</h3>
              <p className="text-xs text-rose-700 font-semibold mt-0.5">Password Verification Required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleConfirmDelete} className="p-6 space-y-4">
          
          {/* Warning Banner */}
          <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              You are about to permanently delete your account (<strong>{user?.email}</strong>). Enter your password below to confirm.
            </p>
          </div>

          {/* 2-Minute Timer Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>Deletion Session Expiration</span>
            </div>
            <span className={`font-mono font-bold px-2 py-0.5 rounded-lg ${timer <= 30 ? 'bg-rose-100 text-rose-700 animate-bounce' : 'bg-blue-100 text-blue-700'}`}>
              {formatTimer(timer)}
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center animate-in fade-in">
              {error}
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Account Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={timer <= 0 || loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 transition-all font-semibold disabled:opacity-50"
              />
              <Lock className="w-4 h-4 text-rose-600 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || timer <= 0}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? 'Deleting...' : 'Verify & Delete Account'}
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
};
