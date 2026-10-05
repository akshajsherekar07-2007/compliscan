import React from 'react';

export const ConnectivityBadge: React.FC = () => {
  return (
    <div className="inline-flex items-center space-x-1.5 bg-slate-800/80 backdrop-blur border border-slate-700 px-2.5 py-1 rounded-full shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
        100% On-Device / Offline
      </span>
    </div>
  );
};
