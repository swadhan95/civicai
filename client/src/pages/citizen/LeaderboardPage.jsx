import React, { useState, useEffect } from 'react';
import { leaderboardApi } from '../../api/leaderboardApi';
import { Trophy, Medal, Award, Flame, Filter, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

const LeaderboardPage = () => {
  const [timeframe, setTimeframe] = useState('all'); // 'weekly' | 'monthly' | 'all'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await leaderboardApi.getLeaderboard({ timeframe });
      if (res.success) {
        setLeaderboard(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-amber-600" />
          Civic Contributor Standings
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Community Impact Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Rewarding citizens who submit verified, authentic, and high-impact reports that improve community living.
        </p>
      </div>

      {/* Timeframe Filters */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex items-center gap-1 border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => setTimeframe('weekly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              timeframe === 'weekly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly High-Impact
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              timeframe === 'monthly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Leaders
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('all')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              timeframe === 'all' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All-Time Champions
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Rank 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center order-2 md:order-1 relative">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-sm absolute -top-4 border-2 border-white shadow">
              #2
            </div>
            <div className="text-4xl my-3">{leaderboard[1].badge}</div>
            <h3 className="font-extrabold text-slate-900 text-lg">{leaderboard[1].displayName}</h3>
            <span className="text-xs font-semibold text-slate-400 mt-0.5">
              {leaderboard[1].rank?.name || 'Contributor'}
            </span>
            <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-100 font-extrabold text-slate-800 text-sm">
              {leaderboard[1].points.toLocaleString()} pts
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 w-full flex justify-around text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-800">{leaderboard[1].validReportsCount}</p>
                <p className="text-[10px]">Valid Reports</p>
              </div>
              <div>
                <p className="font-bold text-emerald-600">{leaderboard[1].resolvedReportsCount}</p>
                <p className="text-[10px]">Resolved</p>
              </div>
            </div>
          </div>

          {/* Rank 1 (Champion) */}
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-8 border-2 border-amber-300 shadow-lg flex flex-col items-center text-center order-1 md:order-2 relative -translate-y-2">
            <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-base absolute -top-5 border-4 border-white shadow">
              👑 1
            </div>
            <div className="text-5xl my-3">{leaderboard[0].badge}</div>
            <h3 className="font-black text-slate-900 text-xl">{leaderboard[0].displayName}</h3>
            <span className="text-xs font-bold text-amber-700 mt-0.5">
              {leaderboard[0].rank?.name || 'Civic Champion'}
            </span>
            <div className="mt-4 px-5 py-2 rounded-full bg-amber-400 text-slate-950 font-black text-base shadow-sm">
              {leaderboard[0].points.toLocaleString()} pts
            </div>
            <div className="mt-6 pt-4 border-t border-amber-200/80 w-full flex justify-around text-xs text-slate-600">
              <div>
                <p className="font-extrabold text-slate-900 text-sm">{leaderboard[0].validReportsCount}</p>
                <p className="text-[10px] uppercase font-semibold">Valid Reports</p>
              </div>
              <div>
                <p className="font-extrabold text-emerald-600 text-sm">{leaderboard[0].resolvedReportsCount}</p>
                <p className="text-[10px] uppercase font-semibold">Repairs Completed</p>
              </div>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center order-3 relative">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center text-sm absolute -top-4 border-2 border-white shadow">
              #3
            </div>
            <div className="text-4xl my-3">{leaderboard[2].badge}</div>
            <h3 className="font-extrabold text-slate-900 text-lg">{leaderboard[2].displayName}</h3>
            <span className="text-xs font-semibold text-slate-400 mt-0.5">
              {leaderboard[2].rank?.name || 'Contributor'}
            </span>
            <div className="mt-4 px-4 py-1.5 rounded-full bg-amber-50 text-amber-800 font-extrabold text-sm">
              {leaderboard[2].points.toLocaleString()} pts
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 w-full flex justify-around text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-800">{leaderboard[2].validReportsCount}</p>
                <p className="text-[10px]">Valid Reports</p>
              </div>
              <div>
                <p className="font-bold text-emerald-600">{leaderboard[2].resolvedReportsCount}</p>
                <p className="text-[10px]">Resolved</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900">
            Citizen Standings ({leaderboard.length} Contributors)
          </h3>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Privacy-Protected Display
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Rank</th>
                  <th className="py-3.5 px-6">Citizen</th>
                  <th className="py-3.5 px-6">Tier Badge</th>
                  <th className="py-3.5 px-6">Valid Reports</th>
                  <th className="py-3.5 px-6">Issues Resolved</th>
                  <th className="py-3.5 px-6 text-right">Civic Impact Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {leaderboard.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-slate-900">
                      #{row.position}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {row.displayName}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-semibold">
                        <span>{row.badge}</span>
                        <span>{row.rank?.name || 'Citizen'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-900">{row.validReportsCount}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-emerald-600">{row.resolvedReportsCount}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-amber-600 text-sm">
                      {row.points.toLocaleString()} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
