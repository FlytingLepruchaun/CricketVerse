import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchModal from './components/SearchModal';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Players from './pages/Players';
import PlayerDetail from './pages/PlayerDetail';
import Matches from './pages/Matches';
import Leaderboards from './pages/Leaderboards';
import PlayerCompare from './pages/PlayerCompare';
import Admin from './pages/Admin';

import { api, getAuthToken } from './api/client';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [pageParams, setPageParams] = useState({});
  const [theme, setTheme] = useState('dark');
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [health, setHealth] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(!!getAuthToken());

  // Check health and connect to MySQL on launch
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch (err) {
        setHealth({ status: 'offline', database: { status: 'unhealthy', error: err.message } });
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Theme effect on body class
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  // Global keyboard shortcuts (Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigation handler
  const handleNavigate = (page, params = {}) => {
    setActivePage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 transition-colors">
      {/* Top Navigation */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activePage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
        {activePage === 'teams' && <Teams selectedTeamId={pageParams.teamId} onNavigate={handleNavigate} />}
        {activePage === 'players' && <Players onNavigate={handleNavigate} />}
        {activePage === 'player-detail' && (
          <PlayerDetail playerId={pageParams.playerId} onNavigate={handleNavigate} />
        )}
        {activePage === 'matches' && (
          <Matches 
            initialStatus={pageParams.status || 'all'} 
            initialMatchNumber={pageParams.matchNumber || null} 
            onNavigate={handleNavigate} 
          />
        )}
        {activePage === 'leaderboards' && <Leaderboards onNavigate={handleNavigate} />}
        {activePage === 'compare' && (
          <PlayerCompare 
            initialP1={pageParams.player1} 
            initialP2={pageParams.player2} 
            onNavigate={handleNavigate} 
          />
        )}
        {activePage === 'admin' && (
          <Admin onShowToast={showToast} onAuthChange={setIsAdminLoggedIn} onNavigate={handleNavigate} />
        )}
      </main>

      {/* Global Modals & Notifications */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
      />
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Global Footer */}
      <Footer healthInfo={health} />
    </div>
  );
}
