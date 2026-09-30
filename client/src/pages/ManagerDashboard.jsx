import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { ReviewTaskModal } from '../components/approvals/ReviewTaskModal';
import {
  Users,
  ShieldCheck,
  UserCheck,
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Bell,
  ArrowRight,
  TrendingUp,
  Plus,
  Eye,
  Building2,
  Clock,
  Sparkles,
  ChevronRight,
  FileSpreadsheet,
  BarChart3,
  FileCheck
} from 'lucide-react';

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('August 2026');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForReview, setTaskForReview] = useState(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Manager 100% Real Data States (Scoped to Department)
  const [teamUsers, setTeamUsers] = useState([]);
  const [deptTasks, setDeptTasks] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [stats, setStats] = useState({
    teamSize: 0,
    activeMembers: 0,
    totalDeptTasks: 0,
    completedTasks: 0,
    pendingApprovalsCount: 0,
    overdueTasks: 0,
  });

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const [dashRes, tasksRes, usersRes, appRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/tasks'),
        api.get('/users'),
        api.get('/approvals/pending')
      ]);

      let allUsers = [];
      if (usersRes.success && Array.isArray(usersRes.users)) {
        allUsers = usersRes.users;
      }

      // Filter users in Manager's Department
      const myDept = user?.department || 'Operations';
      const myTeamUsers = allUsers.filter(u => (u.department || 'Operations') === myDept);
      setTeamUsers(myTeamUsers);

      // Filter tasks in Manager's Department or assigned to/by manager
      let allTasks = [];
      if (tasksRes.success && Array.isArray(tasksRes.tasks)) {
        allTasks = tasksRes.tasks;
      }
      const myDeptTasks = allTasks.filter(t => 
        (t.department || 'Operations') === myDept || 
        t.assignedBy?._id === user?._id ||
        myTeamUsers.some(u => u._id === (t.assignedTo?._id || t.assignedTo))
      );
      setDeptTasks(myDeptTasks);

      // Pending Approvals requiring Manager review
      let pendingList = [];
      if (appRes.success && Array.isArray(appRes.tasks)) {
        pendingList = appRes.tasks;
      } else if (dashRes.success && Array.isArray(dashRes.pendingApprovals)) {
        pendingList = dashRes.pendingApprovals;
      }
      setPendingApprovals(pendingList);

      // Calculate 100% Real Manager Department Stats
      const teamSize = myTeamUsers.length;
      const activeMembers = myTeamUsers.filter(u => u.status === 'active' || u.presenceStatus === 'Active').length;
      const totalDeptTasks = myDeptTasks.length;
      const completedTasks = myDeptTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
      const pendingApprovalsCount = pendingList.length;
      const overdueTasks = myDeptTasks.filter(t => {
        if (t.status === 'Completed' || t.status === 'Approved') return false;
        return t.dueDate && new Date(t.dueDate) < new Date();
      }).length;

      setStats({
        teamSize,
        activeMembers,
        totalDeptTasks,
        completedTasks,
        pendingApprovalsCount,
        overdueTasks,
      });

    } catch (e) {
      console.error('Failed to load Manager dashboard real data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const completionRate = stats.totalDeptTasks > 0 ? Math.round((stats.completedTasks / stats.totalDeptTasks) * 100) : 0;
  const activeRatio = stats.teamSize > 0 ? Math.round((stats.activeMembers / stats.teamSize) * 100) : 0;
  const inProgressCount = deptTasks.filter(t => t.status === 'In Progress').length;
  const onTimeRate = stats.totalDeptTasks > 0 ? Math.max(0, Math.round(((stats.totalDeptTasks - stats.overdueTasks) / stats.totalDeptTasks) * 100)) : 100;

  const memberPerformance = teamUsers.map((member) => {
    const memberTasks = deptTasks.filter(t => (t.assignedTo?._id || t.assignedTo) === member._id);
    const completedMemberTasks = memberTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
    const progress = memberTasks.length > 0 ? Math.round((completedMemberTasks / memberTasks.length) * 100) : 0;

    return {
      _id: member._id,
      name: member.name,
      position: member.position || 'Department Staff',
      avatar: member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
      totalTasks: memberTasks.length,
      completedTasks: completedMemberTasks,
      activeTasks: memberTasks.filter(t => ['Assigned', 'In Progress'].includes(t.status)).length,
      progress,
    };
  });

  const reportsSummary = [
    {
      title: 'Department Completion Rate',
      value: `${completionRate}%`,
      target: `${stats.completedTasks} of ${stats.totalDeptTasks} Department Tasks Completed`,
      trend: stats.totalDeptTasks > 0 ? `${completionRate}% Output` : 'No Tasks Yet',
      progress: completionRate,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600',
    },
    {
      title: 'Team Active Ratio',
      value: `${activeRatio}%`,
      target: `${stats.activeMembers} of ${stats.teamSize} Team Members Active`,
      trend: `${stats.activeMembers} Active Staff`,
      progress: activeRatio,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-600',
    },
    {
      title: 'Active Workload Efficiency',
      value: `${inProgressCount} Tasks`,
      target: `${inProgressCount} Tasks currently in progress`,
      trend: 'Real-time Department Flow',
      progress: stats.totalDeptTasks > 0 ? Math.round((inProgressCount / stats.totalDeptTasks) * 100) : 0,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-600',
    },
    {
      title: 'On-Time Delivery Rate',
      value: `${onTimeRate}%`,
      target: `${stats.overdueTasks} Overdue Task${stats.overdueTasks === 1 ? '' : 's'}`,
      trend: stats.overdueTasks === 0 ? '100% On-time Schedule' : `${stats.overdueTasks} Past Target Date`,
      progress: onTimeRate,
      color: 'text-violet-600',
      bgColor: 'bg-violet-600',
    },
  ];

  const handleExportReport = () => {
    setToastMessage(`Exporting ${user?.department || 'Department'} Performance Analytics (CSV/PDF)...`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'Pending Approval':
      case 'Submitted':
      case 'Under Review':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><Sparkles className="w-3 h-3" /> Needs Review</span>;
      case 'Overdue':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" /> Overdue</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 w-fit">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 uppercase tracking-wider">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">Low</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
        <span className="animate-spin text-blue-600 text-lg">⏳</span> Loading manager department performance data...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-10">
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="p-3 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-white hover:text-blue-100 font-extrabold text-sm">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP MANAGER HEADER BAR WITH CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Manager Profile & Title */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
              alt={user?.name || 'Manager Profile'}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-600 shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Level 2 • Manager ({user?.department || 'Operations'})
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name} 👋
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Department Operations, Team Performance & Task Review Dashboard
            </p>
          </div>
        </div>

        {/* Right: Date Selection & Manager Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer text-slate-900"
            >
              <option value="August 2026">August 2026</option>
              <option value="This Quarter (Q3)">This Quarter (Q3)</option>
              <option value="Year to Date 2026">Year to Date 2026</option>
            </select>
          </div>

          {/* Export Report Action */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Export Report
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 rounded-xl transition-all relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {stats.pendingApprovalsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
                  {stats.pendingApprovalsCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-lg p-4 z-50 text-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <h4 className="font-bold text-slate-900">Manager Notifications</h4>
                  <span className="text-[10px] font-bold text-blue-600">{stats.pendingApprovalsCount} Pending</span>
                </div>
                <div className="space-y-2.5">
                  {pendingApprovals.length > 0 ? (
                    pendingApprovals.map(t => (
                      <div key={t._id} className="p-2 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 truncate max-w-[180px]">{t.title}</p>
                          <p className="text-[11px] text-slate-500">Submitted by {t.assignedTo?.name || 'Team member'}</p>
                        </div>
                        <button
                          onClick={() => { setShowNotifications(false); setTaskForReview(t); }}
                          className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold"
                        >
                          Review
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400">No pending task submissions requiring review.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Assign Task Action */}
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4 text-white" />
            Assign Task
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SIX TOP SUMMARY CARDS (SCOPED TO MANAGER'S DEPARTMENT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Team Size */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">Team Size</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {stats.teamSize}
            </div>
            <p className="text-[10px] font-semibold text-slate-500 mt-1">
              Direct Staff in {user?.department || 'Dept'}
            </p>
          </div>
        </div>

        {/* 2. Active Team Members */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">Active Staff</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {stats.activeMembers}
            </div>
            <p className="text-[10px] font-semibold text-indigo-600 mt-1">
              {activeRatio}% Active Team Ratio
            </p>
          </div>
        </div>

        {/* 3. Department Tasks */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">Dept Tasks</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalDeptTasks}
            </div>
            <p className="text-[10px] font-semibold text-emerald-600 mt-1">
              {inProgressCount} In Progress
            </p>
          </div>
        </div>

        {/* 4. Completed Tasks */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">Completed</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {stats.completedTasks}
            </div>
            <p className="text-[10px] font-semibold text-sky-600 mt-1">
              {completionRate}% Completion Rate
            </p>
          </div>
        </div>

        {/* 5. Pending Approvals */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight text-amber-600">
              {stats.pendingApprovalsCount}
            </div>
            <p className="text-[10px] font-semibold text-amber-600 mt-1">
              {stats.pendingApprovalsCount > 0 ? `${stats.pendingApprovalsCount} Action Needed` : 'Review Queue Clear'}
            </p>
          </div>
        </div>

        {/* 6. Overdue Tasks */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">Overdue Tasks</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight text-rose-600">
              {stats.overdueTasks}
            </div>
            <p className="text-[10px] font-semibold text-rose-600 mt-1">
              {stats.overdueTasks > 0 ? `${stats.overdueTasks} Past Target Date` : '0 Overdue Tasks'}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Approvals Review Banner (if any submissions are waiting) */}
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {pendingApprovals.length} Task Submission{pendingApprovals.length === 1 ? '' : 's'} Awaiting Your Manager Review
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Review submitted deliverables and authorize or request updates for your department.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/approvals')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            Go to Review Queue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEPARTMENT TASKS TABLE SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Department Active Tasks</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time status of all tasks in {user?.department || 'Operations'} Department</p>
          </div>
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-all"
          >
            View All Department Tasks <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Task Name</th>
                <th className="py-3 px-4">Assigned Employee</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {deptTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    No department tasks found. Click "Assign Task" above to assign a task to your team.
                  </td>
                </tr>
              ) : (
                deptTasks.slice(0, 10).map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 max-w-xs">
                      <p className="font-bold text-slate-900 truncate" title={task.title}>{task.title}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{task.description}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={task.assignedTo?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                          alt={task.assignedTo?.name || 'User'}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-[11px]">{task.assignedTo?.name || 'Unassigned'}</p>
                          <p className="text-[10px] text-slate-400">{task.assignedTo?.position || 'Employee'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Due Date'}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="py-3.5 px-6 text-right flex items-center justify-end gap-2">
                      {['Submitted', 'Under Review'].includes(task.status) && (
                        <button
                          onClick={() => setTaskForReview(task)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-1"
                        >
                          <FileCheck className="w-3.5 h-3.5" /> Review
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TEAM MEMBER CAPACITY & 5. REPORTS SUMMARY SECTION GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Team Member Output Panel (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Team Member Output & Task Allocation
                </h3>
                <p className="text-xs text-slate-500 font-medium">Individual task completion and progress in {user?.department || 'Department'}</p>
              </div>
              <button
                onClick={() => navigate('/team')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View Team Members <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {memberPerformance.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No team members registered in this department.</p>
              ) : (
                memberPerformance.map((member) => (
                  <div key={member._id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{member.name}</h4>
                          <p className="text-[11px] text-slate-500">{member.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-900">{member.progress}%</span>
                        <p className="text-[10px] font-semibold text-slate-400">Completed ({member.completedTasks}/{member.totalTasks})</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                        style={{ width: `${member.progress}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                      <span>{member.activeTasks} Active Tasks Assigned</span>
                      <span>{member.completedTasks} Successfully Delivered</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Department Reports Summary Section (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Department Reports & Efficiency Metrics
                </h3>
                <p className="text-xs text-slate-500 font-medium">Real-time performance analytics for {user?.department || 'Department'}</p>
              </div>
              <button
                onClick={() => navigate('/reports')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Full Analytics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {reportsSummary.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.title}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{item.target}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-extrabold ${item.color}`}>{item.value}</span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.bgColor} transition-all duration-500 rounded-full`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {item.trend}
                    </span>
                    <span>{item.progress}/100 Score</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={true}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={async () => {
            setSelectedTask(null);
            fetchManagerData();
          }}
        />
      )}

      {/* Review & Approval Modal */}
      {taskForReview && (
        <ReviewTaskModal
          isOpen={!!taskForReview}
          onClose={() => setTaskForReview(null)}
          task={taskForReview}
          onApprovalComplete={() => {
            setTaskForReview(null);
            fetchManagerData();
          }}
        />
      )}

      {/* Create / Assign Task Modal */}
      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          onTaskCreated={() => {
            setIsCreateTaskOpen(false);
            fetchManagerData();
            setToastMessage('New Task assigned to team member!');
            setTimeout(() => setToastMessage(''), 4000);
          }}
        />
      )}
    </div>
  );
};

export default ManagerDashboard;
