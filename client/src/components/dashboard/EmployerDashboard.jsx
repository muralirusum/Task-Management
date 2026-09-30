import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../common/StatCard';
import { CreateJobModal } from '../jobs/CreateJobModal';
import { AddEmployeeModal } from '../team/AddEmployeeModal';
import {
  Users,
  CheckSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  Building,
  ShieldCheck,
  Briefcase,
  UserCheck,
  UserPlus,
  Bell,
  MessageSquare,
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  XCircle,
  Megaphone,
  Sparkles,
  Award,
  BarChart3,
  Filter,
  Eye
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export const EmployerDashboard = ({ user, stats, dashboardData, setIsLogWorkOpen, setIsCreateTaskOpen }) => {
  const navigate = useNavigate();

  // Modal States
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Initial State Data
  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 1,
      employeeName: 'Priya Patel',
      role: 'Manager',
      department: 'Engineering',
      leaveType: 'Emergency Leave',
      fromDate: '2026-08-27',
      toDate: '2026-08-28',
      days: 2,
      reason: 'Urgent family emergency in hometown.',
      status: 'Pending',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'
    },
    {
      id: 2,
      employeeName: 'Anish Kumar',
      role: 'Employee',
      department: 'Operations',
      leaveType: 'Casual Leave',
      fromDate: '2026-09-01',
      toDate: '2026-09-02',
      days: 2,
      reason: 'Personal medical checkup and consultation.',
      status: 'Pending',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'
    },
    {
      id: 3,
      employeeName: 'Sneha Reddy',
      role: 'Employee',
      department: 'Quality Assurance',
      leaveType: 'Earned Leave',
      fromDate: '2026-09-05',
      toDate: '2026-09-07',
      days: 3,
      reason: 'Planned family vacation.',
      status: 'Pending',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100'
    }
  ]);

  const [jobPostings, setJobPostings] = useState([
    {
      id: 101,
      title: 'Senior Frontend Engineer',
      department: 'Engineering',
      location: 'cGxPTech.guntur (Hybrid)',
      type: 'Full-Time',
      postedDate: 'Aug 20, 2026',
      applicationsCount: 18,
      status: 'Active'
    },
    {
      id: 102,
      title: 'Backend Node.js Specialist',
      department: 'Engineering',
      location: 'cGxPTech.guntur HQ',
      type: 'Full-Time',
      postedDate: 'Aug 22, 2026',
      applicationsCount: 14,
      status: 'Active'
    },
    {
      id: 103,
      title: 'QA Compliance Manager',
      department: 'Quality Assurance',
      location: 'cGxPTech.guntur',
      type: 'Full-Time',
      postedDate: 'Aug 24, 2026',
      applicationsCount: 10,
      status: 'Active'
    }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleLeaveAction = (id, newStatus) => {
    setLeaveRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
    );
    showToast(`Leave request ${newStatus.toLowerCase()} successfully.`);
  };

  const handleJobCreated = (newJob) => {
    setJobPostings(prev => [newJob, ...prev]);
    showToast(`New job posting "${newJob.title}" published successfully!`);
  };

  const handleEmployeeAdded = (newEmp) => {
    showToast(`Employee "${newEmp.name}" added to organization successfully!`);
  };

  // Chart Data
  const employeeOverviewData = [
    { name: 'Active', value: 18, color: '#10b981' },
    { name: 'On Leave', value: 4, color: '#3b82f6' },
    { name: 'Absent', value: 2, color: '#f43f5e' },
    { name: 'Pending Approval', value: 1, color: '#f59e0b' },
  ];

  const attendanceChartData = [
    { day: 'Mon', present: 22, absent: 2 },
    { day: 'Tue', present: 23, absent: 1 },
    { day: 'Wed', present: 20, absent: 4 },
    { day: 'Thu', present: 21, absent: 3 },
    { day: 'Fri', present: 24, absent: 0 },
  ];

  const hiringFunnelData = [
    { stage: 'Active Jobs', count: 6, fill: '#3b82f6' },
    { stage: 'Applicants', count: 84, fill: '#6366f1' },
    { stage: 'Shortlisted', count: 18, fill: '#8b5cf6' },
    { stage: 'Interviews', count: 7, fill: '#ec4899' },
    { stage: 'Offers Sent', count: 3, fill: '#f59e0b' },
    { stage: 'Hired', count: 12, fill: '#10b981' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar Actions (Notifications, Messages, Quick Actions) */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide text-white flex items-center gap-2">
              cGxP Tech Executive Suite
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-mono">
                Employer • Admin
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Workforce & Operations Management Control Center</p>
          </div>
        </div>

        {/* Right Header Utilities */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('Notifications up to date')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </button>
            <button
              onClick={() => showToast('No new unread messages')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors relative"
              title="Messages"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsPostJobOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4 text-white" />
            Post New Job
          </button>
        </div>
      </div>

      {/* Main Welcome Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Level 1 • Employer / CEO Admin Dashboard
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Good day, {user?.name || 'Employer User'} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium leading-relaxed">
            Here is your company overview, workforce activity, hiring progress, and today's important updates.
          </p>

          {/* Banner Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <button
              onClick={() => setIsPostJobOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/25"
            >
              <Plus className="w-4 h-4" /> Post New Job
            </button>
            <button
              onClick={() => setIsAddEmployeeOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25"
            >
              <UserPlus className="w-4 h-4" /> Add Employee
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200"
            >
              <BarChart3 className="w-4 h-4 text-blue-600" /> View Reports
            </button>
            {setIsLogWorkOpen && (
              <button
                onClick={() => setIsLogWorkOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-2xs"
              >
                <FileText className="w-4 h-4 text-slate-600" /> Log Today's Work
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top 6 Employer KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Employees */}
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees || 24}
          subtitle="18 Active • 4 On Leave"
          icon={Users}
          color="brand"
        />

        {/* 2. Present Today */}
        <StatCard
          title="Present Today"
          value="20 / 24"
          subtitle="92% Attendance • 2 Late"
          icon={CheckCircle}
          color="emerald"
        />

        {/* 3. Open Job Postings */}
        <StatCard
          title="Open Job Postings"
          value="6 Active"
          subtitle="42 Applications Received"
          icon={Briefcase}
          color="blue"
        />

        {/* 4. Pending Approvals */}
        <StatCard
          title="Pending Approvals"
          value="5 Requests"
          subtitle="3 Leave • 2 Tasks"
          icon={Clock}
          color="amber"
        />

        {/* 5. New Applicants */}
        <StatCard
          title="New Applicants"
          value="14 New"
          subtitle="8 Today • 6 This Week"
          icon={UserPlus}
          color="purple"
        />

        {/* 6. Upcoming Deadlines */}
        <StatCard
          title="Upcoming Deadlines"
          value="3 Deadlines"
          subtitle={`${stats?.overdueTasks || 1} Overdue Task`}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 px-1">
          Employer Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setIsPostJobOpen(true)}
            className="p-3 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-blue-600" /> Post Job
          </button>
          <button
            onClick={() => setIsAddEmployeeOpen(true)}
            className="p-3 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4 text-emerald-600" /> Add Employee
          </button>
          <button
            onClick={() => navigate('/approvals')}
            className="p-3 rounded-2xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/80 text-amber-800 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-600" /> Approve Leave
          </button>
          <button
            onClick={() => navigate('/employee-logs')}
            className="p-3 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/80 text-indigo-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <CalendarIcon className="w-4 h-4 text-indigo-600" /> View Attendance
          </button>
          <button
            onClick={() => navigate('/team')}
            className="p-3 rounded-2xl bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200/80 text-purple-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Users className="w-4 h-4 text-purple-600" /> View Applicants
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <BarChart3 className="w-4 h-4 text-slate-700" /> Generate Report
          </button>
        </div>
      </div>

      {/* Main Grid: Employee Overview & Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Employee Overview (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Employee Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status breakdown of workforce personnel</p>
            </div>
            <button
              onClick={() => navigate('/team')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All Employees <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-[10px] text-slate-500 font-medium">Total</p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">24</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
              <p className="text-[10px] text-emerald-600 font-medium">Active</p>
              <p className="text-sm font-extrabold text-emerald-800 mt-0.5">18</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200/80">
              <p className="text-[10px] text-blue-600 font-medium">On Leave</p>
              <p className="text-sm font-extrabold text-blue-800 mt-0.5">4</p>
            </div>
            <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-200/80">
              <p className="text-[10px] text-rose-600 font-medium">Absent</p>
              <p className="text-sm font-extrabold text-rose-800 mt-0.5">2</p>
            </div>
            <div className="p-2 rounded-xl bg-purple-50/80 border border-purple-200/80">
              <p className="text-[10px] text-purple-600 font-medium">New</p>
              <p className="text-sm font-extrabold text-purple-800 mt-0.5">3</p>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/80">
              <p className="text-[10px] text-amber-700 font-medium">Pending</p>
              <p className="text-sm font-extrabold text-amber-900 mt-0.5">1</p>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={employeeOverviewData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {employeeOverviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Today (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Attendance Today</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daily attendance record and weekly comparison</p>
            </div>
            <button
              onClick={() => navigate('/employee-logs')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Attendance <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Attendance Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-[10px] text-emerald-600 font-medium">Present</p>
              <p className="text-sm font-extrabold text-emerald-800 mt-0.5">20</p>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
              <p className="text-[10px] text-rose-600 font-medium">Absent</p>
              <p className="text-sm font-extrabold text-rose-800 mt-0.5">2</p>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-[10px] text-amber-700 font-medium">Late</p>
              <p className="text-sm font-extrabold text-amber-900 mt-0.5">2</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-[10px] text-blue-600 font-medium">On Leave</p>
              <p className="text-sm font-extrabold text-blue-800 mt-0.5">4</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <p className="text-[10px] text-slate-400 font-medium">Rate</p>
              <p className="text-sm font-extrabold text-emerald-400 mt-0.5">92%</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recruitment & Hiring Overview */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Recruitment & Hiring Pipeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">Track candidate applications, interviews, and offer status</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/team')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View Applicants <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recruitment Funnel Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {hiringFunnelData.map((item) => (
            <div key={item.stage} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{item.stage}</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Row: Pending Leave Requests & Active Job Postings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Leave Requests (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Pending Leave Requests</h3>
              <p className="text-xs text-slate-500 mt-0.5">Review and authorize employee leave applications</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
              {leaveRequests.filter(r => r.status === 'Pending').length} Pending Action
            </span>
          </div>

          <div className="space-y-3">
            {leaveRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.avatar}
                    alt={req.employeeName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      {req.employeeName}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {req.department}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      <span className="font-bold text-slate-800">{req.leaveType}</span> • {req.fromDate} to {req.toDate} ({req.days} days)
                    </p>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">"{req.reason}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {req.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => handleLeaveAction(req.id, 'Approved')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(req.id, 'Rejected')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${
                        req.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Job Postings (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Active Job Postings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Current open hiring positions across departments</p>
            </div>
            <button
              onClick={() => setIsPostJobOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              + Post Job
            </button>
          </div>

          <div className="space-y-3">
            {jobPostings.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{job.title}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{job.department} • {job.location}</p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200/60 font-semibold">
                  <span>Posted: {job.postedDate}</span>
                  <span className="text-blue-600 font-bold">{job.applicationsCount} Applicants</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Row: Recent Employee Activity & Company Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Employee Activity (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Employee Activity</h3>
          <p className="text-xs text-slate-500 -mt-2">Real-time audit log of workforce actions and events</p>

          <div className="space-y-3">
            {[
              {
                name: 'Rahul Sharma',
                action: 'Logged in from Registered Office (cGxPTech.guntur)',
                time: '09:02 AM',
                color: 'bg-emerald-500'
              },
              {
                name: 'Priya Patel',
                action: 'Submitted Emergency Leave Request for 2 days',
                time: '10:15 AM',
                color: 'bg-blue-500'
              },
              {
                name: 'Anish Kumar',
                action: 'Completed task: API Endpoints & Auth Optimization',
                time: '11:30 AM',
                color: 'bg-purple-500'
              },
              {
                name: 'Sneha Reddy',
                action: 'Uploaded Q3 Performance Evaluation Document',
                time: '01:45 PM',
                color: 'bg-amber-500'
              },
              {
                name: 'Vikram Singh',
                action: 'Logged out from Registered Office Zone',
                time: '05:10 PM',
                color: 'bg-slate-500'
              }
            ].map((act, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${act.color} shrink-0`} />
                  <div>
                    <span className="font-bold text-slate-900">{act.name}</span>
                    <span className="text-slate-600 ml-1.5 font-medium">{act.action}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-400 shrink-0 ml-2">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Company Announcements (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Company Announcements</h3>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Company Policy Updates',
                desc: 'Updated Hybrid Work & Remote Access Guidelines effective Sept 1st.',
                date: 'Aug 25, 2026',
                tag: 'HR Policy'
              },
              {
                title: 'Holiday Announcement',
                desc: 'Upcoming Independence Day Holiday Schedule & Paid Leave Notice.',
                date: 'Aug 20, 2026',
                tag: 'Holiday'
              },
              {
                title: 'System Maintenance',
                desc: 'Scheduled Database & Server Maintenance this Saturday 11:00 PM IST.',
                date: 'Aug 18, 2026',
                tag: 'IT Security'
              }
            ].map((ann, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                    {ann.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">{ann.desc}</p>
                <p className="text-[10px] text-slate-400 font-mono pt-1">{ann.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employer Insights & Suggested Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Employer Insights (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Employer Insights</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Workforce Growth</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-slate-900">+12.5%</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ▲ +3 Hires
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Steady headcount growth vs previous month</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Attendance Trends</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-slate-900">94% Rate</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ▲ +2.1%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">High organization-wide punctuality</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Hiring Time-to-Fill</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-slate-900">14 Days</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Fast Track
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Average recruitment cycle duration</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Task Efficiency</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-slate-900">88% On Time</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Optimal
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Project tasks completed before deadline</p>
            </div>
          </div>
        </div>

        {/* Suggested Improvements (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Suggested Action Items</h3>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: 1,
                title: 'Review repeated late attendance records',
                desc: '2 employees logged in past allowed schedule 3+ times this week.'
              },
              {
                id: 2,
                title: 'Follow up on pending leave requests',
                desc: '3 leave submissions are awaiting executive authorization.'
              },
              {
                id: 3,
                title: 'Review open job applications',
                desc: '18 new candidates applied for Senior Frontend Engineer position.'
              },
              {
                id: 4,
                title: 'Schedule interviews for shortlisted candidates',
                desc: '7 shortlisted candidates require interview date confirmation.'
              },
              {
                id: 5,
                title: 'Review department workforce requirements',
                desc: 'Operations department requested 2 additional team members.'
              }
            ].map((item) => (
              <div key={item.id} className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3 text-xs">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                  {item.id}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <p className="text-slate-500 text-[11px] font-medium mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={handleJobCreated}
      />
      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onEmployeeAdded={handleEmployeeAdded}
      />
    </div>
  );
};
