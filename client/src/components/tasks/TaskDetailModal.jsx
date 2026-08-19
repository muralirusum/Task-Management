import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { DeadlineBadge } from '../common/DeadlineBadge';
import { useAuth } from '../../context/AuthContext';
import { useTimer } from '../../context/TimerContext';
import api from '../../services/api';
import {
  Clock,
  Calendar,
  User,
  Folder,
  Send,
  Paperclip,
  MessageSquare,
  Lock,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export const TaskDetailModal = ({ isOpen, onClose, task, onTaskUpdated, onOpenSubmit, onOpenReview }) => {
  const { user, isMain, isMiddle, isLast } = useAuth();
  const { activeTimer, startTimer, pauseTimer, resumeTimer } = useTimer();
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);

  if (!task) return null;

  const isAssignedToMe = task.assignedTo?._id === user?._id || task.assignedTo === user?._id;
  const isTimerActiveForThis = activeTimer?.taskId?._id === task._id;
  const isTimerRunning = isTimerActiveForThis && activeTimer?.status === 'running';

  const canSubmit = isAssignedToMe && (task.status === 'Assigned' || task.status === 'In Progress' || task.status === 'Rejected');
  const needsReview =
    (isMiddle && (task.status === 'Submitted' || task.status === 'Under Review')) ||
    (isMain && (task.status === 'Forwarded to Main' || task.status === 'Submitted'));

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoadingComment(true);
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, {
        comment: commentText,
        isInternal: isInternalComment,
      });
      if (res.success) {
        setCommentText('');
        setIsInternalComment(false);
        if (onTaskUpdated) onTaskUpdated(res.task);
      }
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setLoadingComment(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Overview & Workflow" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              {task.product || 'NovaCRM'}
            </span>
            <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
              {task.taskType || 'General Work'}
            </span>
            <PriorityBadge priority={task.priority} />
          </div>
          <StatusBadge status={task.status} displayStatus={task.displayStatus} />
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{task.title}</h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            {task.description}
          </p>
        </div>

        {/* Rejection / Feedback Notice */}
        {task.rejectionReason && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-300">Manager Feedback / Changes Requested:</p>
              <p className="text-xs text-rose-200 mt-1">{task.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assigned To</p>
            <div className="flex items-center gap-2.5 mt-2">
              <img
                src={task.assignedTo?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'}
                alt={task.assignedTo?.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-700"
              />
              <div>
                <p className="text-xs font-semibold text-white">{task.assignedTo?.name}</p>
                <p className="text-[10px] text-slate-400">{task.assignedTo?.position}</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assigned By</p>
            <div className="flex items-center gap-2.5 mt-2">
              <img
                src={task.assignedBy?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100'}
                alt={task.assignedBy?.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-700"
              />
              <div>
                <p className="text-xs font-semibold text-white">{task.assignedBy?.name}</p>
                <p className="text-[10px] text-slate-400">{task.assignedBy?.position}</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Project / Scope</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-200">
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>{task.project || 'General Operations'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deadline</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-200 font-medium">
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <DeadlineBadge dueDate={task.dueDate} status={task.status} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time Allocation</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">Actual / Estimated:</span>
              <span className="font-semibold text-white font-mono">
                {task.actualHours || 0}h / {task.estimatedHours}h
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Work Timer</p>
              <p className="text-xs text-indigo-300 font-semibold mt-1">
                {isTimerRunning ? 'Stopwatch Running' : 'Timer Ready'}
              </p>
            </div>
            {isAssignedToMe && task.status !== 'Completed' && (
              <div className="flex items-center gap-1.5">
                {isTimerRunning ? (
                  <button
                    onClick={pauseTimer}
                    className="p-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold flex items-center gap-1"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                ) : (
                  <button
                    onClick={() => (isTimerActiveForThis ? resumeTimer() : startTimer(task._id))}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Play className="w-4 h-4" /> Start
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submission Details (If submitted) */}
        {task.submissionNotes && (
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                Employee Submission Report
              </h4>
              {task.submittedAt && (
                <span className="text-[11px] text-slate-400">
                  {new Date(task.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
              {task.submissionNotes}
            </p>

            {task.submissionAttachments && task.submissionAttachments.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Attachments:</p>
                <div className="flex flex-wrap gap-2">
                  {task.submissionAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-indigo-300"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{att.name}</span>
                      <span className="text-slate-500 text-[10px]">({att.size})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comments Stream */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Discussion & Activity Notes
          </h4>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {(!task.comments || task.comments.length === 0) && (
              <p className="text-xs text-slate-500 italic py-2">No comments posted yet.</p>
            )}

            {task.comments?.map((c) => (
              <div
                key={c._id}
                className={`p-3 rounded-xl border text-xs ${
                  c.isInternal
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-slate-950 border-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{c.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono capitalize">({c.userRole})</span>
                    {c.isInternal && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                        <Lock className="w-2.5 h-2.5" /> Internal Note
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{c.comment}</p>
              </div>
            ))}
          </div>

          {/* Post Comment Input */}
          <form onSubmit={handlePostComment} className="pt-2">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type a comment or status note..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={loadingComment || !commentText.trim()}
                  className="absolute right-2 top-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Post
                </button>
              </div>

              {(isMain || isMiddle) && (
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Mark as Internal Manager Note (Hidden from Last Person)</span>
                </label>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {canSubmit && (
              <button
                onClick={() => {
                  onClose();
                  if (onOpenSubmit) onOpenSubmit(task);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Task for Review
              </button>
            )}

            {needsReview && (
              <button
                onClick={() => {
                  onClose();
                  if (onOpenReview) onOpenReview(task);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-md shadow-amber-600/30"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Open Review Screen
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
