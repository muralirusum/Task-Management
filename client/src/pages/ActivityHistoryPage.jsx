import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ActivityHistoryPage = () => {
  const { user, isMain, isMiddle, isLast } = useAuth();
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter !== 'All') params.action = actionFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/activities', { params });
      if (res.success) {
        setActivities(res.activities || []);
      }
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [user?._id, actionFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {isMain ? 'Organization-Wide Audit & Activity History' : 'Activity & Operation Log'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isMain
            ? 'Complete immutable audit trail of all task assignments, timer events, submissions, and approvals'
            : 'Operational activity history and event timeline'}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity description..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Actions</option>
          <option value="TASK_ASSIGNED">Task Assigned</option>
          <option value="TIMER_STARTED">Timer Started</option>
          <option value="TIMER_STOPPED">Timer Stopped</option>
          <option value="WORK_LOGGED">Work Logged</option>
          <option value="TASK_SUBMITTED">Task Submitted</option>
          <option value="TASK_APPROVED_AND_FORWARDED">Approved & Forwarded</option>
          <option value="TASK_FINAL_APPROVED">Final Approved</option>
          <option value="TASK_REJECTED">Task Rejected</option>
        </select>
      </div>

      {/* Activity Timeline List */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading audit history...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">No activity records match your filter.</div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act._id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 mt-0.5">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{act.userName || act.userId?.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-indigo-300 font-semibold">
                        {act.action?.replace(/_/g, ' ')}
                      </span>
                      {act.taskTitle && (
                        <span className="text-xs text-slate-400">on "{act.taskTitle}"</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{act.description}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] text-slate-400 whitespace-nowrap pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <p className="font-medium text-slate-200">
                    {new Date(act.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
