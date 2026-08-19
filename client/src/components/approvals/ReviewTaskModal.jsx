import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { CheckCircle2, XCircle, ArrowRight, Paperclip, Clock, MessageSquare, AlertTriangle } from 'lucide-react';

export const ReviewTaskModal = ({ isOpen, onClose, task, onApprovalComplete }) => {
  const { user, isMain, isMiddle } = useAuth();
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      let res;
      if (isMiddle) {
        // Middle Person: Approve and forward to Main Person
        res = await api.post(`/approvals/${task._id}/middle-approve`, {
          comments: comments || 'Reviewed by Manager and approved for Director authorization.',
        });
      } else if (isMain) {
        // Main Person: Final approval
        res = await api.post(`/approvals/${task._id}/main-approve`, {
          comments: comments || 'Final review approved by Operations Director Arjun Reddy.',
        });
      }

      if (res.success) {
        if (onApprovalComplete) onApprovalComplete(res.task);
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Failed to approve task');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestChangesOnly = false) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason or feedback for the employee.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/approvals/${task._id}/reject`, {
        reason: rejectionReason,
        requestChangesOnly,
      });

      if (res.success) {
        if (onApprovalComplete) onApprovalComplete(res.task);
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Failed to reject task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Approval & Review Screen" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Task Header */}
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              {task.product} • {task.project}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
              {task.status}
            </span>
          </div>

          <h3 className="text-base font-bold text-white">{task.title}</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400">Employee</p>
              <p className="font-semibold text-white mt-0.5">{task.assignedTo?.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Time Spent</p>
              <p className="font-semibold text-indigo-300 mt-0.5 font-mono">
                {task.actualHours || 0}h / {task.estimatedHours}h
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Submitted At</p>
              <p className="font-medium text-slate-200 mt-0.5">
                {task.submittedAt ? new Date(task.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
              </p>
            </div>
          </div>
        </div>

        {/* Employee Submission Notes */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <h4 className="text-xs font-semibold text-slate-300">Employee Submission Comments</h4>
          <p className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
            {task.submissionNotes || 'Task completed and submitted for review.'}
          </p>

          {task.submissionAttachments && task.submissionAttachments.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Submitted Deliverables:</p>
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

        {/* Workflow State Indicator */}
        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
          <p className="font-semibold text-indigo-300">Approval Workflow Stage:</p>
          <div className="flex items-center gap-2 mt-2 text-slate-300">
            <span className="px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 font-mono">1. EMPLOYEE Submit</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            <span className={`px-2 py-0.5 rounded font-mono ${isMiddle ? 'bg-amber-500/30 text-amber-200 font-bold' : 'bg-indigo-900/60 text-indigo-200'}`}>
              2. MANAGER Review
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            <span className={`px-2 py-0.5 rounded font-mono ${isMain ? 'bg-rose-500/30 text-rose-200 font-bold' : 'bg-slate-800 text-slate-400'}`}>
              3. CEO Final Approval
            </span>
          </div>
        </div>

        {/* Action Panel: Toggle Approve or Reject */}
        {!isRejectMode ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Internal Review Comments (Optional)
              </label>
              <input
                type="text"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add internal manager note..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsRejectMode(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject / Request Changes
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleApprove}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isMiddle && 'Approve & Forward to CEO'}
                  {isMain && 'Grant Final Approval (CEO Sign-Off)'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
            <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Provide Reason for Rejection / Changes
            </h4>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please recalculate Q3 regional sales variance figures and update the report."
              className="w-full bg-slate-950 border border-rose-500/30 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsRejectMode(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Back to Approval
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading || !rejectionReason.trim()}
                  onClick={() => handleReject(true)}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  disabled={loading || !rejectionReason.trim()}
                  onClick={() => handleReject(false)}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md shadow-rose-600/30"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
