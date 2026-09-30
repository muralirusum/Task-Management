import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogWorkModal } from '../components/dailywork/LogWorkModal';
import {
  FileText,
  Plus,
  Clock,
  Calendar,
  User,
  Folder,
  Trash2,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const DailyWorkPage = () => {
  const { user, isMain, isMiddle, isLast } = useAuth();
  const [entries, setEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLogWorkOpen, setIsLogWorkOpen] = useState(false);

  const fetchDailyWork = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedUser) params.userId = selectedUser;
      if (selectedDate) params.date = selectedDate;

      const res = await api.get('/daily-work', { params });
      if (res.success) {
        setEntries(res.entries || []);
      }
    } catch (err) {
      console.error('Failed to load daily work entries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadEmployees = async () => {
      if (isMain || isMiddle) {
        try {
          const res = await api.get('/users');
          if (res.success && res.users) {
            setEmployees(res.users);
          }
        } catch (err) {
          console.error('Failed to load employees', err);
        }
      }
    };
    loadEmployees();
  }, [user?._id]);

  useEffect(() => {
    fetchDailyWork();
  }, [user?._id, selectedUser, selectedDate]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this work log?')) return;
    try {
      const res = await api.delete(`/daily-work/${id}`);
      if (res.success) {
        fetchDailyWork();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete work entry');
    }
  };

  const totalMinutes = entries.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Daily Work Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            "What did the employee actually do today?" — Continuous time & activity logger
          </p>
        </div>

        <button
          onClick={() => setIsLogWorkOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          Log New Activity
        </button>
      </div>

      {/* Stats and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Total Time Summary Card */}
        <div className="md:col-span-4 glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Time in View</p>
            <h3 className="text-2xl font-black text-indigo-300 font-mono mt-1">
              {totalHours}h {remainingMins}m
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{entries.length} log entries recorded</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Filters */}
        <div className="md:col-span-8 glass-card p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3">
          {(isMain || isMiddle) && (
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Employee</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- All Accessible Employees --</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name} ({e.position})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="mt-4 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Daily Work Timeline */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Work Log Activity Stream</h3>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading daily work logs...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-white">No Daily Work Recorded</p>
            <p className="text-[11px] text-slate-400">Click "Log New Activity" to record what you worked on.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={entry.userId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                    alt={entry.userId?.name}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-700 mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white">{entry.title}</h4>
                      <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.2 rounded border border-indigo-500/20">
                        {entry.product} • {entry.project}
                      </span>
                    </div>

                    {entry.description && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{entry.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 flex-wrap">
                      <span className="font-semibold text-slate-200">{entry.userId?.name}</span>
                      <span>•</span>
                      <span>{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {entry.taskId && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-400">Task: {entry.taskId.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-mono font-bold text-indigo-300">
                      {entry.startTime} - {entry.endTime}
                    </p>
                    <p className="text-[10px] text-slate-400">{entry.durationMinutes} minutes</p>
                  </div>

                  {(entry.userId?._id === user?._id || isMain) && (
                    <button
                      onClick={() => handleDelete(entry._id)}
                      title="Delete Log"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LogWorkModal
        isOpen={isLogWorkOpen}
        onClose={() => setIsLogWorkOpen(false)}
        onWorkLogged={() => {
          fetchDailyWork();
        }}
      />
    </div>
  );
};
