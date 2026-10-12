import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  Search, 
  Crown, 
  Flame, 
  Target, 
  Zap, 
  Award,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import TeamBadge from '../components/TeamBadge';

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

export default function PlayerCompare({ initialP1 = null, initialP2 = null, onNavigate }) {
  const [allPlayers, setAllPlayers] = useState([]);
  const [p1Id, setP1Id] = useState(initialP1 || 801); // Default Vaibhav Suryavanshi
  const [p2Id, setP2Id] = useState(initialP2 || 302); // Default Shubman Gill
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all players for dropdowns
  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await api.getPlayers({ limit: 120, sort_by: 'player_name', order: 'asc' });
        if (res.success) setAllPlayers(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchAll();
  }, []);

  // Fetch comparison data when IDs change
  useEffect(() => {
    async function fetchComp() {
      if (!p1Id || !p2Id || p1Id === p2Id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await api.comparePlayers(p1Id, p2Id);
        if (res.success) {
          setComparison(res.data);
        }
      } catch (err) {
        setError('Failed to fetch player comparison.');
      } finally {
        setLoading(false);
      }
    }
    fetchComp();
  }, [p1Id, p2Id]);

  const p1 = comparison?.player1;
  const p2 = comparison?.player2;
  const leaders = comparison?.leaders || {};

  // Quick compare presets
  const presets = [
    { name: 'Top Scorers: Suryavanshi vs Gill', id1: 801, id2: 302 },
    { name: 'Power Hitters: Kohli vs Klaasen', id1: 902, id2: 1004 },
    { name: 'Ace Bowlers: Rabada vs Bhuvneshwar', id1: 308, id2: 908 },
    { name: 'Captains: Samson vs Pant', id1: 101, id2: 503 },
  ];

  // Grouped Bar chart data
  const compareChart = p1 && p2 ? {
    labels: ['Runs', 'Balls', 'Strike Rate', 'Fours', 'Sixes'],
    datasets: [
      {
        label: p1.player_name,
        data: [p1.runs || 0, p1.balls_faced || 0, p1.strike_rate || 0, p1.fours || 0, p1.sixes || 0],
        backgroundColor: 'rgba(249, 115, 22, 0.85)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: p2.player_name,
        data: [p2.runs || 0, p2.balls_faced || 0, p2.strike_rate || 0, p2.fours || 0, p2.sixes || 0],
        backgroundColor: 'rgba(56, 189, 248, 0.85)',
        borderColor: 'rgb(56, 189, 248)',
        borderWidth: 1,
        borderRadius: 6,
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e2e8f0', font: { family: 'Inter', size: 12 } }
      },
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
        ticks: { color: '#94a3b8' }
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
          <GitCompare className="w-8 h-8 text-orange-400" />
          Head-to-Head Player Comparison
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Select any two cricketers to compare scoring power, averages, boundaries, and bowling metrics.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="cricket-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Player 1 Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
              Select Player 1
            </label>
            <select
              value={p1Id}
              onChange={(e) => setP1Id(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 font-semibold"
            >
              {allPlayers.map((p) => (
                <option key={p.player_id} value={p.player_id}>
                  {p.player_name} ({p.team_code}) — {p.runs || 0} Runs
                </option>
              ))}
            </select>
          </div>

          {/* Player 2 Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">
              Select Player 2
            </label>
            <select
              value={p2Id}
              onChange={(e) => setP2Id(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-semibold"
            >
              {allPlayers.map((p) => (
                <option key={p.player_id} value={p.player_id}>
                  {p.player_name} ({p.team_code}) — {p.runs || 0} Runs
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Quick Matchups:</span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => { setP1Id(preset.id1); setP2Id(preset.id2); }}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {p1Id === p2Id && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-xs text-amber-300">
          Please select two different players to view a head-to-head comparison.
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading comparison data from MySQL...
        </div>
      )}

      {!loading && p1 && p2 && (
        <div className="space-y-6">
          {/* Side-by-side Hero Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player 1 Card */}
            <div className="cricket-card p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <TeamBadge code={p1.team_code} size="lg" />
                  <div>
                    <h2 className="text-xl font-black text-white">{p1.player_name}</h2>
                    <div className="text-xs text-slate-400">{p1.team_name} • #{p1.player_id}</div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('player-detail', { playerId: p1.player_id })}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 text-slate-200 text-xs font-semibold transition"
                >
                  Full Profile
                </button>
              </div>
            </div>

            {/* Player 2 Card */}
            <div className="cricket-card p-6 border-l-4 border-l-sky-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <TeamBadge code={p2.team_code} size="lg" />
                  <div>
                    <h2 className="text-xl font-black text-white">{p2.player_name}</h2>
                    <div className="text-xs text-slate-400">{p2.team_name} • #{p2.player_id}</div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('player-detail', { playerId: p2.player_id })}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-200 text-xs font-semibold transition"
                >
                  Full Profile
                </button>
              </div>
            </div>
          </div>

          {/* Comparison Table with Leader Highlights */}
          <div className="cricket-card p-6">
            <h3 className="font-bold text-lg text-white mb-4">Stat-by-Stat Head to Head</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-center cricket-table text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4 text-left font-bold text-orange-400">{p1.player_name}</th>
                    <th className="py-3 px-4 text-center font-bold text-slate-300">Metric</th>
                    <th className="py-3 px-4 text-right font-bold text-sky-400">{p2.player_name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {/* Runs */}
                  <tr className="hover:bg-slate-800/30">
                    <td className={`py-3.5 px-4 text-left ${leaders.runs === 'player1' ? 'font-black text-emerald-400 text-base' : 'text-slate-300'}`}>
                      {p1.runs ?? '-'} {leaders.runs === 'player1' && '👑'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold uppercase text-xs">Total Runs</td>
                    <td className={`py-3.5 px-4 text-right ${leaders.runs === 'player2' ? 'font-black text-emerald-400 text-base' : 'text-slate-300'}`}>
                      {leaders.runs === 'player2' && '👑 '} {p2.runs ?? '-'}
                    </td>
                  </tr>

                  {/* Balls */}
                  <tr className="hover:bg-slate-800/30">
                    <td className={`py-3.5 px-4 text-left ${leaders.balls_faced === 'player1' ? 'font-black text-emerald-400' : 'text-slate-300'}`}>
                      {p1.balls_faced ?? '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold uppercase text-xs">Balls Faced</td>
                    <td className={`py-3.5 px-4 text-right ${leaders.balls_faced === 'player2' ? 'font-black text-emerald-400' : 'text-slate-300'}`}>
                      {p2.balls_faced ?? '-'}
                    </td>
                  </tr>

                  {/* Batting Average */}
                  <tr className="hover:bg-slate-800/30">
                    <td className={`py-3.5 px-4 text-left ${leaders.batting_average === 'player1' ? 'font-black text-emerald-400 text-base' : 'text-slate-300'}`}>
                      {p1.batting_average ?? '-'} {leaders.batting_average === 'player1' && '👑'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold uppercase text-xs">Batting Average</td>
                    <td className={`py-3.5 px-4 text-right ${leaders.batting_average === 'player2' ? 'font-black text-emerald-400 text-base' : 'text-slate-300'}`}>
                      {leaders.batting_average === 'player2' && '👑 '} {p2.batting_average ?? '-'}
                    </td>
                  </tr>

                  {/* Strike Rate */}
                  <tr className="hover:bg-slate-800/30">
                    <td className={`py-3.5 px-4 text-left ${leaders.strike_rate === 'player1' ? 'font-black text-emerald-400 text-base' : 'text-slate-300'}`}>
                      {p1.strike_rate ?? '-'} {leaders.strike_rate === 'player1' && '👑'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold uppercase text-xs">Strike Rate</td>
                    <td className={`py-3.5 px-4 text-right ${leaders.strike_rate === 'player2' ? 'font-black text-emerald-400 text-base' : 'text-slate-300'}`}>
                      {leaders.strike_rate === 'player2' && '👑 '} {p2.strike_rate ?? '-'}
                    </td>
                  </tr>

                  {/* Fours */}
                  <tr className="hover:bg-slate-800/30">
                    <td className={`py-3.5 px-4 text-left ${leaders.fours === 'player1' ? 'font-black text-emerald-400' : 'text-slate-300'}`}>
                      {p1.fours ?? '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold uppercase text-xs">Fours (4s)</td>
                    <td className={`py-3.5 px-4 text-right ${leaders.fours === 'player2' ? 'font-black text-emerald-400' : 'text-slate-300'}`}>
                      {p2.fours ?? '-'}
                    </td>
                  </tr>

                  {/* Sixes */}
                  <tr className="hover:bg-slate-800/30">
                    <td className={`py-3.5 px-4 text-left ${leaders.sixes === 'player1' ? 'font-black text-emerald-400' : 'text-slate-300'}`}>
                      {p1.sixes ?? '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold uppercase text-xs">Sixes (6s)</td>
                    <td className={`py-3.5 px-4 text-right ${leaders.sixes === 'player2' ? 'font-black text-emerald-400' : 'text-slate-300'}`}>
                      {p2.sixes ?? '-'}
                    </td>
                  </tr>

                  {/* Wickets */}
                  <tr className="hover:bg-slate-800/30">
                    <td className={`py-3.5 px-4 text-left ${leaders.wickets === 'player1' ? 'font-black text-emerald-400 text-base' : 'text-slate-300'}`}>
                      {p1.wickets !== null ? p1.wickets : '-'} {leaders.wickets === 'player1' && p1.wickets ? '👑' : ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold uppercase text-xs">Wickets</td>
                    <td className={`py-3.5 px-4 text-right ${leaders.wickets === 'player2' ? 'font-black text-emerald-400 text-base' : 'text-slate-300'}`}>
                      {leaders.wickets === 'player2' && p2.wickets ? '👑 ' : ''} {p2.wickets !== null ? p2.wickets : '-'}
                    </td>
                  </tr>

                  {/* Economy Rate */}
                  <tr className="hover:bg-slate-800/30">
                    <td className={`py-3.5 px-4 text-left ${leaders.economy_rate === 'player1' ? 'font-black text-emerald-400 text-base' : 'text-slate-300'}`}>
                      {p1.economy_rate !== null ? p1.economy_rate : '-'} {leaders.economy_rate === 'player1' && p1.economy_rate ? '👑' : ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold uppercase text-xs">Economy Rate (Lower is better)</td>
                    <td className={`py-3.5 px-4 text-right ${leaders.economy_rate === 'player2' ? 'font-black text-emerald-400 text-base' : 'text-slate-300'}`}>
                      {leaders.economy_rate === 'player2' && p2.economy_rate ? '👑 ' : ''} {p2.economy_rate !== null ? p2.economy_rate : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Grouped Bar Chart Visual */}
          {compareChart && (
            <div className="cricket-card p-6">
              <h3 className="font-bold text-base text-white mb-1">Comparative Visual Spectrum</h3>
              <p className="text-xs text-slate-400 mb-5">Normalized side-by-side batting metric comparison</p>
              <div className="h-64 w-full">
                <Bar data={compareChart} options={chartOptions} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
