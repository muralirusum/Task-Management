import React from 'react';

const statusConfig = {
  Assigned: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'In Progress': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  Submitted: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'Under Review': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'Forwarded to Main': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  Approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Rejected: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

export const StatusBadge = ({ status, displayStatus }) => {
  const currentStatus = displayStatus || status || 'Assigned';
  const config = statusConfig[currentStatus] || statusConfig.Assigned;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.text.replace('text-', 'bg-')}`} />
      {currentStatus}
    </span>
  );
};
