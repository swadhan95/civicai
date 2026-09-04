import React, { useState } from 'react';
import { CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

const BeforeAfterViewer = ({ beforeImage, afterImage, resolutionDetails }) => {
  const [activeTab, setActiveTab] = useState('side-by-side'); // 'side-by-side' | 'before' | 'after'

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden text-white shadow-xl border border-slate-800">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Civic Resolution Verification</h3>
            <p className="text-[11px] text-slate-400">Before & After photographic evidence inspection</p>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('side-by-side')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'side-by-side' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('before')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'before' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Before
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('after')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'after' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            After
          </button>
        </div>
      </div>

      {/* Visual Container */}
      <div className="p-6">
        {activeTab === 'side-by-side' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before Photo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Before Resolution (Reported Issue)
                </span>
              </div>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group">
                <img
                  src={beforeImage}
                  alt="Reported civic defect"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            {/* After Photo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  After Resolution (Completed Repair)
                </span>
                {resolutionDetails?.verifiedByAI && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                    <Sparkles className="w-3 h-3" />
                    AI Verified ({resolutionDetails?.aiConfidence || 95}%)
                  </span>
                )}
              </div>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group">
                <img
                  src={afterImage}
                  alt="Verified resolution repair"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'before' ? (
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Before Resolution Photo</span>
            <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img src={beforeImage} alt="Before" className="w-full h-full object-contain" />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">After Resolution Photo</span>
            <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img src={afterImage} alt="After" className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {/* Resolution Notes & Metadata */}
        {resolutionDetails && (
          <div className="mt-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-slate-400 font-medium">Resolution Notes:</p>
              <p className="text-slate-200 mt-0.5 font-semibold text-sm">
                {resolutionDetails.notes || 'Repairs completed and validated on site.'}
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-slate-700 sm:pl-6">
              <p className="text-slate-400">Resolved Date</p>
              <p className="text-emerald-400 font-semibold mt-0.5">
                {new Date(resolutionDetails.resolvedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeforeAfterViewer;
