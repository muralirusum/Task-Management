import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ReviewTaskModal } from '../components/approvals/ReviewTaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const ApprovalsPage = () => {
  const { user, isMain, isMiddle, isLast } = useAuth();
  const [pendingTasks, setPendingTasks] = useState([]);
  const [approvalsHistory, setApprovalsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTaskForReview, setSelectedTaskForReview] = useState(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const [pendingRes, historyRes] = await Promise.all([
        api.get('/approvals/pending'),
        api.get('/approvals'),
      ]);

      if (pendingRes.success) setPendingTasks(pendingRes.tasks || []);
      if (historyRes.success) setApprovalsHistory(historyRes.approvals || []);
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [user?._id]);

  if (isLast) {
    return (
      <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
        <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">Managerial Approvals Section</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          As a Level 3 Executive, multi-tier manager reviews and internal director forwarding workflows are handled by your reporting supervisor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {isMain ? 'Director Approval & Authorization Queue' : 'Manager Submissions Review Queue'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isMain
            ? 'Grant final organizational sign-off for tasks forwarded by Operations & Sales Managers.'
            : 'Review completed task deliverables submitted by your direct reporting team.'}
        </p>
      </div>

      {/* Pending Reviews Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Pending Approval Queue</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            {pendingTasks.length} Awaiting Action
          </span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading pending reviews...</div>
        ) : pendingTasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold text-white">All Caught Up!</p>
            <p className="text-[11px] text-slate-400">No pending submissions waiting for your authorization right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingTasks.map((task) => (
              <div
                key={task._id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {task.product} • {task.project}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                      {task.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">{task.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={task.assignedTo?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                        alt={task.assignedTo?.name}
                        className="w-6 h-6 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <p className="font-semibold text-white leading-none">{task.assignedTo?.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{task.assignedTo?.position}</p>
                      </div>
                    </div>
                    <span className="font-mono text-indigo-300 font-semibold">{task.actualHours || 0}h logged</span>
                  </div>

                  <button
                    onClick={() => setSelectedTaskForReview(task)}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    Review & Authorize Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewTaskModal
        isOpen={!!selectedTaskForReview}
        onClose={() => setSelectedTaskForReview(null)}
        task={selectedTaskForReview}
        onApprovalComplete={() => {
          fetchApprovals();
        }}
      />
    </div>
  );
};
