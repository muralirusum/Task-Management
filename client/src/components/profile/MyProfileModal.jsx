import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, Phone, Building, Briefcase, Calendar, Hash, Camera, Loader2, Pencil, Check } from 'lucide-react';
import api from '../../services/api';

export const MyProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Initialize editData when entering edit mode
  React.useEffect(() => {
    if (isEditing && user) {
      setEditData({
        name: user.name || '',
        position: user.position || '',
        department: user.department || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [isEditing, user]);

  if (!isOpen || !user) return null;

  const joinDate = new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const data = new FormData();
    data.append('image', file);

    try {
      const uploadRes = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.success) {
        // Now update the user profile
        if (updateProfile) {
          await updateProfile({ avatar: uploadRes.imageUrl });
        } else {
          await api.put(`/users/${user._id}`, { avatar: uploadRes.imageUrl });
          window.location.reload();
        }
      } else {
        alert('Upload failed: ' + uploadRes.message);
      }
    } catch (err) {
      console.error('File upload error', err);
      alert('File upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (updateProfile) {
      await updateProfile(editData);
    } else {
      await api.put(`/users/${user._id}`, editData);
      window.location.reload();
    }
    setIsEditing(false);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">
          {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isEditing ? (
              <button onClick={handleSave} className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/40 transition-colors" title="Save Profile">
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors" title="Edit Profile">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => { setIsEditing(false); onClose(); }}
              className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white mb-4 group">
              <div className="w-full h-full rounded-full overflow-hidden">
                <img 
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer transition-opacity">
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={handleAvatarUpload} />
                </label>
              )}
            </div>
            
            {isEditing ? (
              <input 
                type="text" 
                value={editData.name} 
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                className="text-center font-bold text-slate-800 bg-white/90 rounded px-2 py-1 mb-1 outline-none focus:ring-2 focus:ring-indigo-300 w-3/4"
                placeholder="Your Name"
              />
            ) : (
              <h2 className="text-xl font-bold text-white tracking-wide">{user.name}</h2>
            )}
            
            {isEditing ? (
              <input 
                type="text" 
                value={editData.position} 
                onChange={(e) => setEditData({...editData, position: e.target.value})}
                className="text-center text-sm font-medium text-slate-700 bg-white/80 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-300 w-2/3"
                placeholder="Your Position"
              />
            ) : (
              <p className="text-blue-100 text-sm font-medium">{user.position}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-600">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role</p>
                <p className="text-sm font-semibold text-slate-800 capitalize">
                  {user.role} <span className="text-xs text-slate-500 font-normal">(Level {user.level})</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-600">
                <Building className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Department</p>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editData.department} 
                    onChange={(e) => setEditData({...editData, department: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{user.department}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-emerald-600">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</p>
                {isEditing ? (
                  <input 
                    type="email" 
                    value={editData.email} 
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{user.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-amber-600">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</p>
                {isEditing ? (
                  <input 
                    type="tel" 
                    value={editData.phone} 
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{user.phone || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Member Since</p>
                <p className="text-sm font-semibold text-slate-800">{joinDate}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Staff ID</p>
                <p className="text-sm font-semibold text-slate-800 uppercase">{user._id.substring(user._id.length - 8)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={isEditing ? handleSave : onClose}
            className={`px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${
              isEditing ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isEditing ? 'Save Changes' : 'Close'}
          </button>
        </div>
        </div>
      </div>
    </>,
    document.body
  );
};
