import React from 'react';
import { X, Clock, Calendar, Timer, CheckSquare, AlertTriangle } from 'lucide-react';

export const SummaryModal = ({ isOpen, onClose, type, details, summary }) => {
  if (!isOpen || !details) return null;

  let title, icon, content;

  switch (type) {
    case 'worked':
      title = 'Total Worked Time Breakdown';
      icon = <Clock className="w-5 h-5 text-indigo-600" />;
      content = (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <span className="text-sm font-bold text-indigo-900">Total for Period</span>
            <span className="text-xl font-black text-indigo-700">{summary.totalWorkedHours}h {summary.totalWorkedMinutes}m</span>
          </div>
          <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
            {Object.keys(details.dailyLogs).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No time logs for this period.</p>
            ) : (
              Object.entries(details.dailyLogs).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, data]) => (
                <div key={date} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">{new Date(date).toLocaleDateString()}</span>
                    <span className="text-xs font-bold text-indigo-600">{Math.floor(data.durationSeconds / 3600)}h {Math.floor((data.durationSeconds % 3600) / 60)}m</span>
                  </div>
                  <div className="space-y-1">
                    {data.logs.map(log => (
                      <div key={log._id} className="text-[11px] flex justify-between text-slate-600">
                        <span className="truncate pr-2">{log.taskId?.title || 'Unknown Task'}</span>
                        <span className="whitespace-nowrap font-mono">{Math.round(log.durationSeconds / 60)}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
      break;

    case 'estimated':
      title = 'Estimated Hours Breakdown';
      icon = <Calendar className="w-5 h-5 text-indigo-600" />;
      content = (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <span className="text-sm font-bold text-indigo-900">Total Estimated</span>
            <span className="text-xl font-black text-indigo-700">{summary.estimatedHours}h {summary.estimatedMinutes}m</span>
          </div>
          <p className="text-xs text-slate-500">Calculated from tasks active or due in this period.</p>
          <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
            {details.periodTasks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No tasks found for this period.</p>
            ) : (
              details.periodTasks.map(task => (
                <div key={task._id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div className="flex flex-col max-w-[70%]">
                    <span className="text-xs font-bold text-slate-700 truncate">{task.title}</span>
                    <span className="text-[10px] text-slate-500">{task.assignedTo?.name}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">{task.estimatedHours || 0}h</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
      break;

    case 'overtime':
      title = 'Overtime Breakdown';
      icon = <Timer className="w-5 h-5 text-orange-500" />;
      content = (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-orange-50 p-4 rounded-xl border border-orange-100">
            <span className="text-sm font-bold text-orange-900">Total Overtime</span>
            <span className="text-xl font-black text-orange-600">{summary.overtimeHours}h {summary.overtimeMinutes}m</span>
          </div>
          <p className="text-xs text-slate-500">Tasks where actual hours exceeded estimated hours.</p>
          <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
            {details.periodTasks.filter(t => (t.actualHours || 0) > (t.estimatedHours || 0)).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No overtime recorded in this period.</p>
            ) : (
              details.periodTasks.filter(t => (t.actualHours || 0) > (t.estimatedHours || 0)).map(task => {
                const over = (task.actualHours || 0) - (task.estimatedHours || 0);
                const oH = Math.floor(over);
                const oM = Math.round((over - oH) * 60);
                return (
                  <div key={task._id} className="p-3 bg-orange-50/50 rounded-lg border border-orange-100 flex justify-between items-center">
                    <div className="flex flex-col max-w-[70%]">
                      <span className="text-xs font-bold text-orange-900 truncate">{task.title}</span>
                      <span className="text-[10px] text-orange-700">Est: {task.estimatedHours || 0}h | Act: {task.actualHours || 0}h</span>
                    </div>
                    <span className="text-xs font-bold text-orange-600">+{oH}h {oM}m</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
      break;

    case 'tasks':
      title = 'Period Tasks';
      icon = <CheckSquare className="w-5 h-5 text-emerald-600" />;
      content = (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <span className="text-sm font-bold text-emerald-900">Completion Rate</span>
            <div className="text-right">
              <span className="text-xl font-black text-emerald-600">{summary.completedTasks} / {summary.totalTasks}</span>
              <p className="text-[10px] font-bold text-emerald-500 uppercase">{summary.totalTasks > 0 ? Math.round((summary.completedTasks/summary.totalTasks)*100) : 0}% Done</p>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
            {details.periodTasks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No tasks found for this period.</p>
            ) : (
              details.periodTasks.map(task => {
                const isDone = task.status === 'Completed' || task.status === 'Approved';
                return (
                  <div key={task._id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div className="flex flex-col max-w-[70%]">
                      <span className={`text-xs font-bold truncate ${isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{task.title}</span>
                      <span className="text-[10px] text-slate-500">{task.assignedTo?.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {task.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
      break;
      
    default:
      return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
              {icon}
            </div>
            <h3 className="text-base font-extrabold text-slate-800">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {content}
        </div>
      </div>
    </div>
  );
};
