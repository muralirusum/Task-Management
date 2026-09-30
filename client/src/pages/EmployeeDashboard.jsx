import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import api from '../services/api';
import { StatCard } from '../components/common/StatCard';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  X,
  Calendar as CalendarIcon,
  CheckSquare,
  ArrowRight,
  Play,
  Zap,
  Briefcase,
  User,
  FileText
} from 'lucide-react';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard');
        if (res.success) {
          setDashboardData(res);
        }
      } catch (err) {
        console.error('Failed to load employee dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user?._id]);

  const stats = dashboardData?.stats || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
        <span className="animate-spin text-blue-600 text-lg">⏳</span> Loading Employee Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Welcome Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              3. EMPLOY • Level 3 ({user?.position || 'Operations Employee'})
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Good day, {user?.name} 👋
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Here is your daily task schedule, work timer, and deadline progress.
          </p>
        </div>

        {/* Quick Action button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/attendance')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-slate-900 text-xs font-bold border border-slate-200 transition-all shadow-xs"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Log Today's Work
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="MY ACTIVE TASKS"
          value={stats.activeTasks ?? 0}
          subtitle={`${stats.pendingTasks ?? 0} Submitted for Review`}
          icon={CheckSquare}
          color="blue"
        />
        <StatCard
          title="COMPLETED TASKS"
          value={stats.completedTasks ?? 1}
          subtitle="Approved & Finalized"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="TODAY'S WORK LOGGED"
          value={stats.todayWorkFormatted ?? '0h 0m'}
          subtitle={`${stats.todayWorkMinutes ?? 0} minutes total`}
          icon={Clock}
          color="brand"
        />
        <StatCard
          title="UPCOMING DEADLINES"
          value={stats.upcomingDeadlinesCount ?? 0}
          subtitle={`${stats.overdueTasks ?? 0} Overdue`}
          icon={AlertTriangle}
          color={stats.overdueTasks > 0 ? 'rose' : 'amber'}
        />
      </div>

      {/* ── Lower 6-Card SaaS Dashboard Section (Employee Login Only) ── */}
      <EmployeeDashboardExtraSection />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// LOWER 6-CARD SAAS DASHBOARD SECTION (Employee Login Only)
// ═══════════════════════════════════════════════════════════════════════════
const EmployeeDashboardExtraSection = () => {
  const navigate = useNavigate();
  const { activeTimer, startTimer, pauseTimer, formattedTime, seconds } = useTimer();

  // Dynamic Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const monthName = currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentCalendarDate(today);
    setSelectedDay(today.getDate());
  };

  // Helper for events on selected day
  const getEventForDay = (d) => {
    if (d === 15 || d === 28) return { type: 'deadline', title: 'Task Deadline: Submit Monthly Review Report by 5:00 PM', color: 'rose' };
    if (d === 20 || d === 8) return { type: 'meeting', title: 'Meeting: Department Operations Sync at 10:00 AM', color: 'blue' };
    if (d === 25 || d === 1) return { type: 'holiday', title: 'Holiday: Official Company Day Off', color: 'emerald' };
    if (d === 30 || d === 12) return { type: 'other', title: 'Schedule: Quarterly Performance Audit & Notes', color: 'purple' };
    return null;
  };

  const activeEvent = getEventForDay(selectedDay);

  const handleQuickAction = (act) => {
    if (act === 'log') navigate('/attendance');
    if (act === 'leave') navigate('/attendance');
    if (act === 'payslip') alert('Generating latest monthly payslip... (Downloaded)');
    if (act === 'profile') navigate('/profile');
  };

  return (
    <div className="space-y-6 pt-2 animate-in fade-in duration-300">
      {/* 3 Columns x 2 Rows Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. My Work Schedule & Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900">My Work Schedule & Tasks</h3>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <CheckSquare className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Tasks assigned to you by your reporting manager</p>

            {/* Task Card Container */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    cGxP Jobs
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                    HIGH
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-900 capitalize">blogger</h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">to post 10 posts per day</p>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60 text-slate-500">
                <span className="font-semibold text-slate-700">Customer Operations</span>
                <span className="font-mono font-bold text-blue-600">0.12h / 3h est.</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                  alt="chotu"
                  className="w-6 h-6 rounded-full object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-tight">chotu</p>
                  <p className="text-[9px] text-slate-400 font-medium">Operations Employee</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/tasks')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            View All Tasks <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. My Calendar (Fully Dynamic) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900">My Calendar</h3>
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <CalendarIcon className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-3">View your schedule & important dates</p>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-xs font-extrabold text-slate-900">{monthName}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white text-blue-600 rounded-md border border-slate-200 shadow-2xs hover:bg-blue-50 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1.5">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
              {/* Previous Month Padding Days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <span key={`prev-${i}`} className="py-1 text-slate-300 select-none">
                  {daysInPrevMonth - firstDayOfWeek + i + 1}
                </span>
              ))}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const isSelected = d === selectedDay;
                const isToday =
                  d === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();

                const isRed = d === 15 || d === 28;
                const isBlue = d === 20 || d === 8;
                const isGreen = d === 25 || d === 1;
                const isPurple = d === 30 || d === 12;

                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`py-1 rounded-full text-center font-bold text-xs relative flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : isToday
                        ? 'border border-blue-500 text-blue-600 font-extrabold hover:bg-blue-50'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {d}
                    {!isSelected && (
                      <span className="absolute bottom-0.5 flex gap-0.5 justify-center">
                        {isRed && <span className="w-1 h-1 bg-rose-500 rounded-full"></span>}
                        {isBlue && <span className="w-1 h-1 bg-blue-500 rounded-full"></span>}
                        {isGreen && <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>}
                        {isPurple && <span className="w-1 h-1 bg-purple-500 rounded-full"></span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Event Info */}
            <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-600">
              {activeEvent ? (
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    activeEvent.color === 'rose' ? 'bg-rose-500' :
                    activeEvent.color === 'blue' ? 'bg-blue-500' :
                    activeEvent.color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'
                  }`}></span>
                  <span className="truncate">{activeEvent.title}</span>
                </div>
              ) : (
                <div className="text-slate-400 text-center font-normal">
                  No scheduled events on {monthName.split(' ')[0]} {selectedDay}
                </div>
              )}
            </div>
          </div>

          {/* Legend Footer */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Red = Task Deadline
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Blue = Meeting
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Green = Holiday
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> Purple = Other
            </div>
          </div>
        </div>

        {/* 3. Time Tracker */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900">Time Tracker</h3>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Track your daily working hours</p>

            <div className="flex flex-col items-center justify-center my-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - (seconds ? Math.min(seconds / 28800, 1) : 0))}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
                    {seconds ? formattedTime : '0h 0m'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logged Today</span>
                  <span className="text-[9px] text-slate-400 font-medium mt-0.5">of 8h 0m</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Weekly Progress</span>
                <span className="text-blue-600">0h 0m / 40h 0m (0%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-0"></div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/attendance')}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> ▶ Start Timer
          </button>
        </div>

        {/* 4. Announcements */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900">Announcements</h3>
              <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Stay updated with company news</p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> New Policy Update
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">May 20, 2025</span>
                </div>
                <p className="text-[11px] text-slate-600 pl-3.5 font-medium">Please review the updated leave policy.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> System Maintenance
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">May 19, 2025</span>
                </div>
                <p className="text-[11px] text-slate-600 pl-3.5 font-medium">System will be down on May 25th from 12 AM to 3 AM.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Team Meeting
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">May 18, 2025</span>
                </div>
                <p className="text-[11px] text-slate-600 pl-3.5 font-medium">Monthly team meeting on May 30th at 10 AM.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. My Performance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900">My Performance</h3>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-3">Your current performance overview</p>

            <div className="flex items-center justify-center my-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - 0.85)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-slate-900">85%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Overall Score</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Quality</span>
                  <span className="text-emerald-600">90%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[90%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Timeliness</span>
                  <span className="text-blue-600">80%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[80%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Productivity</span>
                  <span className="text-indigo-600">85%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-[85%]"></div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/reports')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            View Performance Report <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6. Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900">Quick Actions</h3>
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <Zap className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Frequently used actions</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickAction('log')}
                className="p-3.5 rounded-xl bg-blue-50/60 hover:bg-blue-100/80 border border-blue-100 text-blue-900 flex flex-col items-center justify-center text-center gap-2 transition-all group"
              >
                <FileText className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight">Log Today's Work</span>
              </button>

              <button
                onClick={() => handleQuickAction('leave')}
                className="p-3.5 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/80 border border-emerald-100 text-emerald-900 flex flex-col items-center justify-center text-center gap-2 transition-all group"
              >
                <CalendarDays className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight">Request Leave</span>
              </button>

              <button
                onClick={() => handleQuickAction('payslip')}
                className="p-3.5 rounded-xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-100 text-amber-900 flex flex-col items-center justify-center text-center gap-2 transition-all group"
              >
                <Briefcase className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight">View Payslip</span>
              </button>

              <button
                onClick={() => handleQuickAction('profile')}
                className="p-3.5 rounded-xl bg-purple-50/60 hover:bg-purple-100/80 border border-purple-100 text-purple-900 flex flex-col items-center justify-center text-center gap-2 transition-all group"
              >
                <User className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight">Update Profile</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
