import { useState } from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { ScanListItem } from '../components/ScanListItem';
import { FilterChip } from '../components/FilterChip';
import { ScanRecord } from '../engine/types';

interface HistoryScreenProps {
  scanHistory: ScanRecord[];
  onSelectScan: (scan: ScanRecord) => void;
}

export default function HistoryScreen({ scanHistory, onSelectScan }: HistoryScreenProps) {
  const [filter, setFilter] = useState<'All' | 'Compliant' | 'Non-Compliant' | 'Partial'>('All');

  const filteredHistory = scanHistory.filter(scan => {
    if (filter === 'All') return true;
    if (filter === 'Compliant') return scan.complianceResult.status === 'COMPLIANT';
    if (filter === 'Non-Compliant') return scan.complianceResult.status === 'NON_COMPLIANT';
    if (filter === 'Partial') return scan.complianceResult.status === 'PARTIAL';
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white">Scan History</h1>
        <div className="flex overflow-x-auto gap-2 mt-4 pb-2 hide-scrollbar">
          {['All', 'Compliant', 'Non-Compliant', 'Partial'].map((f) => (
            <FilterChip 
              key={f}
              label={f}
              isSelected={filter === f}
              onClick={() => setFilter(f as any)}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 p-4 space-y-3">
        {filteredHistory.length > 0 ? (
          filteredHistory.map(scan => (
            <ScanListItem key={scan.id} scan={scan} onClick={() => onSelectScan(scan)} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <HistoryIcon className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-300 font-medium text-lg mb-1">No scans found</p>
            <p className="text-slate-500 text-sm">Try adjusting your filters or scanning a new product.</p>
          </div>
        )}
      </main>
    </div>
  );
}
