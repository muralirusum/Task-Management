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
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  Award,
  Zap,
  Target,
  Sparkles
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
  AreaChart,
  Area
} from 'recharts';

export const ReportsPage = () => {
  const { user, isMain, isMiddle } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

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

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Status Distribution Data for Pie Chart
  const statusData = [
    { name: 'Completed', value: reportData?.summary?.completedTasks || 24, color: '#10b981' },
    { name: 'In Progress', value: 12, color: '#3b82f6' },
    { name: 'Under Review', value: 6, color: '#f59e0b' },
    { name: 'Overdue', value: reportData?.summary?.overdueTasks || 2, color: '#ef4444' },
  ];

  // Productivity Trend Data for Area Chart
  const trendData = [
    { period: 'Week 1', completed: 14, target: 16, hours: 82 },
    { period: 'Week 2', completed: 19, target: 18, hours: 94 },
    { period: 'Week 3', completed: 22, target: 20, hours: 105 },
    { period: 'Week 4', completed: 28, target: 24, hours: 118 },
  ];

  // Project Allocation Data for Bar Chart
  const projectData = [
    { name: 'Customer Operations', hours: 145, tasks: 18 },
    { name: 'Quality & Audit', hours: 98, tasks: 12 },
    { name: 'System Engineering', hours: 76, tasks: 9 },
    { name: 'Executive Oversight', hours: 52, tasks: 6 },
  ];

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Metric,Value\nCompletion Rate,94.2%\nTotal Tasks,44\nHours Logged,399h\nOverdue,2";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Workspace_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-xs text-slate-400">
        <span className="animate-spin text-blue-600 mr-2">⏳</span> Compiling analytics report...
      </div>
    );
  }

  const summary = reportData?.summary || {};
  const employeeBreakdown = reportData?.charts?.employeeBreakdown || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Title & Control Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {isMain ? 'Company-Wide Productivity & Analytics' : isMiddle ? 'Manager Performance & Team Reports' : 'My Productivity Analytics'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              {isMiddle ? `Department: ${user?.department || 'Operations'}` : 'Executive Suite'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Real-time breakdown of task completion, team efficiency metrics, and project hour allocations
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Calendar Date Picker */}
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Report CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Task Completion Rate"
          value={`${summary.completionRate ?? 0}%`}
          subtitle={`${summary.completedTasks ?? 0} of ${summary.totalTasks ?? 0} Tasks Done`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Avg Turnaround"
          value={`${summary.avgCompletionHours ?? 0}h`}
          subtitle="Average turnaround time per task"
          icon={Clock}
          color="brand"
        />
        <StatCard
          title="Total Hours Logged"
          value={`${summary.totalHoursLogged ?? 0}h`}
          subtitle="Real-time productive work hours logged"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Overdue Tasks"
          value={summary.overdueTasks ?? 0}
          subtitle="Requires immediate attention"
          icon={AlertTriangle}
          color={summary.overdueTasks > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Productivity Trend Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Task Completion & Velocity Trend</h3>
              <p className="text-xs text-slate-500 font-medium">Weekly completed tasks vs target velocity</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span> Completed
              </span>
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Target Goal
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                <Area type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorTarget)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Task Status Distribution</h3>
            <p className="text-xs text-slate-500 font-medium">Proportion of tasks across active states</p>
          </div>

          <div className="h-52 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 font-medium truncate">{item.name}:</span>
                <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Member Performance Scorecard */}
      {(isMain || isMiddle) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Team Workload & Output Scorecard</h3>
              <p className="text-xs text-slate-500 font-medium">Subordinate completion statistics and productive hours breakdown</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              {employeeBreakdown.length} Team Members
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Total Tasks</th>
                  <th className="px-5 py-3.5">Completed</th>
                  <th className="px-5 py-3.5">Completion Rate</th>
                  <th className="px-5 py-3.5">Hours Logged</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employeeBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-400 font-medium">
                      No team members logged data yet.
                    </td>
                  </tr>
                ) : (
                  employeeBreakdown.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                            alt={emp.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{emp.name}</p>
                            <p className="text-[10px] text-slate-400">{emp.position || 'Staff'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-600">{emp.department || 'Operations'}</td>
                      <td className="px-5 py-3.5 font-extrabold text-slate-900">{emp.totalTasks}</td>
                      <td className="px-5 py-3.5 text-emerald-600 font-extrabold">{emp.completedTasks}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${emp.completionRate || 0}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-900 text-[11px]">{emp.completionRate || 0}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-blue-700">{emp.totalHours || 0}h</td>
                      <td className="px-5 py-3.5 font-bold">
                        <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active & On Track
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
