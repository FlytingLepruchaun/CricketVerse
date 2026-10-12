import React from 'react';

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 bg-slate-800/40 rounded-2xl border border-slate-700/30 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-slate-700/50 rounded" />
            <div className="h-8 w-8 bg-slate-700/50 rounded-xl" />
          </div>
          <div className="h-7 w-16 bg-slate-700/70 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="w-full bg-slate-900/40 rounded-2xl border border-slate-800/60 p-4 animate-pulse">
      <div className="h-10 bg-slate-800/60 rounded-xl mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-7 bg-slate-800/40 rounded flex-1"
                style={{ opacity: 1 - (c * 0.1) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-44 bg-slate-800/50 rounded-3xl border border-slate-700/40 p-8 flex items-center gap-6">
        <div className="w-24 h-24 bg-slate-700 rounded-2xl" />
        <div className="space-y-3">
          <div className="h-8 w-60 bg-slate-700 rounded-lg" />
          <div className="h-4 w-32 bg-slate-700/60 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-800/40 rounded-2xl border border-slate-700/30" />
        ))}
      </div>
    </div>
  );
}
