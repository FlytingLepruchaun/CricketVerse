import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Target, 
  Zap, 
  Calendar, 
  Clock, 
  Shield, 
  Users, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { api } from '../api/client';
import TeamBadge from '../components/TeamBadge';
import { CardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [topScorers, setTopScorers] = useState([]);
  const [topWickets, setTopWickets] = useState([]);
  const [strikeRateLeaders, setStrikeRateLeaders] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [
          sumRes,
          scorersRes,
          wicketsRes,
          srRes,
          recentRes,
          pendingRes,
          standingsRes,
          chartsRes
        ] = await Promise.all([
          api.getDashboardSummary(),
          api.getTopScorers(),
          api.getTopWicketTakers(),
          api.getStrikeRateLeaders(),
          api.getRecentResults(),
          api.getPendingMatches(),
          api.getTeamStandings(),
          api.getDashboardCharts()
        ]);

        if (sumRes.success) setSummary(sumRes.data);
        if (scorersRes.success) setTopScorers(scorersRes.data);
        if (wicketsRes.success) setTopWickets(wicketsRes.data);
        if (srRes.success) setStrikeRateLeaders(srRes.data);
        if (recentRes.success) setRecentResults(recentRes.data);
        if (pendingRes.success) setPendingMatches(pendingRes.data);
        if (standingsRes.success) setStandings(standingsRes.data);
        if (chartsRes.success) setChartData(chartsRes.data);
      } catch (err) {
        setError('Failed to fetch dashboard analytics from MySQL backend.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <CardSkeleton count={4} />
        <CardSkeleton count={4} />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-center text-rose-200">
        <div className="text-lg font-semibold mb-2">Error Connecting to Analytics Server</div>
        <p className="text-sm opacity-80 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Chart Configs
  const runsChart = {
    labels: chartData.map(c => c.team_code),
    datasets: [
      {
        label: 'Total Season Runs',
        data: chartData.map(c => c.total_runs),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner & Summary Metrics */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              Live Tournament Insights
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              IPL 2026 Season Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Real-time analytics, leaderboard rankings, and franchise statistics powered by live MySQL aggregates.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('teams')}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              Teams Explorer
            </button>
            <button
              onClick={() => onNavigate('players')}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              Players Directory
            </button>
            <button
              onClick={() => onNavigate('leaderboards')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" />
              Cap Leaderboards
            </button>
          </div>
        </div>

        {/* Counters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5 mt-8 pt-6 border-t border-slate-800/80 relative z-10">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">Franchises</div>
            <div className="text-2xl font-black text-white mt-1">{summary?.total_teams}</div>
            <div className="text-[11px] text-slate-500">10 Teams Squads</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">Players</div>
            <div className="text-2xl font-black text-sky-400 mt-1">{summary?.total_players}</div>
            <div className="text-[11px] text-slate-500">110 Active Roster</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">Total Matches</div>
            <div className="text-2xl font-black text-white mt-1">{summary?.total_matches}</div>
            <div className="text-[11px] text-slate-500">{summary?.completed_matches} Completed</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">{summary?.pending_matches}</div>
            <div className="text-[11px] text-slate-500">Awaiting Result</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-orange-400 font-medium">Tournament Runs</div>
            <div className="text-2xl font-black text-orange-400 mt-1">
              {summary?.total_runs?.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">{summary?.total_sixes} Sixes Hit</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-purple-400 font-medium">Wickets Taken</div>
            <div className="text-2xl font-black text-purple-400 mt-1">
              {summary?.total_wickets?.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">Across 74 Matches</div>
          </div>
        </div>
      </div>

      {/* Pending Matches Section (Highlighted as per Section 4.A & 4.E) */}
      {pendingMatches.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Result Pending
                </span>
                <span className="text-xs text-slate-400">
                  Match #{pendingMatches[0].match_number}
                </span>
              </div>
              <div className="text-base font-bold text-slate-100 mt-0.5">
                {pendingMatches[0].team1_name} ({pendingMatches[0].team1_code}) vs {pendingMatches[0].team2_name} ({pendingMatches[0].team2_code})
              </div>
              <div className="text-xs text-slate-400">
                Scheduled for {pendingMatches[0].match_date} at {pendingMatches[0].venue}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('matches', { status: 'pending' })}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/40 transition flex items-center gap-1.5 self-end md:self-center"
          >
            <span>View Pending Matches</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Performers Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Orange Cap (Most Runs) */}
        <div className="cricket-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Orange Cap</h3>
                  <div className="text-xs text-slate-400">Highest Run Scorers</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('leaderboards')}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
              >
                Full Table <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Spotlight Leader */}
            {topScorers[0] && (
              <div 
                onClick={() => onNavigate('player-detail', { playerId: topScorers[0].player_id })}
                className="p-3.5 rounded-xl bg-gradient-to-r from-orange-500/15 to-transparent border border-orange-500/30 mb-4 flex items-center justify-between cursor-pointer hover:border-orange-500/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <TeamBadge code={topScorers[0].team_code} size="md" />
                  <div>
                    <div className="text-xs font-semibold uppercase text-orange-400 flex items-center gap-1">
                      👑 Cap Leader
                    </div>
                    <div className="font-extrabold text-white text-sm group-hover:text-orange-300 transition">
                      {topScorers[0].player_name}
                    </div>
                    <div className="text-xs text-slate-400">
                      SR {topScorers[0].strike_rate} • Avg {topScorers[0].batting_average}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-orange-400">{topScorers[0].runs}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Runs</div>
                </div>
              </div>
            )}

            {/* Runners Up */}
            <div className="space-y-2">
              {topScorers.slice(1, 4).map((p, idx) => (
                <div
                  key={p.player_id}
                  onClick={() => onNavigate('player-detail', { playerId: p.player_id })}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-500 w-4">{idx + 2}</span>
                    <TeamBadge code={p.team_code} size="sm" />
                    <span className="text-xs font-medium text-slate-200">{p.player_name}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{p.runs} <span className="text-[10px] text-slate-400">runs</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purple Cap (Most Wickets) */}
        <div className="cricket-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Purple Cap</h3>
                  <div className="text-xs text-slate-400">Leading Wicket Takers</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('leaderboards')}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
              >
                Full Table <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Spotlight Leader */}
            {topWickets[0] && (
              <div 
                onClick={() => onNavigate('player-detail', { playerId: topWickets[0].player_id })}
                className="p-3.5 rounded-xl bg-gradient-to-r from-purple-500/15 to-transparent border border-purple-500/30 mb-4 flex items-center justify-between cursor-pointer hover:border-purple-500/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <TeamBadge code={topWickets[0].team_code} size="md" />
                  <div>
                    <div className="text-xs font-semibold uppercase text-purple-400 flex items-center gap-1">
                      👑 Cap Leader
                    </div>
                    <div className="font-extrabold text-white text-sm group-hover:text-purple-300 transition">
                      {topWickets[0].player_name}
                    </div>
                    <div className="text-xs text-slate-400">
                      Econ {topWickets[0].economy_rate}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-purple-400">{topWickets[0].wickets}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Wickets</div>
                </div>
              </div>
            )}

            {/* Runners Up */}
            <div className="space-y-2">
              {topWickets.slice(1, 4).map((p, idx) => (
                <div
                  key={p.player_id}
                  onClick={() => onNavigate('player-detail', { playerId: p.player_id })}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-500 w-4">{idx + 2}</span>
                    <TeamBadge code={p.team_code} size="sm" />
                    <span className="text-xs font-medium text-slate-200">{p.player_name}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{p.wickets} <span className="text-[10px] text-slate-400">wkts</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Highest Strike Rates */}
        <div className="cricket-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Power Hitters</h3>
                  <div className="text-xs text-slate-400">Highest Strike Rates (Min 50 balls)</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('leaderboards')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                Full Table <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Spotlight Leader */}
            {strikeRateLeaders[0] && (
              <div 
                onClick={() => onNavigate('player-detail', { playerId: strikeRateLeaders[0].player_id })}
                className="p-3.5 rounded-xl bg-gradient-to-r from-sky-500/15 to-transparent border border-sky-500/30 mb-4 flex items-center justify-between cursor-pointer hover:border-sky-500/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <TeamBadge code={strikeRateLeaders[0].team_code} size="md" />
                  <div>
                    <div className="text-xs font-semibold uppercase text-sky-400">
                      ⚡ Strike Rate King
                    </div>
                    <div className="font-extrabold text-white text-sm group-hover:text-sky-300 transition">
                      {strikeRateLeaders[0].player_name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {strikeRateLeaders[0].runs} runs off {strikeRateLeaders[0].balls_faced} balls
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-sky-400">{strikeRateLeaders[0].strike_rate}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">SR</div>
                </div>
              </div>
            )}

            {/* Runners Up */}
            <div className="space-y-2">
              {strikeRateLeaders.slice(1, 4).map((p, idx) => (
                <div
                  key={p.player_id}
                  onClick={() => onNavigate('player-detail', { playerId: p.player_id })}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-500 w-4">{idx + 2}</span>
                    <TeamBadge code={p.team_code} size="sm" />
                    <span className="text-xs font-medium text-slate-200">{p.player_name}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{p.strike_rate} <span className="text-[10px] text-slate-400">SR</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Standings Table & Interactive Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Standings Table */}
        <div className="lg:col-span-2 cricket-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-lg text-white">IPL 2026 Points Standings</h3>
              <p className="text-xs text-slate-400">Team match records and win rates calculated dynamically</p>
            </div>
            <button
              onClick={() => onNavigate('teams')}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
            >
              All Teams <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left cricket-table text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Franchise</th>
                  <th className="py-2.5 px-3 text-center">Played</th>
                  <th className="py-2.5 px-3 text-center">Wins</th>
                  <th className="py-2.5 px-3 text-center">Losses</th>
                  <th className="py-2.5 px-3 text-center">Win %</th>
                  <th className="py-2.5 px-3 text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {standings.map((s, idx) => (
                  <tr 
                    key={s.team_id}
                    onClick={() => onNavigate('teams', { teamId: s.team_id })}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-500 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <TeamBadge code={s.team_code} size="sm" />
                        <div>
                          <div className="font-semibold text-slate-100">{s.team_name}</div>
                          <div className="text-[10px] text-slate-400">{s.team_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300 font-medium">{s.played}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">{s.wins}</td>
                    <td className="py-2.5 px-3 text-center text-rose-400 font-medium">{s.losses}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-200">
                      {s.win_percentage}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-orange-400 text-base">
                      {s.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Results Widget */}
        <div className="cricket-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white">Recent Results</h3>
              <button
                onClick={() => onNavigate('matches')}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
              >
                All Matches <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {recentResults.map((m) => (
                <div
                  key={m.match_number}
                  onClick={() => onNavigate('matches', { matchNumber: m.match_number })}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span>Match #{m.match_number} • {m.match_date}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-semibold text-[10px]">
                      Won by {m.winner_code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TeamBadge code={m.team1_code} size="sm" />
                      <span className={`text-xs font-semibold ${m.winner_id === m.team1_id ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                        {m.team1_code}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">VS</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${m.winner_id === m.team2_id ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                        {m.team2_code}
                      </span>
                      <TeamBadge code={m.team2_code} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Franchise Runs Comparison Chart */}
      <div className="cricket-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-orange-400" />
              Franchise Batting Run Totals
            </h3>
            <p className="text-xs text-slate-400">Total cumulative runs scored across 2026 season roster</p>
          </div>
        </div>
        <div className="h-72 w-full">
          {chartData.length > 0 && <Bar data={runsChart} options={chartOptions} />}
        </div>
      </div>
    </div>
  );
}
