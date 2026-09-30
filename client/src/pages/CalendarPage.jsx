import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import api from '../services/api';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CheckSquare
} from 'lucide-react';

export const CalendarPage = () => {
  const { user } = useAuth();
  const { getUserLogs } = useAttendance();
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
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

  // Month grid helpers
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // User attendance logs
  const userLogs = user ? getUserLogs(user._id || user.id) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Header & Monthly Scroll Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Calendar Schedule</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              View assigned tasks, attendance present days, and weekend holidays in monthly view.
            </p>
          </div>
        </div>

        {/* Clean Monthly Scroll Navigation (< August 2026 >) */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-xs self-stretch sm:self-auto justify-between">
          <button
            onClick={prevMonth}
            title="Previous Month"
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 px-3">
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={goToToday}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Today
            </button>
          </div>

          <button
            onClick={nextMonth}
            title="Next Month"
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar on Left (lg:col-span-3) + Right Side Mini Calendar Widget (lg:col-span-1) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left 3-Column: Main Monthly Calendar Grid */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
          <div className="grid grid-cols-7 gap-2">
            {/* Weekday Column Headers */}
            {[
              { label: 'Sun', holiday: true },
              { label: 'Mon', holiday: false },
              { label: 'Tue', holiday: false },
              { label: 'Wed', holiday: false },
              { label: 'Thu', holiday: false },
              { label: 'Fri', holiday: false },
              { label: 'Sat', holiday: true },
            ].map((col) => (
              <div
                key={col.label}
                className={`text-center text-xs font-black uppercase tracking-wider py-2.5 rounded-2xl border shadow-2xs ${
                  col.holiday
                    ? 'bg-rose-50/50 text-rose-700 border-rose-200/80'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {col.label}
                {col.holiday && <span className="block text-[9px] font-extrabold text-rose-500 mt-0.5">HOLIDAY</span>}
              </div>
            ))}

            {/* Empty cells before 1st day of month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[105px] p-2 rounded-2xl bg-slate-50/50 border border-slate-100 opacity-40"
              />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(year, month, dayNum);
              const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              const formattedDateString = `${String(dayNum).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;

              // Check if Today
              const todayObj = new Date();
              const isToday =
                todayObj.getDate() === dayNum &&
                todayObj.getMonth() === month &&
                todayObj.getFullYear() === year;

              // Check Attendance Logs (Present day)
              const isPresent = userLogs.some(
                (l) => l.date === formattedDateString || (l.action === 'login' && new Date(l.timestamp).toDateString() === dateObj.toDateString())
              );

              // Assigned Tasks for this date
              const dayTasks = tasks.filter((t) => {
                if (!t.dueDate) return false;
                const d = new Date(t.dueDate);
                return (
                  d.getDate() === dayNum &&
                  d.getMonth() === month &&
                  d.getFullYear() === year
                );
              });

              return (
                <div
                  key={dayNum}
                  className={`min-h-[110px] p-2 rounded-2xl border transition-all flex flex-col justify-between relative group ${
                    isToday
                      ? 'ring-2 ring-emerald-600 ring-offset-2 bg-emerald-50/60 border-emerald-400 shadow-md'
                      : isPresent
                      ? 'bg-blue-50/90 border-blue-300'
                      : isWeekend
                      ? 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  {/* Date Number Header & Status Badges */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-lg flex items-center justify-center ${
                        isToday
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isPresent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isWeekend
                          ? 'bg-rose-100/90 text-rose-700 border border-rose-200/80 font-bold'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Attendance Present Indicator */}
                    {isPresent ? (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                          isToday
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" /> Present
                      </span>
                    ) : isWeekend ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-150">
                        Weekend
                      </span>
                    ) : null}
                  </div>

                  {/* Assigned Tasks Badges */}
                  <div className="space-y-1 overflow-y-auto max-h-20 pr-0.5 scrollbar-thin">
                    {dayTasks.map((t) => {
                      const isUrgent = t.priority === 'Urgent';
                      const isHigh = t.priority === 'High';
                      const isCompleted = t.status === 'Completed';

                      return (
                        <div
                          key={t._id}
                          onClick={() => setSelectedTask(t)}
                          title={`Task: ${t.title} (${t.priority} • ${t.status})`}
                          className={`p-1.5 rounded-xl text-[10px] font-bold border cursor-pointer truncate transition-all shadow-2xs hover:scale-[1.02] ${
                            isCompleted
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                              : isUrgent
                              ? 'bg-rose-100 border-rose-300 text-rose-800'
                              : isHigh
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-blue-100 border-blue-300 text-blue-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{t.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1-Column: Mini Monthly Calendar Widget (Matching Image 2) */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* Mini Header: < August 2026 > */}
            <div className="bg-slate-50/90 border border-slate-200/60 rounded-2xl p-2 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 flex items-center justify-center transition-all active:scale-95 shadow-2xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>

              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                {monthNames[month]} {year}
              </span>

              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 flex items-center justify-center transition-all active:scale-95 shadow-2xs"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
            </div>

            {/* Mini Weekday Headers (Sun Mon Tue Wed Thu Fri Sat) */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <span key={day} className="text-[11px] font-extrabold text-slate-600">
                  {day}
                </span>
              ))}
            </div>

            {/* Mini Day Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Empty slots before day 1 */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`mini-empty-${i}`} className="w-8 h-8" />
              ))}

              {/* Days 1..31 */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateObj = new Date(year, month, dayNum);
                const dayOfWeek = dateObj.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                const todayObj = new Date();
                const isToday =
                  todayObj.getDate() === dayNum &&
                  todayObj.getMonth() === month &&
                  todayObj.getFullYear() === year;

                // Has task on this date
                const hasTask = tasks.some((t) => {
                  if (!t.dueDate) return false;
                  const d = new Date(t.dueDate);
                  return (
                    d.getDate() === dayNum &&
                    d.getMonth() === month &&
                    d.getFullYear() === year
                  );
                });

                return (
                  <div key={`mini-day-${dayNum}`} className="flex flex-col items-center justify-center py-1">
                    <div
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center cursor-default ${
                        isToday
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black'
                          : isWeekend
                          ? 'text-slate-800 hover:bg-slate-100'
                          : 'text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {dayNum}
                    </div>
                    {/* Dot indicator for assigned task */}
                    {hasTask && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 -mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
        />
      )}

    </div>
  );
};

export default CalendarPage;
