import React from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, Phone, Building, Briefcase, Calendar, Hash, Camera, Loader2 } from 'lucide-react';
import api from '../../services/api';

export const MyProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!isOpen || !user) return null;

  const joinDate = new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

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
        const updateRes = await api.put(`/users/${user._id}`, { avatar: uploadRes.imageUrl });
        if (updateRes.success) {
          // Temporarily force reload or rely on Context updating. 
          // Since we might not have a setAuthUser in context, a reload is simplest to reflect changes instantly everywhere.
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

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">
          {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white mb-4 group">
              <div className="w-full h-full rounded-full overflow-hidden">
                <img 
                  src={user.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Overlay for hover */}
              <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={handleAvatarUpload} />
              </label>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">{user.name}</h2>
            <p className="text-blue-100 text-sm font-medium">{user.position}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-600">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
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
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Department</p>
                <p className="text-sm font-semibold text-slate-800">{user.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-emerald-600">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</p>
                <p className="text-sm font-semibold text-slate-800">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-amber-600">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</p>
                <p className="text-sm font-semibold text-slate-800">{user.phone || 'Not provided'}</p>
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
        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
        </div>
      </div>
    </>,
    document.body
  );
};
