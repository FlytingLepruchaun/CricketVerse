import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../api/client';
import TeamBadge from '../components/TeamBadge';
import { TableSkeleton } from '../components/LoadingSkeleton';

const formatTeamScore = (runs, wickets, overs) => {
  if (runs == null && wickets == null && overs == null) return 'No score yet';

  const formattedOvers = overs === null || overs === undefined
    ? '–'
    : Number(overs).toFixed(1);
  return `${runs ?? '–'}/${wickets ?? '–'} (${formattedOvers})`;
};

const formatWinningMargin = (match) => {
  if (!match.winner_code) return 'Result Pending';
  if (match.winning_margin == null || !match.winning_margin_type) {
    return `Winner: ${match.winner_name} (${match.winner_code}) — winning margin not provided`;
  }

  const unit = match.winning_margin_type === 'runs' ? 'run' : 'wicket';
  const plural = match.winning_margin === 1 ? '' : 's';
  return `Winner: ${match.winner_name} (${match.winner_code}) by ${match.winning_margin} ${unit}${plural}`;
};

export default function Matches({ initialStatus = 'all', initialMatchNumber = null, onNavigate }) {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);
  const [statusTab, setStatusTab] = useState(initialStatus); // 'all', 'completed', 'pending'
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Load teams and venues
  useEffect(() => {
    async function loadMeta() {
      try {
        const [teamsRes, venuesRes] = await Promise.all([
          api.getTeams(),
          api.getMatchVenues()
        ]);
        if (teamsRes.success) setTeams(teamsRes.data);
        if (venuesRes.success) setVenues(venuesRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  // Fetch matches
  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        const params = {
          status: statusTab,
          page,
          limit,
          order,
          search: search.trim(),
        };
        if (selectedTeam) params.team_id = selectedTeam;
        if (selectedVenue) params.venue = selectedVenue;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const res = await api.getMatches(params);
        if (res.success) {
          setMatches(res.data);
          setPagination(res.pagination);
        }
      } catch (err) {
        console.error('Fetch matches error:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchMatches, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [statusTab, selectedTeam, selectedVenue, search, startDate, endDate, order, page, limit]);

  useEffect(() => {
    if (!initialMatchNumber) return;

    async function loadInitialMatch() {
      try {
        const res = await api.getMatchDetail(initialMatchNumber);
        if (res.success) setSelectedMatch(res.data);
      } catch (err) {
        console.error('Fetch match detail error:', err);
      }
    }

    loadInitialMatch();
  }, [initialMatchNumber]);

  const handleClear = () => {
    setStatusTab('all');
    setSelectedTeam('');
    setSelectedVenue('');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setOrder('asc');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-orange-500" />
            Tournament Matches & Fixtures
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete IPL 2026 fixture schedule and recorded match outcomes.
          </p>
        </div>

        {/* Tab switcher: All, Completed, Pending */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => { setStatusTab('all'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusTab === 'all'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Fixtures
          </button>
          <button
            onClick={() => { setStatusTab('completed'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusTab === 'completed'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => { setStatusTab('pending'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusTab === 'pending'
                ? 'bg-amber-500 text-amber-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Result Pending
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="cricket-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search match # or franchise..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Franchise Select */}
          <div className="min-w-[150px]">
            <select
              value={selectedTeam}
              onChange={(e) => { setSelectedTeam(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500/50 cursor-pointer"
            >
              <option value="">Filter by Team</option>
              {teams.map((t) => (
                <option key={t.team_id} value={t.team_id}>
                  {t.team_code} - {t.team_name}
                </option>
              ))}
            </select>
          </div>

          {/* Venue Select */}
          <div className="min-w-[160px] max-w-[240px]">
            <select
              value={selectedVenue}
              onChange={(e) => { setSelectedVenue(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500/50 cursor-pointer truncate"
            >
              <option value="">All Venues</option>
              {venues.map((v, i) => (
                <option key={i} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              title="Start Date"
            />
            <span className="text-slate-500 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              title="End Date"
            />
          </div>

          {/* Clear Filters */}
          {(selectedTeam || selectedVenue || search || startDate || endDate || statusTab !== 'all') && (
            <button
              onClick={handleClear}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Date Sorting Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
          >
            Date: {order === 'asc' ? 'Earliest First ↑' : 'Latest First ↓'}
          </button>
        </div>
      </div>

      {/* Matches List */}
      <div className="cricket-card p-6">
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : matches.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No matches found matching the criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const isPending = m.status === 'Result Pending';
              return (
                <div
                  key={m.match_number}
                  onClick={() => setSelectedMatch(m)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isPending
                      ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Match Info & Teams */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">MATCH</span>
                        <span className="text-base font-black text-orange-400">#{m.match_number}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                          <span>{m.match_date}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {m.venue}
                          </span>
                        </div>

                        {/* Teams Head-to-Head */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <TeamBadge code={m.team1_code} size="sm" />
                            <span className="text-sm font-bold text-white">{m.team1_name}</span>
                          </div>
                          <span className="text-xs font-black text-slate-500">VS</span>
                          <div className="flex items-center gap-2">
                            <TeamBadge code={m.team2_code} size="sm" />
                            <span className="text-sm font-bold text-white">{m.team2_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Outcome Badge */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      {isPending ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>Result Pending</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Won by {m.winner_name} ({m.winner_code})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-semibold">{matches.length}</span> of{' '}
            <span className="text-white font-semibold">{pagination.total}</span> matches
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

      {/* Match Detail Modal (Section 4.E) */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
              Match Details #{selectedMatch.match_number}
            </div>
            <h2 className="text-xl font-black text-white">
              IPL 2026 Fixture Overview
            </h2>

            <div className="my-5 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-xs font-semibold text-slate-400">{selectedMatch.team1_name}</div>
                <div className="text-2xl font-black text-orange-400 mt-1">
                  {formatTeamScore(
                    selectedMatch.team1_runs,
                    selectedMatch.team1_wickets_lost,
                    selectedMatch.team1_overs
                  )}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-xs font-semibold text-slate-400">{selectedMatch.team2_name}</div>
                <div className="text-2xl font-black text-orange-400 mt-1">
                  {formatTeamScore(
                    selectedMatch.team2_runs,
                    selectedMatch.team2_wickets_lost,
                    selectedMatch.team2_overs
                  )}
                </div>
              </div>
            </div>

            {/* Teams Head to Head Visual */}
            <div className="my-6 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-around text-center">
              <div>
                <TeamBadge code={selectedMatch.team1_code} size="lg" />
                <div className="font-bold text-white text-sm mt-2">{selectedMatch.team1_name}</div>
                <div className="text-xs text-slate-400">Team 1</div>
              </div>
              <div className="text-sm font-black text-orange-400 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
                VS
              </div>
              <div>
                <TeamBadge code={selectedMatch.team2_code} size="lg" />
                <div className="font-bold text-white text-sm mt-2">{selectedMatch.team2_name}</div>
                <div className="text-xs text-slate-400">Team 2</div>
              </div>
            </div>

            {/* Meta details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Match Date:</span>
                <span className="text-white font-medium">{selectedMatch.match_date}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Venue:</span>
                <span className="text-white font-medium text-right max-w-[260px] truncate">{selectedMatch.venue}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Official Outcome:</span>
                <span className={`font-bold ${selectedMatch.winner_code ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatWinningMargin(selectedMatch)}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
