import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Camera,
  Cpu,
  MapPin,
  CheckCircle2,
  Trophy,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Users,
  AlertTriangle,
  Droplets,
  Trash2,
  Trees,
  LightbulbOff
} from 'lucide-react';
import { complaintApi } from '../api/complaintApi';
import { leaderboardApi } from '../api/leaderboardApi';

const LandingPage = () => {
  const [stats, setStats] = useState({
    totalComplaints: 184,
    resolvedRate: 88,
    activeContributors: 1420
  });
  const [topCitizens, setTopCitizens] = useState([]);

  useEffect(() => {
    // Load top contributors preview
    leaderboardApi.getLeaderboard({ limit: 3 }).then((res) => {
      if (res.success && res.data) {
        setTopCitizens(res.data);
      }
    }).catch(() => {});
  }, []);

  const issueCategories = [
    { title: 'Potholes & Broken Roads', icon: AlertTriangle, desc: 'Surface craters, cracks and road damage', color: 'bg-orange-500' },
    { title: 'Garbage Accumulation', icon: Trash2, desc: 'Overflowing dumpsters and uncollected waste', color: 'bg-emerald-500' },
    { title: 'Broken Streetlights', icon: LightbulbOff, desc: 'Dark road stretches and damaged poles', color: 'bg-amber-500' },
    { title: 'Water Leakage', icon: Droplets, desc: 'Burst municipal supply lines and flooding', color: 'bg-blue-500' },
    { title: 'Fallen Trees & Hazards', icon: Trees, desc: 'Obstructed thoroughfares and heavy branches', color: 'bg-teal-500' },
    { title: 'Damaged Traffic Signals', icon: ShieldAlert, desc: 'Malfunctioning intersection lights and signs', color: 'bg-rose-500' }
  ];

  const steps = [
    { step: '01', title: 'Take a Photo', desc: 'Capture or upload a picture of the civic problem on your phone or computer.', icon: Camera },
    { step: '02', title: 'AI Classification', desc: 'CivicAI instantly identifies the issue category, calculates severity and suggests the responsible department.', icon: Cpu },
    { step: '03', title: 'Smart Location', desc: 'GPS automatically marks the exact coordinates and checks for duplicate reports nearby to prevent spam.', icon: MapPin },
    { step: '04', title: 'Officer Resolution & Points', desc: 'Municipal crews fix the issue, upload verified AFTER photos, and you earn verified Civic Contributor points!', icon: Trophy }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Smart Public Infrastructure Platform
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              See it. Report it. <br />
              <span className="text-emerald-600">Improve your community.</span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 leading-relaxed font-normal">
              CivicAI eliminates the friction between citizens and municipal authorities. 
              Snap a photo — our AI auto-classifies the defect, calculates urgency, alerts the right department, and rewards your civic impact.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/report"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-100 flex items-center justify-center gap-2.5"
              >
                <Camera className="w-5 h-5" />
                Report an Issue Now
              </Link>
              <Link
                to="/map"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border border-slate-300 shadow-sm transition-all hover:border-slate-400 flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5 text-emerald-600" />
                Explore City Map
              </Link>
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <p className="text-3xl font-extrabold text-slate-900">98%</p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">AI Accuracy</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <p className="text-3xl font-extrabold text-emerald-600">&lt; 48 hrs</p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Avg Resolution</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <p className="text-3xl font-extrabold text-blue-600">50m</p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">De-duplication</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <p className="text-3xl font-extrabold text-amber-500">Quality-Based</p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Points (Anti-Spam)</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Workflow</h2>
          <h3 className="text-3xl font-extrabold text-slate-900">How CivicAI Works in 4 Steps</h3>
          <p className="text-sm text-slate-500">
            From smart defect detection to verified municipal resolution and citizen rewards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative group hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="text-4xl font-extrabold text-slate-100 absolute top-4 right-4 group-hover:text-emerald-50 transition-colors">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Supported Issues */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Capabilities</h2>
          <h3 className="text-3xl font-extrabold text-slate-900">Supported Civic Defect Types</h3>
          <p className="text-sm text-slate-500">
            Intelligent detection trained for urban and rural municipal infrastructure challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {issueCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shrink-0 ${cat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{cat.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quality-Based Civic Contributor Preview */}
      <section className="bg-slate-900 text-white py-16 rounded-3xl max-w-7xl mx-auto px-6 sm:px-12 border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              <Trophy className="w-3.5 h-3.5" />
              Impact Over Spam
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Rewarding Real Impact, Not Photo Floods.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unlike simplistic apps that reward spamming identical photos, CivicAI awards points based on{' '}
              <strong className="text-emerald-400">verified authenticity</strong>,{' '}
              <strong className="text-blue-400">successful repairs</strong>, and{' '}
              <strong className="text-amber-400">unique community defect discovery</strong>. False reports deduct points.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                to="/leaderboard"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                View Leaderboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Mini Leaderboard preview card */}
          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top Civic Champions</span>
              <span className="text-xs text-emerald-400 font-semibold">Live Community Standings</span>
            </div>

            <div className="space-y-3">
              {topCitizens.length > 0 ? (
                topCitizens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-bold text-slate-400 text-xs">#{item.position}</span>
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                        {item.badge}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{item.displayName}</p>
                        <p className="text-[10px] text-slate-400">{item.rank?.name || 'Citizen'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-400">{item.points.toLocaleString()} pts</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Loading top citizens...</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-8">
        <h2 className="text-3xl font-extrabold text-slate-900">
          Ready to make your neighborhood better?
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Sign in or register a free citizen account in seconds and submit your first verified community report.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
          >
            Create Citizen Account
          </Link>
          <Link
            to="/login"
            className="px-8 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all"
          >
            Sign In
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
