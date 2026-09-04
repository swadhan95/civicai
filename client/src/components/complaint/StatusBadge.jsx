import React from 'react';

const StatusBadge = ({ status, size = 'sm' }) => {
  const configs = {
    SUBMITTED: {
      label: 'Submitted',
      classes: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    REVIEWED: {
      label: 'Reviewed',
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    ASSIGNED: {
      label: 'Assigned',
      classes: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    },
    IN_PROGRESS: {
      label: 'In Progress',
      classes: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    RESOLVED: {
      label: 'Resolved',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    REJECTED: {
      label: 'Rejected',
      classes: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    DUPLICATE: {
      label: 'Duplicate',
      classes: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  };

  const current = configs[status] || { label: status, classes: 'bg-slate-100 text-slate-700 border-slate-200' };
  const sizeClass = size === 'xs' ? 'text-[10px] px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${current.classes} ${sizeClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {current.label}
    </span>
  );
};

export default StatusBadge;
