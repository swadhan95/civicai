import React from 'react';
import { AlertCircle, AlertTriangle, ShieldAlert, Check } from 'lucide-react';

const PriorityBadge = ({ priority, size = 'sm' }) => {
  const configs = {
    LOW: {
      label: 'Low Priority',
      classes: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Check
    },
    MEDIUM: {
      label: 'Medium Priority',
      classes: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertCircle
    },
    HIGH: {
      label: 'High Priority',
      classes: 'bg-orange-50 text-orange-800 border-orange-200',
      icon: AlertTriangle
    },
    CRITICAL: {
      label: 'Critical Hazard',
      classes: 'bg-rose-50 text-rose-800 border-rose-200 font-bold animate-pulse',
      icon: ShieldAlert
    }
  };

  const current = configs[priority] || configs.MEDIUM;
  const Icon = current.icon;

  const sizeClass = size === 'xs' ? 'text-[10px] px-2 py-0.5' : size === 'lg' ? 'text-sm px-3.5 py-1.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${current.classes} ${sizeClass}`}
    >
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      {current.label}
    </span>
  );
};

export default PriorityBadge;
