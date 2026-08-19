import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const SignOutModal = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden text-center p-6">
          <div className="mx-auto w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
          <LogOut className="w-8 h-8 text-rose-500 ml-1" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2">Sign Out</h3>
        <p className="text-sm text-slate-500 mb-8">
          Are you sure you want to sign out of your account? You will need to enter your credentials to access the dashboard again.
        </p>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSignOut}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors shadow-rose-600/20"
          >
            Sign Out
          </button>
        </div>
        </div>
      </div>
    </>,
    document.body
  );
};
