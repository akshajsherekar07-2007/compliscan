import { Camera, ShieldCheck, Upload, Layers } from 'lucide-react';
import { ScanListItem } from '../components/ScanListItem';
import { ConnectivityBadge } from '../components/ConnectivityBadge';
import { ScanRecord } from '../engine/types';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  scanHistory: ScanRecord[];
  onSelectScan?: (scan: ScanRecord) => void;
}

export default function HomeScreen({ onNavigate, scanHistory, onSelectScan }: HomeScreenProps) {
  const totalScans = scanHistory.length;
  const passed = scanHistory.filter(s => s.complianceResult.status === 'COMPLIANT').length;
  const failed = scanHistory.filter(s => s.complianceResult.status === 'NON_COMPLIANT').length;
  
  const recentScans = scanHistory.slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-indigo-400">CompliScan</h1>
        <ConnectivityBadge />
      </header>

      <main className="flex-1 p-4 space-y-6">
        <div className="space-y-3">
          <div 
            onClick={() => onNavigate('camera')}
            className="bg-gradient-to-br from-indigo-900/60 to-slate-900 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer border border-indigo-500/40 shadow-lg shadow-indigo-900/25 active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Camera className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1 tracking-wide">SCAN PRODUCT</h2>
            <p className="text-xs text-slate-300 text-center max-w-xs mb-3">
              Point camera at any packaged commodity (Food or Non-Food)
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                10-Point Legal Metrology
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Layers className="w-2.5 h-2.5" />
                Curved Dewarping
              </span>
            </div>
          </div>

          {/* Quick Multi-Side Upload CTA */}
          <div 
            onClick={() => onNavigate('camera')}
            className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Upload className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200">Upload Multi-Side Photos</span>
                <span className="text-[10px] text-slate-400">Front + Back photos fused with zero error</span>
              </div>
            </div>
            <span className="text-xs font-medium text-cyan-400 flex items-center gap-1">
              Select &rarr;
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex flex-col items-center">
            <span className="text-2xl font-bold text-indigo-400">{totalScans}</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex flex-col items-center">
            <span className="text-2xl font-bold text-emerald-400">{passed}</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Passed</span>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex flex-col items-center">
            <span className="text-2xl font-bold text-rose-400">{failed}</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Failed</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Scans</h3>
            <button onClick={() => onNavigate('history')} className="text-indigo-400 text-sm hover:text-indigo-300">
              See All &rarr;
            </button>
          </div>
          
          <div className="space-y-3">
            {recentScans.length > 0 ? (
              recentScans.map(scan => (
                <ScanListItem 
                  key={scan.id} 
                  scan={scan} 
                  onClick={() => onSelectScan ? onSelectScan(scan) : onNavigate('history')} 
                />
              ))
            ) : (
              <div className="bg-slate-900 rounded-lg p-8 border border-slate-800 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-300 font-medium mb-1">No scans yet</p>
                <p className="text-slate-500 text-sm">Tap Scan Product to check your first label</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
