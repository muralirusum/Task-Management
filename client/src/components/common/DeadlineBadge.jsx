import React from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export const DeadlineBadge = ({ dueDate, status }) => {
  if (status === 'Completed' || status === 'Approved') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        Completed
      </span>
    );
  }

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    const daysOver = Math.max(1, Math.ceil(Math.abs(diffHours) / 24));
    return (
      <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
        <AlertTriangle className="w-3.5 h-3.5" />
        Overdue ({daysOver}d)
      </span>
    );
  }

  if (diffHours <= 24) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
        <Clock className="w-3.5 h-3.5" />
        Due Today
      </span>
    );
  }

  if (diffHours <= 48) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-yellow-400 font-medium bg-yellow-500/10 px-2 py-0.5 rounded">
        <Clock className="w-3.5 h-3.5" />
        Due Tomorrow
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
      <Clock className="w-3.5 h-3.5 text-slate-500" />
      {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
    </span>
  );
};
