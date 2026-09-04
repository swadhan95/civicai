import React from 'react';
import { Check, Clock, AlertCircle, XCircle } from 'lucide-react';

const STANDARD_STAGES = [
  { key: 'SUBMITTED', label: 'Submitted', desc: 'Complaint logged & queued' },
  { key: 'REVIEWED', label: 'Reviewed & Assigned', desc: 'Routed to response team' },
  { key: 'IN_PROGRESS', label: 'Work In Progress', desc: 'Field crew mobilized' },
  { key: 'RESOLVED', label: 'Resolved & Verified', desc: 'Repaired & inspected' }
];

const Timeline = ({ currentStatus, timelineEvents = [] }) => {
  // Determine index of current stage in standard workflow
  const stageWeights = {
    SUBMITTED: 0,
    REVIEWED: 1,
    ASSIGNED: 1,
    IN_PROGRESS: 2,
    RESOLVED: 3,
    REJECTED: -1,
    DUPLICATE: -1
  };

  const currentWeight = stageWeights[currentStatus] !== undefined ? stageWeights[currentStatus] : 0;
  const isRejected = currentStatus === 'REJECTED';
  const isDuplicate = currentStatus === 'DUPLICATE';

  const progressPercentage = Math.min(100, Math.max(0, ((currentWeight + 1) / STANDARD_STAGES.length) * 100));

  return (
    <div className="space-y-6">
      {/* Progress Track for standard flow */}
      {!isRejected && !isDuplicate ? (
        <div className="relative">
          <div className="hidden sm:block absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-200 z-0"></div>
          <div
            className="hidden sm:block absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-emerald-500 z-0 transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, (currentWeight / (STANDARD_STAGES.length - 1)) * 100))}%`
            }}
          ></div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
            {STANDARD_STAGES.map((stage, idx) => {
              const isCompleted = currentWeight >= idx;
              const isCurrent = Math.floor(currentWeight) === idx;

              return (
                <div key={stage.key} className="flex sm:flex-col items-center gap-3 sm:text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20 ring-4 ring-emerald-100'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : idx + 1}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isCurrent ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {stage.label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          isRejected ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-purple-50 border-purple-200 text-purple-800'
        }`}>
          {isRejected ? <XCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <div>
            <p className="text-sm font-bold">
              {isRejected ? 'Complaint Rejected' : 'Linked to Master Issue (Duplicate)'}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {isRejected
                ? 'This report was reviewed by municipal officers and marked invalid or spam.'
                : 'Another citizen already reported this issue. Your report has been merged into the Master Issue.'}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Event Log */}
      {timelineEvents && timelineEvents.length > 0 && (
        <div className="border-t border-slate-200 pt-6 mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Audit Activity Timeline
          </h4>
          <div className="space-y-4">
            {timelineEvents.map((evt, index) => (
              <div key={index} className="flex items-start gap-3 text-xs">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{evt.status}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{evt.message}</p>
                  {evt.updatedBy && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      By {evt.updatedBy.displayName || evt.updatedBy.name || 'Municipal Officer'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
