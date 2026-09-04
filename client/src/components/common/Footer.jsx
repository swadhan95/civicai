import React from 'react';
import { ShieldAlert, Heart, Github, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Civic<span className="text-emerald-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-driven civic engagement and municipal issue resolution platform. Empowering citizens to report problems and track real-time resolution.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Smart City Systems Active
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-300 tracking-wider mb-3">Citizens</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/report" className="hover:text-emerald-400 transition-colors">Report an Issue</Link></li>
              <li><Link to="/map" className="hover:text-emerald-400 transition-colors">Interactive City Map</Link></li>
              <li><Link to="/leaderboard" className="hover:text-emerald-400 transition-colors">Civic Impact Leaderboard</Link></li>
              <li><Link to="/citizen/dashboard" className="hover:text-emerald-400 transition-colors">Contributor Ranking Tiers</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-300 tracking-wider mb-3">Municipal Operations</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/officer/dashboard" className="hover:text-blue-400 transition-colors">Departmental Queue</Link></li>
              <li><Link to="/officer/dashboard" className="hover:text-blue-400 transition-colors">Resolution AI Verification</Link></li>
              <li><Link to="/admin/settings" className="hover:text-purple-400 transition-colors">Points & Ranking Governance</Link></li>
              <li><Link to="/admin/settings" className="hover:text-purple-400 transition-colors">Anti-Spam Controls</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-300 tracking-wider mb-3">Municipal Emergency</h4>
            <div className="space-y-2 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <p className="text-slate-300 font-semibold">Immediate Hazard Helpline</p>
              <p className="text-emerald-400 font-bold text-sm">1800-CIVIC-SOS</p>
              <p className="text-[11px] text-slate-400">For active electrical fires, gas leaks, or bridge hazards, dial municipal emergency immediately.</p>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <p className="text-slate-500">
            © {new Date().getFullYear()} CivicAI Open Governance Initiative. College Hackathon Prototype.
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Built for Public Good</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Production-Ready Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
