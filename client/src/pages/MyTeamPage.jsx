import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { OrgChartView } from '../components/hierarchy/OrgChartView';
import { UserFormModal } from '../components/team/UserFormModal';
import { UserProfilePanel } from '../components/team/UserProfilePanel';
import {
  Users,
  Building,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
  User,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Ban,
  CheckCircle2,
  Eye,
  Trash2
} from 'lucide-react';

export const MyTeamPage = () => {
  const { user, isMain, isManager } = useAuth();
  const [treeData, setTreeData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'managers', 'employees'
  const [viewTab, setViewTab] = useState(isMain ? 'managers' : 'employees'); 

  // Modals & Panels state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [formRoleType, setFormRoleType] = useState('manager'); // 'manager' | 'employee'
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [treeRes, usersRes] = await Promise.all([
        api.get('/users/hierarchy-tree'),
        api.get('/users'),
      ]);

      if (treeRes.success) setTreeData(treeRes.tree || []);
      if (usersRes.success) setEmployees(usersRes.users || []);
    } catch (err) {
      console.error('Failed to load team data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [user?._id]);

  const handleNodeClick = (userId) => {
    setSelectedUserId(userId);
    setIsProfilePanelOpen(true);
  };

  const handleOpenForm = (mode, roleType, existingUser = null) => {
    setFormMode(mode);
    setFormRoleType(roleType);
    setSelectedUserForEdit(existingUser);
    setIsFormModalOpen(true);
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${userName}?`)) return;
    try {
      const res = await api.delete(`/users/${userId}`);
      if (res.success) {
        fetchTeamData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleDisableUser = async (userId, currentStatus) => {
    const action = currentStatus === 'active' ? 'disable' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const res = await api.patch(`/users/${userId}/disable`);
      if (res.success) {
        fetchTeamData(); // Refresh list
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  // Derived Data
  const managers = employees.filter(emp => emp.role === 'middle' || emp.role === 'manager');
  const regularEmployees = employees.filter(emp => emp.role === 'last' || emp.role === 'employee');
  const departments = [...new Set(employees.map(e => e.department))].filter(Boolean);

  const filteredManagers = managers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter ? m.department === deptFilter : true;
    return matchesSearch && matchesDept;
  });

  const filteredEmployees = regularEmployees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter ? e.department === deptFilter : true;
    return matchesSearch && matchesDept;
  });

  const renderUserTable = (users, type) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department & Role</th>
            {type === 'employee' && <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reporting To</th>}
            {type === 'manager' && <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Reports</th>}
            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map(u => {
            const reportsCount = employees.filter(e => e.managerId && (e.managerId._id === u._id || e.managerId === u._id)).length;
            
            return (
              <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                      alt={u.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm font-semibold text-slate-800">{u.position}</p>
                  <p className="text-xs text-slate-500">{u.department}</p>
                </td>
                {type === 'employee' && (
                  <td className="py-3 px-4">
                    {u.managerId ? (
                      <div>
                        <p className="text-sm font-medium text-slate-800">{u.managerId.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Manager</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </td>
                )}
                {type === 'manager' && (
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                      {reportsCount}
                    </span>
                  </td>
                )}
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    u.presenceStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    u.presenceStatus === 'Away' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {u.presenceStatus === 'Active' ? '🟢 ACTIVE' : 
                     u.presenceStatus === 'Away' ? '🟡 AWAY' : '⚫ OFFLINE'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleNodeClick(u._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {isMain && (
                      <>
                        <button 
                          onClick={() => handleOpenForm('edit', type, u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDisableUser(u._id, u.status)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.status === 'active' 
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                              : 'text-amber-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'active' ? "Disable User" : "Activate User"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                No {type}s found matching your criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isMain ? 'Employees & Organization' : 'Organization Hierarchy'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isMain
              ? 'Manage your organizational structure, managers, and employees.'
              : 'View the complete reporting hierarchy of NovaTech Solutions Pvt. Ltd.'}
          </p>
        </div>

        {(isMain || isManager) && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {[...(isMain ? ['managers'] : []), 'employees'].map(tab => (
              <button
                key={tab}
                onClick={() => setViewTab(tab)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  viewTab === tab ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading organization data...</div>
      ) : (
        <>

          {viewTab === 'managers' && isMain && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search managers..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <select 
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => handleOpenForm('create', 'manager')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Manager
                </button>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {renderUserTable(filteredManagers, 'manager')}
              </div>
            </div>
          )}

          {viewTab === 'employees' && (isMain || isManager) && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search employees..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <select 
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => handleOpenForm('create', 'employee')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Employee
                </button>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {renderUserTable(filteredEmployees, 'employee')}
              </div>
            </div>
          )}
        </>
      )}

      {/* Profile Panel Overlay */}
      {isProfilePanelOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsProfilePanelOpen(false)} />
      )}
      
      {/* Profile Panel */}
      <UserProfilePanel 
        userId={selectedUserId} 
        isOpen={isProfilePanelOpen} 
        onClose={() => setIsProfilePanelOpen(false)} 
        onUpdate={fetchTeamData}
      />

      {/* Add/Edit Modal */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        mode={formMode}
        roleType={formRoleType}
        existingUser={selectedUserForEdit}
        onSuccess={fetchTeamData}
      />
    </div>
  );
};
