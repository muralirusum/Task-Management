import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { DeadlineBadge } from '../common/DeadlineBadge';
import { useAuth } from '../../context/AuthContext';
import { useTimer } from '../../context/TimerContext';
import { Play, Pause, Clock, Folder, CheckCircle, Send, FileText } from 'lucide-react';

export const TaskCard = ({ task, onClick, onSubmitClick, onReviewClick }) => {
  const { user, isLast, isMiddle, isMain } = useAuth();
  const { activeTimer, startTimer, pauseTimer, resumeTimer } = useTimer();

  const isAssignedToMe = task.assignedTo?._id === user?._id || task.assignedTo === user?._id;
  const isTimerActiveForThis = activeTimer?.taskId?._id === task._id;
  const isTimerRunning = isTimerActiveForThis && activeTimer?.status === 'running';

  const canSubmit = isAssignedToMe && (task.status === 'Assigned' || task.status === 'In Progress' || task.status === 'Rejected');
  const needsMyReview =
    (isMiddle && (task.status === 'Submitted' || task.status === 'Under Review')) ||
    (isMain && (task.status === 'Forwarded to Main' || task.status === 'Submitted'));

  return (
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between relative shadow-xs"
    >
      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {task.product || 'NovaCRM'}
            </span>
            <PriorityBadge priority={task.priority} />
          </div>
          <StatusBadge status={task.status} displayStatus={task.displayStatus} />
        </div>

        {/* Title & Description */}
        <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
          {task.title}
        </h4>
        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed font-medium">
          {task.description}
        </p>

        {/* Project info */}
        {task.project && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 font-medium">
            <Folder className="w-3.5 h-3.5 text-blue-600" />
            <span>{task.project}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
        {/* Time Progress */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {task.actualHours || 0}h / {task.estimatedHours}h est.
            </span>
          </div>
          <DeadlineBadge dueDate={task.dueDate} status={task.status} />
        </div>

        {/* Assignee / Assigner Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <img
              src={task.assignedTo?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'}
              alt={task.assignedTo?.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 leading-none">{task.assignedTo?.name}</p>
              <p className="text-[10px] text-slate-500">{task.assignedTo?.position}</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {isAssignedToMe && task.status !== 'Completed' && (
              <>
                {isTimerRunning ? (
                  <button
                    onClick={pauseTimer}
                    title="Pause Timer"
                    className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => (isTimerActiveForThis ? resumeTimer() : startTimer(task._id))}
                    title="Start Live Timer"
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors shadow-xs"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            {canSubmit && (
              <button
                onClick={() => onSubmitClick && onSubmitClick(task)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Send className="w-3 h-3" />
                Submit
              </button>
            )}

            {needsMyReview && (
              <button
                onClick={() => onReviewClick && onReviewClick(task)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs animate-pulse"
              >
                <CheckCircle className="w-3 h-3" />
                Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
