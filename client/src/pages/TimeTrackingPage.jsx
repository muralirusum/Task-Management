import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import api from '../services/api';
import { ManualTimeModal } from '../components/timetracking/ManualTimeModal';
import { ThisWeekSummary } from '../components/common/ThisWeekSummary';
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const TimeTrackingPage = () => {
  const { user, isMain, isMiddle, isLast } = useAuth();
  const { activeTimer, formattedTime, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimer();

  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const fetchTasksAndLogs = async () => {
    try {
      setLoading(true);
      const [tasksRes, logsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/time/logs'),
      ]);

      if (tasksRes.success) {
        setTasks(tasksRes.tasks || []);
        if (tasksRes.tasks.length > 0 && !selectedTaskId) {
          setSelectedTaskId(tasksRes.tasks[0]._id);
        }
      }
      if (logsRes.success) {
        setTimeLogs(logsRes.logs || []);
      }
    } catch (err) {
      console.error('Failed to load time tracking data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndLogs();
  }, [user?._id]);

  const handleStartStopwatch = async () => {
    if (!selectedTaskId) {
      alert('Please select a task to track');
      return;
    }
    await startTimer(selectedTaskId, 'Live task stopwatch session');
  };

  // Compute metrics
  const totalSessionSeconds = timeLogs.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
  const totalHoursWorked = (totalSessionSeconds / 3600).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Time Management & Stopwatch</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time task tracking, actual vs estimated hours, overtime and time logs
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          Log Manual Hours
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 flex flex-col justify-center">
          {/* Main Stopwatch Widget Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden h-full">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 h-full">
              {/* Left: Stopwatch Display */}
              <div className="text-center lg:text-left space-y-2">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeTimer?.status === 'running' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeTimer?.status === 'running' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  </span>
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
                    {activeTimer?.status === 'running' ? 'Live Stopwatch Active' : activeTimer?.status === 'paused' ? 'Timer Paused' : 'Stopwatch Ready'}
                  </span>
                </div>

                <h1 className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight drop-shadow-md">
                  {activeTimer ? formattedTime : '00:00:00'}
                </h1>

                {activeTimer?.taskId && (
                  <p className="text-xs text-slate-300 font-medium">
                    Tracking: <span className="text-indigo-300 font-bold">{activeTimer.taskId.title}</span>
                  </p>
                )}
              </div>

              {/* Right: Controls */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
                {!activeTimer ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 min-w-[240px] w-full"
                    >
                      {tasks.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.title} ({t.actualHours || 0}h / {t.estimatedHours}h)
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleStartStopwatch}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/40 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Play className="w-4 h-4" />
                      Start Timer
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {activeTimer.status === 'running' ? (
                      <button
                        onClick={pauseTimer}
                        className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Pause Timer
                      </button>
                    ) : (
                      <button
                        onClick={resumeTimer}
                        className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Resume Timer
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        await stopTimer();
                        fetchTasksAndLogs();
                      }}
                      className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Stop & Record Time
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col justify-center">
          <ThisWeekSummary />
        </div>
      </div>

      {/* Task Time Breakdown Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Task Time Allocation & Variance</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Task Title</th>
                <th className="px-5 py-3">Assignee</th>
                <th className="px-5 py-3">Estimated Time</th>
                <th className="px-5 py-3">Actual Time Worked</th>
                <th className="px-5 py-3">Remaining Time</th>
                <th className="px-5 py-3">Overdue Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {tasks.map((task) => {
                const est = task.estimatedHours || 0;
                const act = task.actualHours || 0;
                const remaining = Math.max(0, est - act);
                const overtime = Math.max(0, act - est);

                return (
                  <tr key={task._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800 max-w-xs truncate">{task.title}</td>
                    <td className="px-5 py-3.5 text-slate-300">{task.assignedTo?.name}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">{est} hours</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-300">{act} hours</td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400">
                      {remaining > 0 ? `${remaining.toFixed(1)} hours` : '0h (Complete)'}
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      {overtime > 0 ? (
                        <span className="text-rose-400 font-bold">+{overtime.toFixed(1)}h Over</span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>



      <ManualTimeModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onTimeLogged={() => {
          fetchTasksAndLogs();
        }}
      />
    </div>
  );
};
