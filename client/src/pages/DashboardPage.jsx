import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import api from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { SubmitTaskModal } from '../components/tasks/SubmitTaskModal';
import { ReviewTaskModal } from '../components/approvals/ReviewTaskModal';
import { LogWorkModal } from '../components/dailywork/LogWorkModal';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import {
  Users,
  CheckSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  Building,
  ShieldCheck,
  Sparkles,
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
  Legend,
} from 'recharts';

export const DashboardPage = () => {
  const { user, isMain, isMiddle, isLast } = useAuth();
  const { activeTimer, startTimer } = useTimer();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForSubmit, setTaskForSubmit] = useState(null);
  const [taskForReview, setTaskForReview] = useState(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isLogWorkOpen, setIsLogWorkOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?._id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
        <span className="animate-spin text-indigo-400 text-lg">⏳</span> Loading workspace dashboard...
      </div>
    );
  }

  const stats = dashboardData?.stats || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Welcome Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {isMain && '1. CEO • Level 1 (Executive)'}
              {isMiddle && `2. MANAGER • Level 2 (${user?.department})`}
              {isLast && `3. EMPLOY • Level 3 (${user?.position})`}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Good day, {user?.name} 👋
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            {isMain && 'Company operations, employee productivity, and multi-tier approval pipelines overview.'}
            {isMiddle && `Managing team members in ${user?.department} Department.`}
            {isLast && 'Here is your daily task schedule, work timer, and deadline progress.'}
          </p>
        </div>

        {/* Quick Action buttons */}
        <div className="flex items-center gap-2.5 relative z-10">
          <button
            onClick={() => setIsLogWorkOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-slate-900 text-xs font-semibold border border-slate-200 transition-all shadow-xs"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Log Today's Work
          </button>

          {(isMain || isMiddle) && (
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
            >
              <Plus className="w-4 h-4 text-white" />
              Assign Task
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MAIN PERSON DASHBOARD */}
      {/* ========================================================================= */}
      {isMain && (
        <>
          {/* Main Person KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              subtitle={`${stats.totalManagers} Managers • ${stats.totalExecutives} Execs`}
              icon={Users}
              color="brand"
            />
            <StatCard
              title="Active Tasks"
              value={stats.inProgressTasks + (stats.totalTasks - stats.completedTasks - stats.pendingApprovalTasks)}
              subtitle={`${stats.pendingApprovalTasks} Pending Approvals`}
              icon={CheckSquare}
              color="blue"
            />
            <StatCard
              title="Completed Tasks"
              value={stats.completedTasks}
              subtitle={`${stats.completionRate}% Completion Rate`}
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              title="Overdue Tasks"
              value={stats.overdueTasks}
              subtitle={`${stats.todayTotalHours}h Org Work Today`}
              icon={AlertTriangle}
              color="rose"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tasks By Status Chart */}
            <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-1">Tasks by Status</h3>
              <p className="text-xs text-slate-400 mb-4">Organization-wide task distribution</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData?.charts?.tasksByStatus || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dashboardData?.charts?.tasksByStatus?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-1">Department Task Volume</h3>
              <p className="text-xs text-slate-400 mb-4">Total vs Completed by Department</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData?.charts?.departmentBreakdown || []}>
                    <XAxis dataKey="department" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="total" name="Total Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Pending Approvals Pipeline for Main Person */}
          {dashboardData?.pendingApprovals?.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Tasks Awaiting Final Approval</h3>
                  <p className="text-xs text-slate-400">Forwarded by Managers for Director Authorization</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  {dashboardData.pendingApprovals.length} Action Needed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.pendingApprovals.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                    onReviewClick={(t) => setTaskForReview(t)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Employee Workload Cards */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-1">Company Workload & Employee Capacity</h3>
            <p className="text-xs text-slate-400 mb-4">Real-time status across all reporting branches</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData?.employeeWorkload?.map((emp) => (
                <div key={emp._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                      alt={emp.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{emp.name}</h4>
                      <p className="text-[10px] text-indigo-400">{emp.position}</p>
                      <span className="text-[10px] text-slate-500">{emp.department}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800 text-[11px]">
                    <div className="p-1.5 rounded-lg bg-slate-950">
                      <p className="text-slate-400">Total</p>
                      <p className="font-bold text-white mt-0.5">{emp.totalTasks}</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-950">
                      <p className="text-blue-400">Active</p>
                      <p className="font-bold text-blue-300 mt-0.5">{emp.activeTasks}</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-950">
                      <p className="text-emerald-400">Done</p>
                      <p className="font-bold text-emerald-300 mt-0.5">{emp.completedTasks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. MIDDLE PERSON DASHBOARD (Priya / Rahul) */}
      {/* ========================================================================= */}
      {isMiddle && (
        <>
          {/* Middle Person KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Team Size"
              value={stats.teamSize}
              subtitle={`Direct Subordinates in ${user?.department}`}
              icon={Users}
              color="brand"
            />
            <StatCard
              title="Pending Review"
              value={stats.pendingSubmissionsCount}
              subtitle="Submissions needing your review"
              icon={CheckSquare}
              color="amber"
            />
            <StatCard
              title="Team Completed"
              value={stats.completedTasks}
              subtitle={`${stats.completionRate}% Completion Rate`}
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              title="Team Hours Today"
              value={`${stats.teamTodayHours}h`}
              subtitle={`${stats.overdueTasks} Overdue Tasks`}
              icon={Clock}
              color="blue"
            />
          </div>

          {/* Pending Submissions Queue */}
          {dashboardData?.pendingApprovals?.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Submissions Requiring Your Review</h3>
                  <p className="text-xs text-slate-400">Review team deliverable & forward to Operations Director</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  {dashboardData.pendingApprovals.length} Pending
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.pendingApprovals.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                    onReviewClick={(t) => setTaskForReview(t)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Team Workload & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Team Members List */}
            <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">My Direct Subordinates</h3>
              <div className="space-y-3">
                {dashboardData?.teamWorkload?.map((emp) => (
                  <div key={emp._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'}
                        alt={emp.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{emp.name}</h4>
                        <p className="text-[10px] text-slate-400">{emp.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {emp.activeTasks} Active
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {emp.completedTasks} Done
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Today's Work Logs */}
            <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Today's Team Activity Logs</h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {(!dashboardData?.todayLogs || dashboardData.todayLogs.length === 0) && (
                  <p className="text-xs text-slate-500 py-4 text-center">No work entries logged yet today by team.</p>
                )}
                {dashboardData?.todayLogs?.map((log) => (
                  <div key={log._id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-white">{log.userId?.name}</span>
                      <span className="font-mono text-indigo-300">{log.startTime} - {log.endTime} ({log.durationMinutes}m)</span>
                    </div>
                    <p className="text-slate-300 font-medium">{log.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. LAST PERSON DASHBOARD (Sandeep / Anjali / Vikram / Neha) */}
      {/* ========================================================================= */}
      {isLast && (
        <>
          {/* Last Person KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="My Active Tasks"
              value={stats.activeTasks}
              subtitle={`${stats.pendingTasks} Submitted for Review`}
              icon={CheckSquare}
              color="blue"
            />
            <StatCard
              title="Completed Tasks"
              value={stats.completedTasks}
              subtitle="Approved & Finalized"
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              title="Today's Work Logged"
              value={stats.todayWorkFormatted}
              subtitle={`${stats.todayWorkMinutes} minutes total`}
              icon={Clock}
              color="brand"
            />
            <StatCard
              title="Upcoming Deadlines"
              value={stats.upcomingDeadlinesCount}
              subtitle={`${stats.overdueTasks} Overdue`}
              icon={AlertTriangle}
              color={stats.overdueTasks > 0 ? 'rose' : 'amber'}
            />
          </div>

          {/* Assigned Tasks to Work On */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">My Work Schedule & Tasks</h3>
                <p className="text-xs text-slate-400">Tasks assigned to you by your reporting manager</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData?.upcomingTasks?.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={() => setSelectedTask(task)}
                  onSubmitClick={(t) => setTaskForSubmit(t)}
                />
              ))}
            </div>
          </div>

          {/* Today's Daily Work Logs */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">What did I do today?</h3>
                <p className="text-xs text-slate-400">Your daily logged activities and duration summary</p>
              </div>
              <button
                onClick={() => setIsLogWorkOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Daily Log
              </button>
            </div>

            <div className="space-y-2.5">
              {(!dashboardData?.todayLogs || dashboardData.todayLogs.length === 0) && (
                <p className="text-xs text-slate-500 py-4 text-center">No daily logs recorded yet for today.</p>
              )}
              {dashboardData?.todayLogs?.map((log) => (
                <div key={log._id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{log.title}</h4>
                      <p className="text-[11px] text-slate-400">{log.project} • {log.product}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-indigo-300 font-semibold">{log.startTime} - {log.endTime}</p>
                    <p className="text-[10px] text-slate-500">{log.durationMinutes} mins</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onTaskUpdated={(updated) => {
          setSelectedTask(updated);
          fetchDashboard();
        }}
        onOpenSubmit={(task) => setTaskForSubmit(task)}
        onOpenReview={(task) => setTaskForReview(task)}
      />

      <SubmitTaskModal
        isOpen={!!taskForSubmit}
        onClose={() => setTaskForSubmit(null)}
        task={taskForSubmit}
        onTaskSubmitted={() => {
          fetchDashboard();
        }}
      />

      <ReviewTaskModal
        isOpen={!!taskForReview}
        onClose={() => setTaskForReview(null)}
        task={taskForReview}
        onApprovalComplete={() => {
          fetchDashboard();
        }}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreated={() => {
          fetchDashboard();
        }}
      />

      <LogWorkModal
        isOpen={isLogWorkOpen}
        onClose={() => setIsLogWorkOpen(false)}
        onWorkLogged={() => {
          fetchDashboard();
        }}
      />
    </div>
  );
};
