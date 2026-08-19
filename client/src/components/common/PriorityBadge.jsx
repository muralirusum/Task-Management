import React from 'react';

const priorityConfig = {
  Low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  High: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  Urgent: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', animate: 'animate-pulse' },
};

export const PriorityBadge = ({ priority }) => {
  const config = priorityConfig[priority] || priorityConfig.Medium;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} ${config.animate || ''}`}
    >
      {priority || 'Medium'}
    </span>
  );
};
