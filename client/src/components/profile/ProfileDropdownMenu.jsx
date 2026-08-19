import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MyProfileModal } from './MyProfileModal';
import { SecurityModal } from './SecurityModal';
import { SignOutModal } from './SignOutModal';
import { User, ShieldCheck, Activity, LogOut, ChevronRight, Check, Briefcase } from 'lucide-react';

export const ProfileDropdownMenu = () => {
  const { user, updatePresence, isActualCEO, previewRole, setPreviewRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Modals state
  const [showProfile, setShowProfile] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    // Close on Escape key
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  if (!user) return null;

  // Determine role display name
  let roleDisplay = 'Employee';
  if (user.role === 'ceo' || user.role === 'main' || user.level === 1) roleDisplay = 'CEO';
  else if (user.role === 'manager' || user.role === 'middle' || user.level === 2) roleDisplay = 'Manager';

  const roleAccessLevel = roleDisplay === 'CEO' ? 'Executive' : roleDisplay === 'Manager' ? 'Management' : 'Staff';

  const currentStatus = user.presenceStatus || 'Active';

  const handleStatusChange = async (status, e) => {
    e.stopPropagation(); // Don't close dropdown yet
    await updatePresence(status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500';
      case 'Away': return 'bg-amber-500';
      case 'Offline': return 'bg-slate-400';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 pl-2 pr-2 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-xs outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <div className="relative">
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
            alt={user.name}
            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
          />
          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${getStatusColor(currentStatus)}`} />
        </div>
        <div className="text-left hidden lg:block pr-1">
          <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{user.position}</p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
          {/* Header */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                alt={user.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-slate-900 truncate">{user.name}</h4>
              <p className="text-[11px] text-slate-500 truncate mb-1">{user.email}</p>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                <span className="text-[10px] font-bold text-blue-700 tracking-wide uppercase">{roleDisplay}</span>
              </div>
            </div>
          </div>

          {isActualCEO && (
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block px-1">
                CEO Preview Mode
              </label>
              <div className="relative">
                <select
                  value={previewRole || 'ceo'}
                  onChange={(e) => {
                    setPreviewRole(e.target.value === 'ceo' ? null : e.target.value);
                    setIsOpen(false);
                  }}
                  className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow cursor-pointer appearance-none shadow-sm"
                >
                  <option value="ceo">Current View: CEO</option>
                  <option value="manager">Current View: Manager</option>
                  <option value="employee">Current View: Employee</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
              </div>
            </div>
          )}

          <div className="p-2 space-y-1">
            {/* Options */}
            <button 
              onClick={() => { setShowProfile(true); setIsOpen(false); }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">My Profile</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>

            <button 
              onClick={() => { setShowProfile(true); setIsOpen(false); }} // Role details are visible inside Profile too, or we can just make it show profile
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 block">Employee Role</span>
                  <span className="text-[10px] text-slate-500">{roleAccessLevel} Access</span>
                </div>
              </div>
            </button>

            <button 
              onClick={() => { setShowSecurity(true); setIsOpen(false); }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">Security</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>
            
            <div className="px-3 pt-3 pb-2 border-t border-slate-100 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Active Status</span>
              <div className="grid grid-cols-3 gap-1">
                {['Active', 'Away', 'Offline'].map(status => (
                  <button 
                    key={status}
                    onClick={(e) => handleStatusChange(status, e)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      currentStatus === status ? 'border-slate-300 bg-white shadow-sm' : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mb-1 border-2 border-white shadow-sm ${getStatusColor(status)}`} />
                    <span className={`text-[10px] font-bold ${currentStatus === status ? 'text-slate-800' : 'text-slate-500'}`}>{status}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 mt-2 pt-2">
              <button 
                onClick={() => { setShowSignOut(true); setIsOpen(false); }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-rose-50 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-rose-600 transition-colors shadow-sm border border-transparent group-hover:border-rose-100">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-rose-600">Sign Out</span>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modals rendered outside of dropdown flow */}
      <MyProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <SecurityModal isOpen={showSecurity} onClose={() => setShowSecurity(false)} />
      <SignOutModal isOpen={showSignOut} onClose={() => setShowSignOut(false)} />
    </div>
  );
};
