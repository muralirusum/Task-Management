import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatCard } from '../components/common/StatCard';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const ReportsPage = () => {
  const { user, isMain, isMiddle, isLast } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports');
        if (res.success) {
          setReportData(res);
        }
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [user?._id]);

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Compiling productivity reports...</div>;
  }

  const summary = reportData?.summary || {};
  const charts = reportData?.charts || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {isMain ? 'Company-Wide Productivity & Analytics' : isMiddle ? 'Team Performance & Reports' : 'My Productivity Analytics'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isMain
            ? 'Departmental performance, completion turnaround times, and total work hours'
            : isMiddle
            ? 'Subordinate task turnaround, hours logged, and completion rates'
            : 'Personal task completion metrics and time expenditure breakdown'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Completion Rate"
          value={`${summary.completionRate || 0}%`}
          subtitle={`${summary.completedTasks} of ${summary.totalTasks} Tasks Done`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Avg Turnaround"
          value={`${summary.avgCompletionHours || 0}h`}
          subtitle="Average hours per completed task"
          icon={Clock}
          color="brand"
        />
        <StatCard
          title="Total Hours Logged"
          value={`${summary.totalHoursLogged || 0}h`}
          subtitle="Productive work time recorded"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Overdue Tasks"
          value={summary.overdueTasks || 0}
          subtitle="Tasks requiring urgent attention"
          icon={AlertTriangle}
          color={summary.overdueTasks > 0 ? 'rose' : 'amber'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Breakdown Chart */}
        <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Tasks by Priority Level</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.priorityBreakdown || []}>
                <XAxis dataKey="priority" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Time Investment */}
        <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Hours Invested by Project / Campaign</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.projectBreakdown || []} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="hours" name="Hours Worked" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Breakdown Table (for Main & Middle) */}
      {(isMain || isMiddle) && charts.employeeBreakdown?.length > 0 && (
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Employee Workload & Performance Scorecard</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Total Tasks</th>
                  <th className="px-5 py-3">Completed</th>
                  <th className="px-5 py-3">Completion Rate</th>
                  <th className="px-5 py-3">Total Hours</th>
                  <th className="px-5 py-3">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {charts.employeeBreakdown.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-800 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={emp.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'}
                          alt={emp.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-semibold text-white">{emp.name}</p>
                          <p className="text-[10px] text-slate-400">{emp.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{emp.department}</td>
                    <td className="px-5 py-3.5 font-bold">{emp.totalTasks}</td>
                    <td className="px-5 py-3.5 text-emerald-400 font-bold">{emp.completedTasks}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${emp.completionRate}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px]">{emp.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-indigo-300 font-bold">{emp.totalHours}h</td>
                    <td className="px-5 py-3.5 font-mono">
                      {emp.overdueTasks > 0 ? (
                        <span className="text-rose-400 font-bold">{emp.overdueTasks} overdue</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
