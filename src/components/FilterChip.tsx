import React from 'react';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        isSelected
          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
};
