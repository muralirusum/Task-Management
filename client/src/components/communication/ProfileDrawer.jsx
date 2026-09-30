import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ShieldCheck,
  Circle,
  Video,
  ExternalLink,
  Clock
} from 'lucide-react';

export const ProfileDrawer = ({ isOpen, onClose, contact, onStartCall }) => {
  if (!isOpen || !contact) return null;

  const getRoleBadge = (u) => {
    if (u.role === 'ceo' || u.role === 'main' || u.level === 1) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
          Executive Director (CEO)
        </span>
      );
    }
    if (u.role === 'manager' || u.role === 'middle' || u.level === 2) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
          Department Manager
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Operations Employee
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-extrabold text-slate-900">User Profile Details</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-6 space-y-6 flex-1">
          <div className="text-center">
            <div className="relative inline-block mb-3">
              <img
                src={contact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160'}
                alt={contact.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md mx-auto"
              />
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">{contact.name}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{contact.position || 'Staff Member'}</p>
            <div className="mt-2">{getRoleBadge(contact)}</div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                if (onStartCall) onStartCall('audio');
              }}
              className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Phone className="w-4 h-4" /> Start Audio Call
            </button>
            <button
              onClick={() => {
                onClose();
                if (onStartCall) onStartCall('video');
              }}
              className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Video className="w-4 h-4" /> Video Call
            </button>
          </div>

          {/* Details List */}
          <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                <p className="font-semibold text-slate-900">{contact.department || 'Operations'} Department</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corporate Email</p>
                <p className="font-semibold text-slate-900 truncate">{contact.email || 'user@cgxptech.com'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Contact</p>
                <p className="font-semibold text-slate-900">{contact.phone || '+91 98765 43210'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                <Circle className="w-4 h-4 fill-emerald-500 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Status</p>
                <p className="font-semibold text-emerald-600 flex items-center gap-1">🟢 Active Now</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Active</p>
                <p className="font-semibold text-slate-700">Just now (Active in workspace)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;
