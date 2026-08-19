import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, User, Mail, Phone, Briefcase, Building, Lock, ShieldCheck, UserCheck, Image as ImageIcon, Loader2 } from 'lucide-react';

export const UserFormModal = ({ isOpen, onClose, mode = 'create', roleType = 'manager', existingUser = null, onSuccess }) => {
  const { user, isMain } = useAuth();
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    password: '',
    managerId: '',
    status: 'active',
    avatar: '',
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && existingUser) {
        setFormData({
          name: existingUser.name || '',
          email: existingUser.email || '',
          phone: existingUser.phone || '',
          department: existingUser.department || '',
          position: existingUser.position || '',
          password: '', // Keep blank unless changing
          managerId: existingUser.managerId?._id || existingUser.managerId || '',
          status: existingUser.status || 'active',
          avatar: existingUser.avatar || '',
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          department: '',
          position: '',
          password: '',
          managerId: '',
          status: 'active',
          avatar: '',
        });
      }

      // Fetch managers if we are creating/editing an employee
      if (roleType === 'employee') {
        fetchManagers();
      }
    }
  }, [isOpen, mode, existingUser, roleType]);

  const fetchManagers = async () => {
    try {
      const res = await api.get('/users');
      if (res.success) {
        const onlyManagers = res.users.filter(u => u.role === 'middle' || u.role === 'manager');
        setManagers(onlyManagers);
      }
    } catch (err) {
      console.error('Failed to fetch managers', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const data = new FormData();
    data.append('image', file);

    try {
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setFormData(prev => ({ ...prev, avatar: res.imageUrl }));
      } else {
        alert('Upload failed: ' + res.message);
      }
    } catch (err) {
      console.error('File upload error', err);
      alert('File upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      
      // Determine backend role based on UI roleType
      if (mode === 'create') {
        payload.role = roleType === 'manager' ? 'middle' : 'last';
      }

      // If manager dropdown wasn't used or creating a manager, managerId is null/undefined
      if (roleType === 'manager' || !payload.managerId) {
        delete payload.managerId;
      }

      // Don't send empty password on edit
      if (mode === 'edit' && !payload.password) {
        delete payload.password;
      }

      let res;
      if (mode === 'create') {
        res = await api.post('/users', payload);
      } else {
        res = await api.put(`/users/${existingUser._id}`, payload);
      }

      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  if (!isMain) return null; // Only L1/CEO can use this modal

  const Icon = roleType === 'manager' ? UserCheck : User;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? `Add New ${roleType === 'manager' ? 'Manager' : 'Employee'}` : `Edit ${roleType === 'manager' ? 'Manager' : 'Employee'}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-900">
              {roleType === 'manager' ? 'Level 2 Manager Account' : 'Level 3 Employee Account'}
            </h4>
            <p className="text-xs text-indigo-700">
              {roleType === 'manager' 
                ? 'Managers can review employee submissions and approve tasks.' 
                : 'Employees log daily work and submit tasks to their reporting manager.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Profile Avatar
            </label>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                ) : formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadingAvatar}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Work Email
            </label>
            <input
              type="email"
              name="email"
              required
              disabled={mode === 'edit'}
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="john@novatech.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" /> Department
            </label>
            <input
              type="text"
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Engineering"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Designation / Position
            </label>
            <input
              type="text"
              name="position"
              required
              value={formData.position}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Frontend Developer"
            />
          </div>

          {roleType === 'employee' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Reporting Manager
              </label>
              <select
                name="managerId"
                required={roleType === 'employee'}
                value={formData.managerId}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Manager --</option>
                {managers.map(m => (
                  <option key={m._id} value={m._id}>{m.name} ({m.department})</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> {mode === 'edit' ? 'New Password (Optional)' : 'Temporary Password'}
            </label>
            <input
              type="text"
              name="password"
              required={mode === 'create'}
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              placeholder={mode === 'edit' ? 'Leave blank to keep current' : 'Set initial password'}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Account Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive (Disabled)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Saving...' : mode === 'create' ? `Create ${roleType === 'manager' ? 'Manager' : 'Employee'}` : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
