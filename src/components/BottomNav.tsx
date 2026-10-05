import React from 'react';
import { ScanLine, History, Settings } from 'lucide-react';

export type TabType = 'scanner' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'scanner' as const, label: 'Scanner', Icon: ScanLine },
    { id: 'history' as const, label: 'History', Icon: History },
    { id: 'settings' as const, label: 'Settings', Icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 hover:bg-slate-800/50 transition-colors"
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
