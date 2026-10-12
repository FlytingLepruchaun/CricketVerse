import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Shield, 
  Users, 
  Calendar, 
  Flame, 
  Target, 
  Plus, 
  Edit2, 
  Trash2, 
  LogOut, 
  CheckCircle, 
  AlertTriangle, 
  X,
  RefreshCw,
  Key
} from 'lucide-react';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../api/client';
import TeamBadge from '../components/TeamBadge';

export default function Admin({ onShowToast, onAuthChange, onNavigate }) {
  const [token, setToken] = useState(getAuthToken());
  const [adminUser, setAdminUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('teams'); // 'teams', 'players', 'matches', 'batting', 'bowling'

  // Data states
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal / Form states
  const [modalType, setModalType] = useState(null); // 'team', 'player', 'match', 'batting', 'bowling'
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, id, title }

  // Check auth status
  useEffect(() => {
    async function verifyToken() {
      if (!token) return;
      try {
        const res = await api.getAdminMe();
        if (res.success) {
          setAdminUser(res.admin);
          onAuthChange(true);
        } else {
          handleLogout();
        }
      } catch (err) {
        handleLogout();
      }
    }
    verifyToken();
  }, [token]);

  // Load data for active tab
  useEffect(() => {
    if (!adminUser) return;
    loadTabData();
  }, [adminUser, activeTab]);

  async function loadTabData() {
    setLoadingData(true);
    try {
      if (activeTab === 'teams') {
        const res = await api.getTeams();
        if (res.success) setTeams(res.data);
      } else if (activeTab === 'players' || activeTab === 'batting' || activeTab === 'bowling') {
        const [pRes, tRes] = await Promise.all([
          api.getPlayers({ limit: 150, sort_by: 'player_name', order: 'asc' }),
          api.getTeams()
        ]);
        if (pRes.success) setPlayers(pRes.data);
        if (tRes.success) setTeams(tRes.data);
      } else if (activeTab === 'matches') {
        const [mRes, tRes] = await Promise.all([
          api.getMatches({ limit: 100, order: 'desc' }),
          api.getTeams()
        ]);
        if (mRes.success) setMatches(mRes.data);
        if (tRes.success) setTeams(tRes.data);
      }
    } catch (err) {
      onShowToast('Failed to load table data: ' + err.message, 'error');
    } finally {
      setLoadingData(false);
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await api.loginAdmin(loginForm);
      if (res.success) {
        setAuthToken(res.token);
        setToken(res.token);
        setAdminUser(res.admin);
        onAuthChange(true);
        onShowToast(`Welcome back, ${res.admin.username}!`, 'success');
      }
    } catch (err) {
      onShowToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setToken(null);
    setAdminUser(null);
    onAuthChange(false);
    onShowToast('Logged out of admin area.', 'info');
  };

  // Open Form Modal
  const openModal = (type, mode = 'add', initial = {}) => {
    setModalType(type);
    setModalMode(mode);
    setFormData(initial);
  };

  const closeModal = () => {
    setModalType(null);
    setFormData({});
  };

  // Form Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'team') {
        if (modalMode === 'add') {
          await api.addTeam({
            team_id: Number(formData.team_id),
            team_name: formData.team_name,
            team_code: formData.team_code
          });
          onShowToast('Team added successfully!', 'success');
        } else {
          await api.editTeam(formData.team_id, {
            team_name: formData.team_name,
            team_code: formData.team_code
          });
          onShowToast('Team updated successfully!', 'success');
        }
      } else if (modalType === 'player') {
        if (modalMode === 'add') {
          await api.addPlayer({
            player_id: Number(formData.player_id),
            player_name: formData.player_name,
            team_id: Number(formData.team_id)
          });
          onShowToast('Player added successfully!', 'success');
        } else {
          await api.editPlayer(formData.player_id, {
            player_name: formData.player_name,
            team_id: Number(formData.team_id)
          });
          onShowToast('Player updated successfully!', 'success');
        }
      } else if (modalType === 'match') {
        const payload = {
          match_number: Number(formData.match_number),
          match_date: formData.match_date,
          team1_id: Number(formData.team1_id),
          team2_id: Number(formData.team2_id),
          venue: formData.venue,
          winner_id: formData.winner_id ? Number(formData.winner_id) : null
        };
        if (modalMode === 'add') {
          await api.addMatch(payload);
          onShowToast('Match fixture created successfully!', 'success');
        } else {
          await api.editMatch(formData.match_number, payload);
          onShowToast('Match updated successfully!', 'success');
        }
      } else if (modalType === 'batting') {
        await api.saveBatting({
          player_id: Number(formData.player_id),
          runs: Number(formData.runs || 0),
          balls_faced: Number(formData.balls_faced || 0),
          fours: Number(formData.fours || 0),
          sixes: Number(formData.sixes || 0),
          batting_average: formData.batting_average ? Number(formData.batting_average) : null,
          strike_rate: formData.strike_rate ? Number(formData.strike_rate) : null
        });
        onShowToast('Batting record saved successfully!', 'success');
      } else if (modalType === 'bowling') {
        await api.saveBowling({
          player_id: Number(formData.player_id),
          wickets: Number(formData.wickets || 0),
          economy_rate: Number(formData.economy_rate || 0)
        });
        onShowToast('Bowling record saved successfully!', 'success');
      }

      closeModal();
      loadTabData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  // Perform confirmed deletion
  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { type, id } = deleteConfirm;
      if (type === 'team') await api.deleteTeam(id);
      if (type === 'player') await api.deletePlayer(id);
      if (type === 'match') await api.deleteMatch(id);
      if (type === 'batting') await api.deleteBatting(id);
      if (type === 'bowling') await api.deleteBowling(id);

      onShowToast(`Deleted ${type} successfully!`, 'success');
      setDeleteConfirm(null);
      loadTabData();
    } catch (err) {
      onShowToast(err.message, 'error');
      setDeleteConfirm(null);
    }
  };

  // LOGIN SCREEN
  if (!adminUser) {
    return (
      <div className="max-w-md mx-auto my-12 animate-fade-in">
        <div className="cricket-card p-8 shadow-2xl border border-slate-800">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white">Administrator Portal</h1>
            <p className="text-slate-400 text-xs mt-1">
              Secure authentication for CricketVerse MySQL database management.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                placeholder="Enter password (e.g. Admin@123)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-orange-600/25 transition"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
            Default credentials: <code className="text-orange-400">admin</code> / <code className="text-orange-400">Admin@123</code>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN PANEL
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="cricket-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Authenticated Administrator
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Database Operations Console
          </h1>
          <div className="text-xs text-slate-400">
            Signed in as <span className="text-slate-200 font-semibold">{adminUser.username}</span> • Role: <span className="text-orange-400 uppercase font-bold">{adminUser.role}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTabData}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title="Refresh Table Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border border-rose-800/40 text-xs font-bold flex items-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'teams' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" /> Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'players' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Players ({players.length})
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'matches' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Matches ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('batting')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'batting' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" /> Batting Records
        </button>
        <button
          onClick={() => setActiveTab('bowling')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'bowling' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4" /> Bowling Records
        </button>
      </div>

      {/* TAB 1: TEAMS CRUD */}
      {activeTab === 'teams' && (
        <div className="cricket-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Teams Table (Teams)</h2>
              <p className="text-xs text-slate-400">Add, edit, or delete IPL franchises</p>
            </div>
            <button
              onClick={() => openModal('team', 'add', { team_id: '', team_name: '', team_code: '' })}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Franchise
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left cricket-table text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Team ID</th>
                  <th className="py-2.5 px-3">Team Name</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3 text-center">Squad Size</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {teams.map((t) => (
                  <tr key={t.team_id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-400">{t.team_id}</td>
                    <td className="py-3 px-3 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <TeamBadge code={t.team_code} size="sm" />
                        <span>{t.team_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-orange-400">{t.team_code}</td>
                    <td className="py-3 px-3 text-center text-slate-300">{t.squad_size}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal('team', 'edit', t)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Edit Team"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'team', id: t.team_id, title: t.team_name })}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 transition"
                          title="Delete Team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PLAYERS CRUD */}
      {activeTab === 'players' && (
        <div className="cricket-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Players Table (Players)</h2>
              <p className="text-xs text-slate-400">Add or manage player rosters and team assignments</p>
            </div>
            <button
              onClick={() => openModal('player', 'add', { player_id: '', player_name: '', team_id: teams[0]?.team_id || 1 })}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Player
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left cricket-table text-sm">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Player ID</th>
                  <th className="py-2.5 px-3">Player Name</th>
                  <th className="py-2.5 px-3">Franchise</th>
                  <th className="py-2.5 px-3 text-right">Runs</th>
                  <th className="py-2.5 px-3 text-right">Wickets</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {players.map((p) => (
                  <tr key={p.player_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-xs">#{p.player_id}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{p.player_name}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <TeamBadge code={p.team_code} size="sm" />
                        <span className="text-xs text-slate-300 font-medium">{p.team_code}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-orange-400">{p.runs ?? '-'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-purple-400">{p.wickets ?? '-'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal('player', 'edit', p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Edit Player"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'player', id: p.player_id, title: p.player_name })}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 transition"
                          title="Delete Player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MATCHES CRUD */}
      {activeTab === 'matches' && (
        <div className="cricket-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Matches Table (Matches)</h2>
              <p className="text-xs text-slate-400">Update match venues, dates, or enter winning franchise for pending matches</p>
            </div>
            <button
              onClick={() => openModal('match', 'add', { 
                match_number: '', 
                match_date: new Date().toISOString().split('T')[0], 
                team1_id: 1, 
                team2_id: 2, 
                venue: '', 
                winner_id: '' 
              })}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Match
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left cricket-table text-sm">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Team 1</th>
                  <th className="py-2.5 px-3">Team 2</th>
                  <th className="py-2.5 px-3">Venue</th>
                  <th className="py-2.5 px-3">Winner / Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matches.map((m) => (
                  <tr key={m.match_number} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-orange-400">
                      <button
                        type="button"
                        onClick={() => onNavigate('matches', { matchNumber: m.match_number })}
                        className="hover:text-orange-300 hover:underline"
                        title="View match details"
                      >
                        #{m.match_number}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-xs">{m.match_date}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{m.team1_code}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{m.team2_code}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs max-w-[200px] truncate">{m.venue}</td>
                    <td className="py-2.5 px-3">
                      {m.winner_code ? (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {m.winner_code}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Result Pending
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal('match', 'edit', m)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Edit Match / Record Winner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'match', id: m.match_number, title: `Match #${m.match_number}` })}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 transition"
                          title="Delete Match"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BATTING STATS CRUD */}
      {activeTab === 'batting' && (
        <div className="cricket-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Batting Season Table (BattingSeason)</h2>
              <p className="text-xs text-slate-400">Update runs, balls faced, boundaries, average, and strike rate</p>
            </div>
            <button
              onClick={() => openModal('batting', 'edit', { 
                player_id: players[0]?.player_id || 101, 
                runs: 0, 
                balls_faced: 0, 
                fours: 0, 
                sixes: 0, 
                batting_average: 0.0, 
                strike_rate: 0.0 
              })}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Edit Batting Record
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left cricket-table text-sm">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3 text-right">Runs</th>
                  <th className="py-2.5 px-3 text-right">Balls</th>
                  <th className="py-2.5 px-3 text-right">4s</th>
                  <th className="py-2.5 px-3 text-right">6s</th>
                  <th className="py-2.5 px-3 text-right">Average</th>
                  <th className="py-2.5 px-3 text-right">Strike Rate</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {players.map((p) => (
                  <tr key={p.player_id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-semibold text-white">{p.player_name}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{p.team_code}</td>
                    <td className="py-2 px-3 text-right font-black text-orange-400">{p.runs ?? '-'}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{p.balls_faced ?? '-'}</td>
                    <td className="py-2 px-3 text-right text-slate-400">{p.fours ?? '-'}</td>
                    <td className="py-2 px-3 text-right text-slate-400">{p.sixes ?? '-'}</td>
                    <td className="py-2 px-3 text-right text-slate-300 font-semibold">{p.batting_average ?? '-'}</td>
                    <td className="py-2 px-3 text-right text-slate-300 font-semibold">{p.strike_rate ?? '-'}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => openModal('batting', 'edit', p)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Update Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BOWLING STATS CRUD */}
      {activeTab === 'bowling' && (
        <div className="cricket-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Bowling Season Table (BowlingSeason)</h2>
              <p className="text-xs text-slate-400">Update wickets and bowling economy rates</p>
            </div>
            <button
              onClick={() => openModal('bowling', 'edit', { 
                player_id: players[0]?.player_id || 101, 
                wickets: 0, 
                economy_rate: 8.0 
              })}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Edit Bowling Record
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left cricket-table text-sm">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3 text-right">Wickets</th>
                  <th className="py-2.5 px-3 text-right">Economy Rate</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {players.filter(p => p.wickets !== null).map((p) => (
                  <tr key={p.player_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{p.player_name}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-400">{p.team_code}</td>
                    <td className="py-2.5 px-3 text-right font-black text-purple-400">{p.wickets}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">{p.economy_rate}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal('bowling', 'edit', p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Update Bowling Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'bowling', id: p.player_id, title: `${p.player_name}'s Bowling Stats` })}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CRUD Forms */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              {modalMode === 'add' ? 'Create New' : 'Update'} {modalType.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Fill in the parameters below. Records will be safely validated against MySQL schema constraints.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* TEAM FORM */}
              {modalType === 'team' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Team ID (Primary Key)</label>
                    <input
                      type="number"
                      disabled={modalMode === 'edit'}
                      value={formData.team_id || ''}
                      onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                      required
                      placeholder="e.g. 11"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={formData.team_name || ''}
                      onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                      required
                      placeholder="e.g. Pune Warriors"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Team Code (Unique)</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.team_code || ''}
                      onChange={(e) => setFormData({ ...formData, team_code: e.target.value.toUpperCase() })}
                      required
                      placeholder="e.g. PW"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 uppercase"
                    />
                  </div>
                </>
              )}

              {/* PLAYER FORM */}
              {modalType === 'player' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Player ID (Primary Key)</label>
                    <input
                      type="number"
                      disabled={modalMode === 'edit'}
                      value={formData.player_id || ''}
                      onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                      required
                      placeholder="e.g. 1101"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Player Name</label>
                    <input
                      type="text"
                      value={formData.player_name || ''}
                      onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                      required
                      placeholder="e.g. Hardik Pandya"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Franchise Assignment</label>
                    <select
                      value={formData.team_id || ''}
                      onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                    >
                      {teams.map((t) => (
                        <option key={t.team_id} value={t.team_id}>
                          {t.team_name} ({t.team_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* MATCH FORM */}
              {modalType === 'match' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Match Number</label>
                      <input
                        type="number"
                        disabled={modalMode === 'edit'}
                        value={formData.match_number || ''}
                        onChange={(e) => setFormData({ ...formData, match_number: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Match Date</label>
                      <input
                        type="date"
                        value={formData.match_date || ''}
                        onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Team 1</label>
                      <select
                        value={formData.team1_id || ''}
                        onChange={(e) => setFormData({ ...formData, team1_id: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      >
                        {teams.map((t) => (
                          <option key={t.team_id} value={t.team_id}>{t.team_code} - {t.team_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Team 2</label>
                      <select
                        value={formData.team2_id || ''}
                        onChange={(e) => setFormData({ ...formData, team2_id: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      >
                        {teams.map((t) => (
                          <option key={t.team_id} value={t.team_id}>{t.team_code} - {t.team_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Venue Stadium</label>
                    <input
                      type="text"
                      value={formData.venue || ''}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      required
                      placeholder="e.g. Wankhede Stadium, Mumbai"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Winner (Leave empty if Pending)
                    </label>
                    <select
                      value={formData.winner_id || ''}
                      onChange={(e) => setFormData({ ...formData, winner_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="">-- Result Pending (NULL) --</option>
                      {teams.map((t) => (
                        <option key={t.team_id} value={t.team_id}>{t.team_name} ({t.team_code})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* BATTING FORM */}
              {modalType === 'batting' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Player</label>
                    <select
                      value={formData.player_id || ''}
                      onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                      disabled={modalMode === 'edit'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
                    >
                      {players.map((p) => (
                        <option key={p.player_id} value={p.player_id}>{p.player_name} ({p.team_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Runs</label>
                      <input
                        type="number"
                        value={formData.runs || 0}
                        onChange={(e) => setFormData({ ...formData, runs: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Balls Faced</label>
                      <input
                        type="number"
                        value={formData.balls_faced || 0}
                        onChange={(e) => setFormData({ ...formData, balls_faced: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Fours (4s)</label>
                      <input
                        type="number"
                        value={formData.fours || 0}
                        onChange={(e) => setFormData({ ...formData, fours: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Sixes (6s)</label>
                      <input
                        type="number"
                        value={formData.sixes || 0}
                        onChange={(e) => setFormData({ ...formData, sixes: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Batting Average</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.batting_average || ''}
                        onChange={(e) => setFormData({ ...formData, batting_average: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Strike Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.strike_rate || ''}
                        onChange={(e) => setFormData({ ...formData, strike_rate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* BOWLING FORM */}
              {modalType === 'bowling' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Player</label>
                    <select
                      value={formData.player_id || ''}
                      onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                      disabled={modalMode === 'edit'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
                    >
                      {players.map((p) => (
                        <option key={p.player_id} value={p.player_id}>{p.player_name} ({p.team_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Wickets</label>
                      <input
                        type="number"
                        value={formData.wickets || 0}
                        onChange={(e) => setFormData({ ...formData, wickets: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Economy Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.economy_rate || 0}
                        onChange={(e) => setFormData({ ...formData, economy_rate: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL for Destructive Actions */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-300 mb-2">
              Are you sure you want to permanently delete <strong className="text-white">{deleteConfirm.title}</strong>?
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Database foreign keys and cascading rules will apply. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
