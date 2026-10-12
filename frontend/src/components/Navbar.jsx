import React, { useState } from 'react';
import { 
  Trophy, 
  LayoutDashboard, 
  Shield, 
  Users, 
  Calendar, 
  BarChart3, 
  GitCompare, 
  Lock, 
  Search, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Activity
} from 'lucide-react';

export default function Navbar({ activePage, onNavigate, onOpenSearch, theme, onToggleTheme, isAdminLoggedIn }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'teams', label: 'Teams', icon: Shield },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'matches', label: 'Matches', icon: Calendar },
    { id: 'leaderboards', label: 'Leaderboards', icon: BarChart3 },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'admin', label: 'Admin Portal', icon: Lock, highlight: true },
  ];

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white shrink-0">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white flex items-center">
                  Cricket<span className="text-orange-500">Verse</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">
                  IPL 2026
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block -mt-0.5 tracking-wide">
                Analytics & Statistics Engine
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id || (activePage === 'player-detail' && item.id === 'players');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm shadow-orange-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.id === 'admin' && isAdminLoggedIn && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Authenticated" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Tools (Search, Theme, Mobile toggle) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-orange-500/50 text-slate-400 hover:text-slate-200 text-xs sm:text-sm transition group"
              title="Search (Ctrl + K)"
            >
              <Search className="w-4 h-4 text-orange-400 group-hover:scale-110 transition" />
              <span className="hidden md:inline">Quick Search...</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] text-slate-400 bg-slate-800 rounded border border-slate-700">⌘K</kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-slate-700 transition"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-fade-in">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-orange-400" />
                  <span>{item.label}</span>
                </div>
                {item.id === 'admin' && isAdminLoggedIn && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Logged in
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
