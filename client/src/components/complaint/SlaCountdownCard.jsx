import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Flame,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';

const SlaCountdownCard = ({
  complaint,
  onOpenEscalateModal,
  isCitizenOwner = false
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!complaint) return null;

  const isResolved =
    complaint.status === 'RESOLVED' ||
    complaint.status === 'CLOSED' ||
    complaint.status === 'REJECTED';

  const deadline = complaint.expectedResolutionAt || complaint.slaDeadline;
  const deadlineDate = deadline ? new Date(deadline) : null;

  // Calculate difference
  const diffMs = deadlineDate ? deadlineDate.getTime() - now.getTime() : 0;
  const isOverdue = !isResolved && diffMs <= 0;
  const isDueSoon = !isResolved && diffMs > 0 && diffMs <= 6 * 60 * 60 * 1000;

  // Format remaining or overdue time string
  const formatTimeDiff = (ms) => {
    const absMs = Math.abs(ms);
    const totalSecs = Math.floor(absMs / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const slaStatus = isResolved
    ? complaint.slaStatus || 'RESOLVED_ON_TIME'
    : isOverdue
    ? 'OVERDUE'
    : isDueSoon
    ? 'DUE_SOON'
    : 'ON_TRACK';

  return (
    <div
      className={`p-5 rounded-3xl border transition-all ${
        isResolved
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : slaStatus === 'OVERDUE'
          ? 'bg-rose-50/80 border-rose-200 text-rose-950 shadow-xs'
          : slaStatus === 'DUE_SOON'
          ? 'bg-amber-50/80 border-amber-200 text-amber-950'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Clock
              className={`w-4 h-4 ${
                isResolved
                  ? 'text-emerald-600'
                  : slaStatus === 'OVERDUE'
                  ? 'text-rose-600'
                  : slaStatus === 'DUE_SOON'
                  ? 'text-amber-600'
                  : 'text-indigo-600'
              }`}
            />
            <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider opacity-70">
              RESOLUTION SLA & DEADLINE
            </span>
          </div>

          <div>
            {isResolved ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <p className="text-base font-extrabold text-emerald-900">
                  {slaStatus === 'RESOLVED_ON_TIME' ? 'Resolved On-Time' : 'Resolved (Extended SLA)'}
                </p>
              </div>
            ) : isOverdue ? (
              <div className="space-y-0.5">
                <p className="text-xl font-extrabold text-rose-600 tracking-tight flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  {formatTimeDiff(diffMs)} OVERDUE
                </p>
                <p className="text-xs text-rose-700 font-semibold">
                  Deadline was {deadlineDate?.toLocaleDateString()} at{' '}
                  {deadlineDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {formatTimeDiff(diffMs)} remaining
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Expected by {deadlineDate?.toLocaleDateString()} at{' '}
                  {deadlineDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Status Badge & Escalation Trigger */}
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          {/* Status Badge */}
          <div className="self-start sm:self-auto">
            {slaStatus === 'ON_TRACK' && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                🟢 ON TRACK ({complaint.slaDuration || 24}h SLA)
              </span>
            )}
            {slaStatus === 'DUE_SOON' && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                🟡 DUE SOON
              </span>
            )}
            {slaStatus === 'OVERDUE' && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white flex items-center gap-1.5 shadow-sm shadow-rose-600/30">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                🔴 SLA OVERDUE
              </span>
            )}
            {(slaStatus === 'RESOLVED_ON_TIME' || slaStatus === 'RESOLVED_LATE') && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white flex items-center gap-1.5">
                ✓ CLOSED
              </span>
            )}
          </div>

          {/* Citizen Escalation Action or Informational Label */}
          {!isResolved && (
            <div>
              {isOverdue ? (
                complaint.isEscalated ? (
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-900 font-bold text-xs inline-flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                      Escalated (Supervisor Reviewing)
                    </span>
                  </div>
                ) : isCitizenOwner ? (
                  <button
                    type="button"
                    onClick={onOpenEscalateModal}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all hover:scale-105"
                  >
                    <Flame className="w-4 h-4" />
                    Raise Escalation
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-rose-700">
                    SLA Breached • Eligible for Citizen Escalation
                  </span>
                )
              ) : (
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400" />
                  Escalation unlocks if resolution deadline is missed
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlaCountdownCard;
