import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const CalendarPage = () => {
  const { user } = useAuth();
  const { getUserLogs, getUserLeaves } = useAttendance();
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month'); // 'day' | 'week' | 'month'
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const res = await api.get('/tasks');
        if (res.success) {
          setTasks(res.tasks || []);
        }
      } catch (err) {
        console.error('Failed to load tasks for calendar', err);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [user?._id]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper for generating month grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Calendar & Deadlines</h2>
          <p className="text-xs text-slate-400 mt-1">
            Task due dates, assignment timelines, and deliverables schedule
          </p>
        </div>

        {/* View Switcher & Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            {['day', 'week', 'month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setCalendarView(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  calendarView === mode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={today}
              className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {monthNames[month]} {year}
          </h3>
          <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
            {tasks.length} Tracked Tasks
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 py-2">
              {d}
            </div>
          ))}

          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] p-2 rounded-2xl bg-slate-950 border border-slate-900 opacity-30" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

            const dayTasks = tasks.filter((t) => {
              if (!t.dueDate) return false;
              const d = new Date(t.dueDate).toISOString().split('T')[0];
              return d === dateStr;
            });

            const isToday =
              new Date().toISOString().split('T')[0] === dateStr;
            
            // Check Attendance
            const formatString = `${String(dayNum).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
            
            const logs = user ? getUserLogs(user._id || user.id) : [];
            const leaves = user ? getUserLeaves(user._id || user.id) : [];
            
            const isPresent = logs.some(l => l.date === formatString);
            
            let isLeave = false;
            leaves.forEach(leave => {
              if (leave.status === 'Approved') {
                const start = new Date(leave.fromDate);
                const end = new Date(leave.toDate);
                const current = new Date(year, month, dayNum);
                // Reset time to compare dates strictly
                start.setHours(0,0,0,0);
                end.setHours(0,0,0,0);
                current.setHours(0,0,0,0);
                if (current >= start && current <= end) {
                  isLeave = true;
                }
              }
            });

            return (
              <div
                key={dayNum}
                className={`min-h-[110px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                  isLeave ? 'bg-rose-50 border-rose-200' :
                  isPresent ? 'bg-emerald-50 border-emerald-200' :
                  isToday
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${
                      isLeave ? 'bg-rose-600 text-white' :
                      isPresent ? 'bg-emerald-600 text-white' :
                      isToday ? 'bg-indigo-600 text-white' : 'text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-20 pr-0.5">
                  {dayTasks.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => setSelectedTask(t)}
                      className={`p-1.5 rounded-lg text-[10px] font-semibold border cursor-pointer truncate transition-all ${
                        t.status === 'Completed'
                          ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                          : t.priority === 'Urgent'
                          ? 'bg-rose-100 border-rose-200 text-rose-700'
                          : 'bg-indigo-100 border-indigo-200 text-indigo-700'
                      }`}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />
    </div>
  );
};
