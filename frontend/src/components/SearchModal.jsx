import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, Shield, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import TeamBadge from './TeamBadge';

export default function SearchModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ teams: [], players: [], matches: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ teams: [], players: [], matches: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ teams: [], players: [], matches: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query.trim());
        if (res.success) {
          setResults(res.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const hasResults = results.teams.length > 0 || results.players.length > 0 || results.matches.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-orange-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams, players (e.g. Dhoni, Kohli), or matches..."
            className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none text-base"
          />
          {loading && <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />}
          {query && !loading && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-slate-400 bg-slate-800 rounded border border-slate-700">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!query.trim() && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Type a player name, franchise name, or match number to search instantly across CricketVerse.
            </div>
          )}

          {query.trim() && !loading && !hasResults && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No results found for "<span className="text-orange-400 font-medium">{query}</span>"
            </div>
          )}

          {/* Teams Results */}
          {results.teams.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-orange-400/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Teams ({results.teams.length})
              </div>
              <div className="space-y-1.5">
                {results.teams.map((team) => (
                  <button
                    key={team.team_id}
                    onClick={() => {
                      onNavigate('teams', { teamId: team.team_id });
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition text-left group border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <TeamBadge code={team.team_code} size="sm" />
                      <div>
                        <div className="font-medium text-slate-200 text-sm group-hover:text-orange-400 transition">
                          {team.team_name}
                        </div>
                        <div className="text-xs text-slate-400">{team.team_code} Franchise</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Players Results */}
          {results.players.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Players ({results.players.length})
              </div>
              <div className="space-y-1.5">
                {results.players.map((player) => (
                  <button
                    key={player.player_id}
                    onClick={() => {
                      onNavigate('player-detail', { playerId: player.player_id });
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition text-left group border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <TeamBadge code={player.team_code} size="sm" />
                      <div>
                        <div className="font-medium text-slate-200 text-sm group-hover:text-orange-400 transition">
                          {player.player_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {player.team_name} • {player.runs} Runs {player.wickets ? `• ${player.wickets} Wkts` : ''}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matches Results */}
          {results.matches.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Matches ({results.matches.length})
              </div>
              <div className="space-y-1.5">
                {results.matches.map((match) => (
                  <button
                    key={match.match_number}
                    onClick={() => {
                      onNavigate('matches', { matchNumber: match.match_number });
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition text-left group border border-transparent hover:border-slate-700"
                  >
                    <div>
                      <div className="font-medium text-slate-200 text-sm group-hover:text-orange-400 transition">
                        Match #{match.match_number}: {match.team1_code} vs {match.team2_code}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-md">
                        {match.match_date} • {match.venue}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${
                        match.winner_code 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {match.winner_code ? `Won by ${match.winner_code}` : 'Pending'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
