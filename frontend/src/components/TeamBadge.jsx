import React from 'react';

const TEAM_STYLES = {
  CSK: { bg: 'from-amber-400 to-yellow-600', text: 'text-yellow-950', border: 'border-yellow-400/30' },
  MI:  { bg: 'from-sky-500 to-blue-700', text: 'text-white', border: 'border-blue-400/30' },
  RCB: { bg: 'from-red-600 to-red-900', text: 'text-white', border: 'border-red-400/30' },
  KKR: { bg: 'from-purple-600 to-indigo-950', text: 'text-purple-100', border: 'border-purple-400/30' },
  DC:  { bg: 'from-blue-600 to-sky-700', text: 'text-white', border: 'border-sky-400/30' },
  GT:  { bg: 'from-teal-600 to-slate-900', text: 'text-teal-100', border: 'border-teal-400/30' },
  LSG: { bg: 'from-cyan-400 to-blue-600', text: 'text-cyan-950', border: 'border-cyan-400/30' },
  PBKS:{ bg: 'from-rose-500 to-red-700', text: 'text-white', border: 'border-rose-400/30' },
  RR:  { bg: 'from-pink-500 to-rose-700', text: 'text-white', border: 'border-pink-400/30' },
  SRH: { bg: 'from-orange-500 to-amber-700', text: 'text-white', border: 'border-orange-400/30' },
};

export default function TeamBadge({ code, name, size = 'md', showName = false, className = '' }) {
  const style = TEAM_STYLES[code?.toUpperCase()] || {
    bg: 'from-slate-600 to-slate-800',
    text: 'text-slate-100',
    border: 'border-slate-500/30'
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs font-bold',
    md: 'w-9 h-9 text-xs font-bold',
    lg: 'w-12 h-12 text-sm font-extrabold',
    xl: 'w-16 h-16 text-lg font-black',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-xl bg-gradient-to-br ${style.bg} ${style.text} flex items-center justify-center shadow-md border ${style.border} tracking-wider select-none shrink-0`}
        title={name || code}
      >
        {code || 'IPL'}
      </div>
      {showName && (
        <span className="font-semibold text-slate-100 dark:text-slate-100 text-sm truncate">
          {name || code}
        </span>
      )}
    </div>
  );
}
