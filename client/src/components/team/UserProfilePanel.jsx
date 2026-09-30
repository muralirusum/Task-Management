import React, { useState, useEffect } from 'react';
import { Mail, Phone, Briefcase, Building, ShieldCheck, UserCheck, User, X, Activity, Hash, Clock, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const UserProfilePanel = ({ userId, isOpen, onClose, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const isCEO = currentUser?.role === 'ceo' || currentUser?.level === 1 || currentUser?.role === 'main';

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${userId}`);
      if (res.success) {
        setProfile(res);
      }
    } catch (err) {
      console.error('Failed to fetch user profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const res = await api.put(`/users/${userId}`, { presenceStatus: newStatus });
      if (res.success) {
        setProfile({ ...profile, user: { ...profile.user, presenceStatus: newStatus } });
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white border-l border-slate-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between z-10">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" /> Employee Profile
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {loading || !profile ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading profile data...</div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Avatar & Basic Info */}
          <div className="text-center space-y-3">
            <div className="relative inline-block mx-auto">
              <img
                src={profile.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={profile.user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                profile.user.presenceStatus === 'Active' ? 'bg-emerald-500' :
                profile.user.presenceStatus === 'Away' ? 'bg-amber-500' :
                'bg-slate-400'
              }`} />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-slate-900">{profile.user.name}</h2>
              <p className="text-sm font-semibold text-indigo-600">{profile.user.position}</p>
              
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  profile.user.level === 1 ? 'bg-rose-100 text-rose-700' :
                  profile.user.level === 2 ? 'bg-indigo-100 text-indigo-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  Level {profile.user.level} {profile.user.level === 1 ? 'CEO' : profile.user.level === 2 ? 'Manager' : 'Employee'}
                </span>
                
                {isCEO ? (
                  <select
                    value={profile.user.presenceStatus || 'Active'}
                    onChange={handleStatusChange}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer text-center text-center-last appearance-none pr-1 ${
                      profile.user.presenceStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      profile.user.presenceStatus === 'Away' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <option value="Active">🟢 ACTIVE</option>
                    <option value="Away">🟡 AWAY</option>
                    <option value="Offline">⚫ OFFLINE</option>
                  </select>
                ) : (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    profile.user.presenceStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    profile.user.presenceStatus === 'Away' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {profile.user.presenceStatus === 'Active' ? '🟢 ACTIVE' : 
                     profile.user.presenceStatus === 'Away' ? '🟡 AWAY' : '⚫ OFFLINE'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact & Department */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500"><Building className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                <p className="font-medium text-slate-800">{profile.user.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500"><Mail className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="font-medium text-slate-800">{profile.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500"><Phone className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                <p className="font-medium text-slate-800">{profile.user.phone || 'Not provided'}</p>
              </div>
            </div>
            
            {profile.user.managerId && (
              <div className="flex items-center gap-3 text-sm border-t border-slate-200 pt-3 mt-1">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500"><UserCheck className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reports To</p>
                  <p className="font-medium text-slate-800">{profile.user.managerId.name} <span className="text-xs text-slate-500">({profile.user.managerId.position})</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Performance Stats */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Performance Overview</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Hash className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Total Tasks</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{profile.stats.totalTasks}</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Completed</span>
                </div>
                <p className="text-xl font-bold text-emerald-700">{profile.stats.completedTasks}</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">In Progress</span>
                </div>
                <p className="text-xl font-bold text-blue-700">{profile.stats.inProgressTasks}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Pending Appr.</span>
                </div>
                <p className="text-xl font-bold text-amber-700">{profile.stats.pendingApprovalTasks}</p>
              </div>
            </div>
            
            <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-600">Completion Rate</span>
                <span className={profile.stats.completionRate > 70 ? 'text-emerald-600' : 'text-amber-600'}>{profile.stats.completionRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${profile.stats.completionRate > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${profile.stats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
