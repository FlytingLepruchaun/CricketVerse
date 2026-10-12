import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Flame, 
  Target, 
  GitCompare, 
  Zap, 
  Shield, 
  Award,
  CircleDot,
  BarChart2
} from 'lucide-react';
import { api } from '../api/client';
import TeamBadge from '../components/TeamBadge';
import { ProfileSkeleton } from '../components/LoadingSkeleton';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PlayerDetail({ playerId, onNavigate }) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPlayer() {
      if (!playerId) return;
      try {
        setLoading(true);
        const res = await api.getPlayerProfile(playerId);
        if (res.success) {
          setPlayer(res.data);
        }
      } catch (err) {
        setError('Player profile not found.');
      } finally {
        setLoading(false);
      }
    }
    fetchPlayer();
  }, [playerId]);

  if (loading) return <ProfileSkeleton />;

  if (error || !player) {
    return (
      <div className="p-8 cricket-card text-center space-y-4">
        <div className="text-rose-400 font-semibold">{error || 'Player not found'}</div>
        <button
          onClick={() => onNavigate('players')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-xl font-medium"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const { metrics } = player;
  const runs = player.runs || 0;
  const foursRuns = (player.fours || 0) * 4;
  const sixesRuns = (player.sixes || 0) * 6;
  const otherRuns = Math.max(0, runs - foursRuns - sixesRuns);

  // Doughnut chart data for boundary distribution
  const runsBreakdownChart = {
    labels: ['Fours (4s)', 'Sixes (6s)', 'Running Runs'],
    datasets: [
      {
        data: [foursRuns, sixesRuns, otherRuns],
        backgroundColor: [
          'rgba(56, 189, 248, 0.85)', // Sky blue for 4s
          'rgba(249, 115, 22, 0.85)', // Orange for 6s
          'rgba(148, 163, 184, 0.4)', // Slate for singles/doubles
        ],
        borderColor: [
          'rgb(56, 189, 248)',
          'rgb(249, 115, 22)',
          'rgb(100, 116, 139)',
        ],
        borderWidth: 1,
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 12 }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={() => onNavigate('players')} className="hover:text-orange-400 transition">
          Players
        </button>
        <span>/</span>
        <button 
          onClick={() => onNavigate('teams', { teamId: player.team_id })} 
          className="hover:text-orange-400 transition"
        >
          {player.team_name}
        </button>
        <span>/</span>
        <span className="text-slate-200 font-semibold">{player.player_name}</span>
      </div>

      {/* Profile Header Banner */}
      <div className="cricket-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <TeamBadge code={player.team_code} size="xl" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                  Player #{player.player_id}
                </span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {player.team_code}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {player.player_name}
              </h1>
              <div className="text-sm text-slate-400 mt-1">
                Franchise: <span className="text-slate-200 font-semibold">{player.team_name}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('compare', { player1: player.player_id })}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              Compare Player
            </button>
            <button
              onClick={() => onNavigate('teams', { teamId: player.team_id })}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              View Team Squad
            </button>
          </div>
        </div>
      </div>

      {/* Primary Batting Statistics Grid */}
      <div>
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-orange-400 mb-3">
          <Flame className="w-4 h-4" /> Batting Performance Breakdown
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Total Runs</div>
            <div className="text-2xl font-black text-orange-400 mt-1">{player.runs ?? '-'}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {metrics.runs_rank ? `Rank #${metrics.runs_rank} in IPL` : 'Batting Record'}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Balls Faced</div>
            <div className="text-2xl font-black text-white mt-1">{player.balls_faced ?? '-'}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Deliveries Received</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Batting Average</div>
            <div className="text-2xl font-black text-sky-400 mt-1">{player.batting_average ?? '-'}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Season Aggregate</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Strike Rate</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{player.strike_rate ?? '-'}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Runs per 100 Balls</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Fours (4s)</div>
            <div className="text-2xl font-black text-white mt-1">{player.fours ?? '-'}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{(player.fours || 0) * 4} Boundary Runs</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Sixes (6s)</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{player.sixes ?? '-'}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{(player.sixes || 0) * 6} Boundary Runs</div>
          </div>
        </div>
      </div>

      {/* Visual Analytics: Run Composition & Boundaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Doughnut Chart of Run Composition */}
        <div className="cricket-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white mb-1">Runs Composition</h3>
            <p className="text-xs text-slate-400 mb-4">Boundaries vs Running between the wickets</p>
            <div className="h-52 w-full flex items-center justify-center">
              {runs > 0 ? (
                <Doughnut data={runsBreakdownChart} options={doughnutOptions} />
              ) : (
                <div className="text-xs text-slate-500">No batting runs recorded</div>
              )}
            </div>
          </div>
        </div>

        {/* Boundary Impact Card */}
        <div className="md:col-span-2 cricket-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white mb-1">Boundary Impact Metrics</h3>
            <p className="text-xs text-slate-400 mb-5">Calculated scoring acceleration metrics</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Total Boundary Runs</div>
                <div className="text-3xl font-black text-orange-400 mt-1">
                  {metrics.boundary_runs}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  from {player.fours || 0} fours and {player.sixes || 0} sixes
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Boundary Run Share</div>
                <div className="text-3xl font-black text-sky-400 mt-1">
                  {metrics.boundary_percentage}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  of player's total runs came via boundaries
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                <span>Boundary Proportion ({metrics.boundary_runs} runs)</span>
                <span>{metrics.boundary_percentage}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, metrics.boundary_percentage)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bowling Performance Section (Displayed only when bowling data exists) */}
      {metrics.has_bowling ? (
        <div className="cricket-card p-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-purple-400 mb-4">
            <Target className="w-4 h-4" /> Bowling Season Statistics
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Wickets Taken</div>
              <div className="text-3xl font-black text-purple-400 mt-1">{player.wickets}</div>
              <div className="text-xs text-slate-500 mt-1">
                {metrics.wickets_rank ? `Rank #${metrics.wickets_rank} in Tournament` : 'Season Wickets'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Economy Rate</div>
              <div className="text-3xl font-black text-emerald-400 mt-1">{player.economy_rate}</div>
              <div className="text-xs text-slate-500 mt-1">Runs Conceded per Over</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium">Bowler Status</div>
              <div className="text-sm font-bold text-slate-200 mt-1">Active Tournament Bowler</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Verified figures from BowlingSeason aggregate records.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs flex items-center gap-3">
          <CircleDot className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            This player does not have recorded bowling figures in the IPL 2026 database. Non-bowlers are not assigned misleading zero-economy rates.
          </span>
        </div>
      )}
    </div>
  );
}
