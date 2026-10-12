import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Users, 
  Trophy, 
  ChevronRight, 
  ArrowLeft, 
  Calendar, 
  Flame, 
  Target, 
  ExternalLink 
} from 'lucide-react';
import { api } from '../api/client';
import TeamBadge from '../components/TeamBadge';
import { CardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';

export default function Teams({ selectedTeamId, onNavigate }) {
  const [teams, setTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(selectedTeamId || null);
  const [teamDetail, setTeamDetail] = useState(null);
  const [squad, setSquad] = useState([]);
  const [matches, setMatches] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState('squad'); // 'squad' or 'matches'

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        const res = await api.getTeams();
        if (res.success) {
          setTeams(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTeams();
  }, []);

  useEffect(() => {
    if (activeTeamId) {
      loadTeamDetail(activeTeamId);
    } else {
      setTeamDetail(null);
      setSquad([]);
      setMatches([]);
    }
  }, [activeTeamId]);

  async function loadTeamDetail(id) {
    try {
      setDetailLoading(true);
      const [detailRes, squadRes, matchesRes] = await Promise.all([
        api.getTeamDetail(id),
        api.getTeamPlayers(id),
        api.getTeamMatches(id)
      ]);
      if (detailRes.success) setTeamDetail(detailRes.data);
      if (squadRes.success) setSquad(squadRes.data);
      if (matchesRes.success) setMatches(matchesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  }

  // Filtered teams list
  const filteredTeams = teams.filter((t) => {
    const q = search.toLowerCase();
    return t.team_name.toLowerCase().includes(q) || t.team_code.toLowerCase().includes(q);
  });

  if (loading) {
    return <CardSkeleton count={6} />;
  }

  // TEAM DETAIL VIEW
  if (activeTeamId && teamDetail) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => setActiveTeamId(null)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-orange-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Teams Explorer
        </button>

        {/* Team Header Banner */}
        <div className="cricket-card p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <TeamBadge code={teamDetail.team_code} size="xl" />
              <div>
                <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                  Franchise #{teamDetail.team_id}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {teamDetail.team_name}
                </h1>
                <div className="text-sm text-slate-400 mt-0.5">
                  Code: <span className="text-slate-200 font-semibold">{teamDetail.team_code}</span> • Squad: <span className="text-slate-200 font-semibold">{teamDetail.squad_size} Players</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400 font-medium">Matches</div>
                <div className="text-xl font-black text-white">{teamDetail.total_matches}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[11px] text-emerald-400 font-medium">Wins</div>
                <div className="text-xl font-black text-emerald-400">{teamDetail.wins}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[11px] text-orange-400 font-medium">Team Runs</div>
                <div className="text-xl font-black text-orange-400">{teamDetail.total_runs?.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[11px] text-purple-400 font-medium">Wickets</div>
                <div className="text-xl font-black text-purple-400">{teamDetail.total_wickets}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setTab('squad')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === 'squad'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Squad & Statistics ({squad.length})
          </button>
          <button
            onClick={() => setTab('matches')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === 'matches'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Matches & Results ({matches.length})
          </button>
        </div>

        {detailLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : tab === 'squad' ? (
          /* Squad Table */
          <div className="cricket-card p-6 overflow-hidden">
            <h3 className="font-bold text-lg text-white mb-4">Official 2026 Season Squad</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left cricket-table text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-3">Player</th>
                    <th className="py-3 px-3 text-right">Runs</th>
                    <th className="py-3 px-3 text-right">Balls</th>
                    <th className="py-3 px-3 text-right">Avg</th>
                    <th className="py-3 px-3 text-right">SR</th>
                    <th className="py-3 px-3 text-right">4s / 6s</th>
                    <th className="py-3 px-3 text-right">Wickets</th>
                    <th className="py-3 px-3 text-right">Economy</th>
                    <th className="py-3 px-3 text-center">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {squad.map((p) => (
                    <tr key={p.player_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-100">{p.player_name}</div>
                        <div className="text-[11px] text-slate-400">ID #{p.player_id}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-orange-400">
                        {p.runs !== null ? p.runs : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {p.balls_faced !== null ? p.balls_faced : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {p.batting_average !== null ? p.batting_average : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {p.strike_rate !== null ? p.strike_rate : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        {p.fours !== null ? `${p.fours} / ${p.sixes}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-purple-400">
                        {p.wickets !== null ? p.wickets : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {p.economy_rate !== null ? p.economy_rate : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onNavigate('player-detail', { playerId: p.player_id })}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 hover:text-white text-slate-300 transition"
                          title="View Player Profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Matches List */
          <div className="cricket-card p-6">
            <h3 className="font-bold text-lg text-white mb-4">Matches Breakdown</h3>
            <div className="space-y-3">
              {matches.map((m) => {
                const isWon = m.result_status === 'Won';
                const isLost = m.result_status === 'Lost';
                const isPending = m.result_status === 'Pending';

                return (
                  <button
                    type="button"
                    key={m.match_number}
                    onClick={() => onNavigate('matches', { matchNumber: m.match_number })}
                    className="w-full text-left p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-600 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-400">Match #{m.match_number}</span>
                        <span className="text-xs text-slate-500">• {m.match_date}</span>
                        <span className="text-xs text-slate-500">• {m.venue}</span>
                      </div>
                      <div className="text-sm font-semibold text-white flex items-center gap-3">
                        <span>{m.team1_name}</span>
                        <span className="text-slate-500 text-xs">vs</span>
                        <span>{m.team2_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        isWon
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isLost
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {m.result_status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // TEAMS EXPLORER CARDS GRID
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-500" />
            IPL Franchises Explorer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse all 10 tournament franchises, squads, win tallies, and performance records.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name or code..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeams.map((team) => (
          <div
            key={team.team_id}
            onClick={() => setActiveTeamId(team.team_id)}
            className="cricket-card p-6 flex flex-col justify-between cursor-pointer group hover:border-orange-500/40"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <TeamBadge code={team.team_code} size="lg" />
                <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  ID #{team.team_id}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-orange-400 transition">
                {team.team_name}
              </h2>
              <div className="text-xs text-slate-400 mt-1">
                {team.team_code} Franchise • {team.squad_size} Players Roster
              </div>

              {/* Stats Mini Grid */}
              <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Wins</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">{team.wins}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Win %</div>
                  <div className="text-base font-bold text-white mt-0.5">{team.win_percentage}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Runs</div>
                  <div className="text-base font-bold text-orange-400 mt-0.5">{team.total_runs?.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/70 flex items-center justify-between text-xs font-semibold text-orange-400 group-hover:translate-x-1 transition">
              <span>View Squad & Results</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
