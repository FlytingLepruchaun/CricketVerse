import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  ExternalLink,
  Flame,
  Target
} from 'lucide-react';
import { api } from '../api/client';
import TeamBadge from '../components/TeamBadge';
import { TableSkeleton } from '../components/LoadingSkeleton';

export default function Players({ onNavigate }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [sortBy, setSortBy] = useState('runs');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);

  // Load team list for dropdown
  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await api.getTeams();
        if (res.success) setTeams(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadTeams();
  }, []);

  // Fetch players on filter/sort/page changes
  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true);
        const params = {
          page,
          limit,
          sort_by: sortBy,
          order,
          search: search.trim(),
        };
        if (selectedTeam) {
          params.team_code = selectedTeam;
        }

        const res = await api.getPlayers(params);
        if (res.success) {
          setPlayers(res.data);
          setPagination(res.pagination);
        }
      } catch (err) {
        console.error('Fetch players error:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchPlayers, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [search, selectedTeam, sortBy, order, page, limit]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedTeam('');
    setSortBy('runs');
    setOrder('desc');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-sky-400" />
            Tournament Players Directory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Explore 110 IPL cricketers with live batting and bowling metrics.
          </p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="cricket-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by player name..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Franchise Filter Dropdown */}
          <div className="relative min-w-[160px]">
            <select
              value={selectedTeam}
              onChange={(e) => { setSelectedTeam(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500/50 cursor-pointer"
            >
              <option value="">All Teams (10)</option>
              {teams.map((t) => (
                <option key={t.team_id} value={t.team_code}>
                  {t.team_name} ({t.team_code})
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500/50 cursor-pointer"
            >
              <option value="runs">Sort by Runs</option>
              <option value="batting_average">Sort by Average</option>
              <option value="strike_rate">Sort by Strike Rate</option>
              <option value="wickets">Sort by Wickets</option>
              <option value="economy_rate">Sort by Economy</option>
              <option value="fours">Sort by Fours</option>
              <option value="sixes">Sort by Sixes</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || selectedTeam || sortBy !== 'runs' || order !== 'desc') && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Rows per page selector */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Show:</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Players Table */}
      <div className="cricket-card p-6 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={10} cols={7} />
        ) : players.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No players found matching your criteria. Try adjusting your search query or team filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left cricket-table text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 select-none">
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3">Franchise</th>
                  <th 
                    onClick={() => handleSort('runs')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-orange-400 transition"
                  >
                    <div className="inline-flex items-center gap-1">
                      Runs <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('batting_average')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-orange-400 transition"
                  >
                    <div className="inline-flex items-center gap-1">
                      Avg <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('strike_rate')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-orange-400 transition"
                  >
                    <div className="inline-flex items-center gap-1">
                      SR <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">4s / 6s</th>
                  <th 
                    onClick={() => handleSort('wickets')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-orange-400 transition"
                  >
                    <div className="inline-flex items-center gap-1">
                      Wickets <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('economy_rate')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-orange-400 transition"
                  >
                    <div className="inline-flex items-center gap-1">
                      Econ <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {players.map((p) => (
                  <tr 
                    key={p.player_id}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-100 group-hover:text-orange-400 transition">
                        {p.player_name}
                      </div>
                      <div className="text-[11px] text-slate-500">ID #{p.player_id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <TeamBadge code={p.team_code} size="sm" />
                        <span className="font-medium text-slate-300 text-xs">{p.team_code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-orange-400 text-base">
                      {p.runs !== null ? p.runs : '-'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-medium">
                      {p.batting_average !== null ? p.batting_average : '-'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-medium">
                      {p.strike_rate !== null ? p.strike_rate : '-'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-medium">
                      {p.fours !== null ? `${p.fours} / ${p.sixes}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-purple-400 text-base">
                      {p.wickets !== null ? p.wickets : '-'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-medium">
                      {p.economy_rate !== null ? p.economy_rate : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onNavigate('player-detail', { playerId: p.player_id })}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 hover:text-white text-slate-300 text-xs font-semibold transition"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-semibold">{players.length}</span> of{' '}
            <span className="text-white font-semibold">{pagination.total}</span> players
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-200">
              Page {page} of {pagination.total_pages || 1}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.total_pages}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
