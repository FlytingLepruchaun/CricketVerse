import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Target, 
  Zap, 
  Award, 
  Shield, 
  BarChart2, 
  TrendingUp,
  CircleDot
} from 'lucide-react';
import { api } from '../api/client';
import TeamBadge from '../components/TeamBadge';
import { TableSkeleton } from '../components/LoadingSkeleton';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Leaderboards({ onNavigate }) {
  const [activeBoard, setActiveBoard] = useState('orange'); // 'orange', 'purple', 'avg', 'sr', 'fours', 'sixes', 'economy', 'teams'
  const [data, setData] = useState(null);
  const [teamStats, setTeamStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const [boardRes, teamRes] = await Promise.all([
          api.getLeaderboards(15),
          api.getTeamStats()
        ]);
        if (boardRes.success) setData(boardRes.data);
        if (teamRes.success) setTeamStats(teamRes.data);
      } catch (err) {
        console.error('Stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-slate-800/40 rounded-2xl animate-pulse" />
        <TableSkeleton rows={10} cols={6} />
      </div>
    );
  }

  // Categories config
  const categories = [
    { id: 'orange', label: 'Orange Cap', icon: Flame, color: 'text-orange-400', key: 'orange_cap' },
    { id: 'purple', label: 'Purple Cap', icon: Target, color: 'text-purple-400', key: 'purple_cap' },
    { id: 'avg', label: 'Batting Average', icon: Award, color: 'text-sky-400', key: 'highest_average' },
    { id: 'sr', label: 'Strike Rate', icon: Zap, color: 'text-emerald-400', key: 'highest_strike_rate' },
    { id: 'fours', label: 'Most Fours (4s)', icon: TrendingUp, color: 'text-cyan-400', key: 'most_fours' },
    { id: 'sixes', label: 'Most Sixes (6s)', icon: Flame, color: 'text-amber-400', key: 'most_sixes' },
    { id: 'economy', label: 'Best Economy', icon: CircleDot, color: 'text-teal-400', key: 'best_economy' },
    { id: 'teams', label: 'Team Comparisons', icon: Shield, color: 'text-rose-400', key: 'teams' },
  ];

  const currentCategory = categories.find(c => c.id === activeBoard) || categories[0];
  const currentList = data ? data[currentCategory.key] || [] : [];

  // Top 10 Chart data for current player leaderboard
  const top10 = currentList.slice(0, 10);
  const getMetricValue = (item) => {
    if (activeBoard === 'orange') return item.runs;
    if (activeBoard === 'purple') return item.wickets;
    if (activeBoard === 'avg') return item.batting_average;
    if (activeBoard === 'sr') return item.strike_rate;
    if (activeBoard === 'fours') return item.fours;
    if (activeBoard === 'sixes') return item.sixes;
    if (activeBoard === 'economy') return item.economy_rate;
    return 0;
  };

  const chart = {
    labels: top10.map(p => p.player_name),
    datasets: [
      {
        label: currentCategory.label,
        data: top10.map(getMetricValue),
        backgroundColor: activeBoard === 'purple' ? 'rgba(168, 85, 247, 0.8)' : 'rgba(249, 115, 22, 0.8)',
        borderColor: activeBoard === 'purple' ? 'rgb(168, 85, 247)' : 'rgb(249, 115, 22)',
        borderWidth: 1,
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-orange-400" />
          IPL 2026 Statistical Leaderboards
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Official ranking tables, Orange & Purple caps, boundary records, and team summaries.
        </p>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => {
          const Icon = c.icon;
          const isActive = activeBoard === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveBoard(c.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : c.color}`} />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Leaderboard Table / Content */}
      {activeBoard === 'teams' ? (
        /* Team Aggregates Table */
        <div className="cricket-card p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-lg text-white">Franchise Aggregate Leaderboard</h3>
              <p className="text-xs text-slate-400">Team-level aggregate runs, boundaries, strike rates, and bowling wickets</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left cricket-table text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Franchise</th>
                  <th className="py-3 px-3 text-right">Squad</th>
                  <th className="py-3 px-3 text-right font-bold text-orange-400">Runs</th>
                  <th className="py-3 px-3 text-right">Balls</th>
                  <th className="py-3 px-3 text-right">Avg SR</th>
                  <th className="py-3 px-3 text-right">4s / 6s</th>
                  <th className="py-3 px-3 text-right font-bold text-purple-400">Wickets</th>
                  <th className="py-3 px-3 text-right">Avg Econ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {teamStats.map((t, idx) => (
                  <tr 
                    key={t.team_id}
                    onClick={() => onNavigate('teams', { teamId: t.team_id })}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-3 font-bold text-slate-500 text-xs">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <TeamBadge code={t.team_code} size="sm" />
                        <div>
                          <div className="font-bold text-slate-100">{t.team_name}</div>
                          <div className="text-[10px] text-slate-400">{t.team_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">{t.squad_count}</td>
                    <td className="py-3 px-3 text-right font-black text-orange-400 text-base">{t.total_runs.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right text-slate-400">{t.total_balls_faced.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right text-slate-300 font-semibold">{t.avg_strike_rate}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{t.total_fours} / {t.total_sixes}</td>
                    <td className="py-3 px-3 text-right font-black text-purple-400 text-base">{t.total_wickets}</td>
                    <td className="py-3 px-3 text-right text-slate-300 font-semibold">{t.avg_economy_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Player Ranked Leaderboard */
        <div className="space-y-6">
          {/* Top 10 Chart */}
          <div className="cricket-card p-6">
            <h3 className="font-bold text-base text-white mb-1">Top 10 Leaders Comparison</h3>
            <p className="text-xs text-slate-400 mb-5">{currentCategory.label} top performers visual distribution</p>
            <div className="h-56 w-full">
              <Bar data={chart} options={chartOptions} />
            </div>
          </div>

          {/* Table */}
          <div className="cricket-card p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left cricket-table text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Player</th>
                    <th className="py-3 px-3">Franchise</th>
                    {activeBoard === 'orange' && (
                      <>
                        <th className="py-3 px-3 text-right font-bold text-orange-400">Runs</th>
                        <th className="py-3 px-3 text-right">Balls</th>
                        <th className="py-3 px-3 text-right">Avg</th>
                        <th className="py-3 px-3 text-right">SR</th>
                        <th className="py-3 px-3 text-right">4s / 6s</th>
                      </>
                    )}
                    {activeBoard === 'purple' && (
                      <>
                        <th className="py-3 px-3 text-right font-bold text-purple-400">Wickets</th>
                        <th className="py-3 px-3 text-right">Economy</th>
                      </>
                    )}
                    {activeBoard === 'avg' && (
                      <>
                        <th className="py-3 px-3 text-right font-bold text-sky-400">Average</th>
                        <th className="py-3 px-3 text-right">Runs</th>
                        <th className="py-3 px-3 text-right">SR</th>
                      </>
                    )}
                    {activeBoard === 'sr' && (
                      <>
                        <th className="py-3 px-3 text-right font-bold text-emerald-400">Strike Rate</th>
                        <th className="py-3 px-3 text-right">Runs</th>
                        <th className="py-3 px-3 text-right">Balls</th>
                      </>
                    )}
                    {activeBoard === 'fours' && (
                      <>
                        <th className="py-3 px-3 text-right font-bold text-cyan-400">Fours (4s)</th>
                        <th className="py-3 px-3 text-right">Runs</th>
                      </>
                    )}
                    {activeBoard === 'sixes' && (
                      <>
                        <th className="py-3 px-3 text-right font-bold text-amber-400">Sixes (6s)</th>
                        <th className="py-3 px-3 text-right">Runs</th>
                      </>
                    )}
                    {activeBoard === 'economy' && (
                      <>
                        <th className="py-3 px-3 text-right font-bold text-teal-400">Economy Rate</th>
                        <th className="py-3 px-3 text-right">Wickets</th>
                      </>
                    )}
                    <th className="py-3 px-3 text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentList.map((item) => {
                    const isPodium1 = item.rank === 1;
                    const isPodium2 = item.rank === 2;
                    const isPodium3 = item.rank === 3;

                    return (
                      <tr 
                        key={item.player_id}
                        className="hover:bg-slate-800/40 transition group cursor-pointer"
                        onClick={() => onNavigate('player-detail', { playerId: item.player_id })}
                      >
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                            isPodium1 ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/20' :
                            isPodium2 ? 'bg-slate-300 text-slate-900' :
                            isPodium3 ? 'bg-amber-700 text-white' :
                            'text-slate-500 font-semibold'
                          }`}>
                            {item.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-100 group-hover:text-orange-400 transition">
                          {item.player_name}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <TeamBadge code={item.team_code} size="sm" />
                            <span className="text-xs font-medium text-slate-300">{item.team_code}</span>
                          </div>
                        </td>

                        {activeBoard === 'orange' && (
                          <>
                            <td className="py-3 px-3 text-right font-black text-orange-400 text-base">{item.runs}</td>
                            <td className="py-3 px-3 text-right text-slate-300">{item.balls_faced}</td>
                            <td className="py-3 px-3 text-right text-slate-300">{item.batting_average}</td>
                            <td className="py-3 px-3 text-right text-slate-300 font-semibold">{item.strike_rate}</td>
                            <td className="py-3 px-3 text-right text-slate-400">{item.fours} / {item.sixes}</td>
                          </>
                        )}
                        {activeBoard === 'purple' && (
                          <>
                            <td className="py-3 px-3 text-right font-black text-purple-400 text-base">{item.wickets}</td>
                            <td className="py-3 px-3 text-right text-slate-300 font-semibold">{item.economy_rate}</td>
                          </>
                        )}
                        {activeBoard === 'avg' && (
                          <>
                            <td className="py-3 px-3 text-right font-black text-sky-400 text-base">{item.batting_average}</td>
                            <td className="py-3 px-3 text-right text-slate-300">{item.runs}</td>
                            <td className="py-3 px-3 text-right text-slate-300">{item.strike_rate}</td>
                          </>
                        )}
                        {activeBoard === 'sr' && (
                          <>
                            <td className="py-3 px-3 text-right font-black text-emerald-400 text-base">{item.strike_rate}</td>
                            <td className="py-3 px-3 text-right text-slate-300">{item.runs}</td>
                            <td className="py-3 px-3 text-right text-slate-300">{item.balls_faced}</td>
                          </>
                        )}
                        {activeBoard === 'fours' && (
                          <>
                            <td className="py-3 px-3 text-right font-black text-cyan-400 text-base">{item.fours}</td>
                            <td className="py-3 px-3 text-right text-slate-300">{item.runs}</td>
                          </>
                        )}
                        {activeBoard === 'sixes' && (
                          <>
                            <td className="py-3 px-3 text-right font-black text-amber-400 text-base">{item.sixes}</td>
                            <td className="py-3 px-3 text-right text-slate-300">{item.runs}</td>
                          </>
                        )}
                        {activeBoard === 'economy' && (
                          <>
                            <td className="py-3 px-3 text-right font-black text-teal-400 text-base">{item.economy_rate}</td>
                            <td className="py-3 px-3 text-right text-slate-300 font-semibold">{item.wickets}</td>
                          </>
                        )}

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('player-detail', { playerId: item.player_id });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-orange-600 hover:text-white text-slate-300 text-xs font-semibold transition"
                          >
                            Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
