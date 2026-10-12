import React from 'react';
import { Database, ShieldCheck, Activity, Terminal } from 'lucide-react';

export default function Footer({ healthInfo }) {
  const isHealthy = healthInfo?.database?.status === 'healthy';

  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/70 text-slate-400 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shrink-0">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-200">
                CricketVerse Analytics
              </div>
              <div className="text-xs text-slate-500">
                IPL Statistics Platform • Python Flask & MySQL Integration
              </div>
            </div>
          </div>

          {/* Database & System Live Status Pill */}
          <div className="flex items-center gap-4 text-xs">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              isHealthy 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <Database className="w-3.5 h-3.5" />
              <span>
                {isHealthy 
                  ? `MySQL Connected (${healthInfo?.database?.database || 'CricketVerse'})` 
                  : 'Database Reconnecting...'}
              </span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1.5 text-slate-500">
              <Terminal className="w-3.5 h-3.5" />
              <span>v1.0.0 Stable</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            Built with Python Flask, MySQL 8.0, React, Vite & Tailwind CSS.
          </div>
          <div>
            All stats calculated dynamically via SQL joins and aggregates.
          </div>
        </div>
      </div>
    </footer>
  );
}
