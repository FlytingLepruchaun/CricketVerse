// Centralized API client for CricketVerse

const API_BASE = import.meta.env.VITE_API_URL || '';

export const getAuthToken = () => localStorage.getItem('cricketverse_admin_token');
export const setAuthToken = (token) => localStorage.setItem('cricketverse_admin_token', token);
export const removeAuthToken = () => localStorage.removeItem('cricketverse_admin_token');

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: Request failed`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

// API Service Methods
export const api = {
  // System Health
  getHealth: () => apiRequest('/api/health'),

  // Dashboard
  getDashboardSummary: () => apiRequest('/api/dashboard/summary'),
  getTopScorers: () => apiRequest('/api/dashboard/top-scorers'),
  getTopWicketTakers: () => apiRequest('/api/dashboard/top-wicket-takers'),
  getStrikeRateLeaders: () => apiRequest('/api/dashboard/strike-rate-leaders'),
  getRecentResults: () => apiRequest('/api/dashboard/recent-results'),
  getPendingMatches: () => apiRequest('/api/dashboard/pending-matches'),
  getTeamStandings: () => apiRequest('/api/dashboard/team-standings'),
  getDashboardCharts: () => apiRequest('/api/dashboard/charts'),

  // Teams
  getTeams: () => apiRequest('/api/teams'),
  getTeamDetail: (id) => apiRequest(`/api/teams/${id}`),
  getTeamPlayers: (id) => apiRequest(`/api/teams/${id}/players`),
  getTeamMatches: (id) => apiRequest(`/api/teams/${id}/matches`),

  // Players
  getPlayers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/players?${query}`);
  },
  getPlayerProfile: (id) => apiRequest(`/api/players/${id}`),
  comparePlayers: (p1, p2) => apiRequest(`/api/players/compare?player1=${p1}&player2=${p2}`),

  // Matches
  getMatches: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/matches?${query}`);
  },
  getMatchDetail: (id) => apiRequest(`/api/matches/${id}`),
  getMatchVenues: () => apiRequest('/api/matches/venues'),

  // Leaderboards & Stats
  getLeaderboards: (limit = 10) => apiRequest(`/api/stats/leaderboards?limit=${limit}`),
  getTeamStats: () => apiRequest('/api/stats/teams'),

  // Search
  search: (q) => apiRequest(`/api/search?q=${encodeURIComponent(q)}`),

  // Admin
  loginAdmin: (creds) => apiRequest('/api/admin/login', { method: 'POST', body: JSON.stringify(creds) }),
  getAdminMe: () => apiRequest('/api/admin/me'),

  // Admin CRUD - Teams
  addTeam: (team) => apiRequest('/api/admin/teams', { method: 'POST', body: JSON.stringify(team) }),
  editTeam: (id, team) => apiRequest(`/api/admin/teams/${id}`, { method: 'PUT', body: JSON.stringify(team) }),
  deleteTeam: (id) => apiRequest(`/api/admin/teams/${id}`, { method: 'DELETE' }),

  // Admin CRUD - Players
  addPlayer: (player) => apiRequest('/api/admin/players', { method: 'POST', body: JSON.stringify(player) }),
  editPlayer: (id, player) => apiRequest(`/api/admin/players/${id}`, { method: 'PUT', body: JSON.stringify(player) }),
  deletePlayer: (id) => apiRequest(`/api/admin/players/${id}`, { method: 'DELETE' }),

  // Admin CRUD - Matches
  addMatch: (match) => apiRequest('/api/admin/matches', { method: 'POST', body: JSON.stringify(match) }),
  editMatch: (id, match) => apiRequest(`/api/admin/matches/${id}`, { method: 'PUT', body: JSON.stringify(match) }),
  deleteMatch: (id) => apiRequest(`/api/admin/matches/${id}`, { method: 'DELETE' }),

  // Admin CRUD - Stats
  saveBatting: (data) => apiRequest('/api/admin/batting', { method: 'POST', body: JSON.stringify(data) }),
  deleteBatting: (playerId) => apiRequest(`/api/admin/batting/${playerId}`, { method: 'DELETE' }),
  saveBowling: (data) => apiRequest('/api/admin/bowling', { method: 'POST', body: JSON.stringify(data) }),
  deleteBowling: (playerId) => apiRequest(`/api/admin/bowling/${playerId}`, { method: 'DELETE' }),
};
