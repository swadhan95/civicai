import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Building2,
  Sparkles,
  User,
  Wrench,
  CheckCheck,
  Circle
} from 'lucide-react';

const VerticalTimeline = ({ complaint }) => {
  if (!complaint) return null;

  const timelineEvents = complaint.timeline || [];
  const status = complaint.status;
  const isResolved = status === 'RESOLVED' || status === 'CLOSED';

  // Build sequential canonical milestones
  const milestones = [
    {
      key: 'SUBMITTED',
      title: 'Complaint Submitted',
      description: `Reported by citizen. Assigned SLA: ${complaint.slaDuration || 24} hours.`,
      timestamp: complaint.reportedAt || complaint.createdAt,
      actor: complaint.citizen?.displayName || complaint.citizen?.name || 'Citizen',
      isCompleted: true,
      icon: CheckCircle2,
      color: 'emerald'
    },
    {
      key: 'AI_ANALYSIS',
      title: 'AI Vision & Category Classification',
      description: `${complaint.categoryName} (${complaint.priority} Priority, ${complaint.aiAnalysis?.confidence || 92}% confidence).`,
      timestamp: complaint.createdAt,
      actor: 'CivicAI Vision Engine',
      isCompleted: true,
      icon: Sparkles,
      color: 'indigo'
    },
    {
      key: 'ASSIGNED',
      title: 'Department & Officer Assigned',
      description: `Routed to ${complaint.assignedDepartment?.name || complaint.suggestedDepartment?.name || 'Municipal Works'}. ${
        complaint.assignedOfficer ? `Field Officer: ${complaint.assignedOfficer.name}` : 'Awaiting officer dispatch.'
      }`,
      timestamp: complaint.assignedAt,
      actor: complaint.assignedOfficer?.name || 'Dispatch System',
      isCompleted: status !== 'SUBMITTED',
      isCurrent: status === 'REVIEWED' || status === 'ASSIGNED',
      icon: Building2,
      color: 'blue'
    },
    {
      key: 'IN_PROGRESS',
      title: 'Work In Progress & Field Inspection',
      description: complaint.inProgressAt
        ? `Field crews deployed to site (${complaint.address}).`
        : 'Crew deployment pending.',
      timestamp: complaint.inProgressAt,
      actor: complaint.assignedOfficer?.name || 'Field Crew',
      isCompleted: status === 'IN_PROGRESS' || isResolved,
      isCurrent: status === 'IN_PROGRESS',
      icon: Wrench,
      color: 'blue'
    },
    {
      key: 'RESOLUTION',
      title: 'Issue Resolution & Verification',
      description: isResolved
        ? `Repairs completed and verified. Photographic evidence recorded. (${complaint.slaStatus?.replace(/_/g, ' ') || 'Resolved'})`
        : `Target resolution deadline: ${new Date(complaint.expectedResolutionAt || complaint.slaDeadline || Date.now()).toLocaleString()}`,
      timestamp: complaint.resolvedAt,
      actor: complaint.resolution?.resolvedBy?.name || complaint.assignedOfficer?.name || 'Inspector',
      isCompleted: isResolved,
      isCurrent: isResolved,
      icon: isResolved ? CheckCheck : Clock,
      color: isResolved ? 'teal' : complaint.slaStatus === 'OVERDUE' ? 'rose' : 'slate'
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
            Official Complaint & SLA Audit Timeline
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-400">
          {timelineEvents.length} Audit Events Recorded
        </span>
      </div>

      {/* Sequential Vertical Milestone Track */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {milestones.map((m, idx) => {
          const Icon = m.icon;
          const isDone = m.isCompleted;
          const isNow = m.isCurrent;

          return (
            <div key={m.key} className="relative group">
              {/* Node Icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs transition-transform shadow-xs ${
                  isDone
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                    : isNow
                    ? 'bg-blue-600 text-white ring-4 ring-blue-50 animate-pulse'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              {/* Event Content */}
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4
                    className={`text-xs sm:text-sm font-bold ${
                      isDone || isNow ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {m.title}
                  </h4>
                  {m.timestamp && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(m.timestamp).toLocaleDateString()} at{' '}
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">{m.description}</p>

                {m.actor && isDone && (
                  <p className="text-[10px] text-slate-400">
                    Actor: <strong className="text-slate-700">{m.actor}</strong>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw Audit Logs Trail (Escalations, Extensions, Status changes) */}
      {timelineEvents.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Detailed History & Accountability Log:
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {timelineEvents.slice().reverse().map((evt, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl text-xs flex items-start justify-between gap-3 border ${
                  evt.actionType === 'ESCALATION_RAISED' || evt.actionType === 'SLA_BREACH'
                    ? 'bg-rose-50 border-rose-200 text-rose-950 font-medium'
                    : evt.actionType === 'SLA_EXTENDED'
                    ? 'bg-amber-50 border-amber-200 text-amber-950 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="space-y-0.5">
                  <p className="font-semibold leading-relaxed">{evt.message}</p>
                  <p className="text-[10px] opacity-70">
                    Recorded by: <strong>{evt.actorName || evt.updatedBy?.name || 'System'}</strong> ({evt.actorRole || 'MUNICIPAL'})
                  </p>
                </div>
                <span className="text-[10px] font-mono opacity-60 shrink-0">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerticalTimeline;
