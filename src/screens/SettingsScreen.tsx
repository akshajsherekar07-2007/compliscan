import { useState, useEffect } from 'react';
import { Trash2, Info, Scale, Cpu, ShieldCheck, Database, ChevronDown, ChevronUp, Cloud, Lock, Download } from 'lucide-react';
import { loadScanHistory } from '../data/storage';

interface SettingsScreenProps {
  onClearHistory: () => void;
}

export default function SettingsScreen({ onClearHistory }: SettingsScreenProps) {
  const [legalExpanded, setLegalExpanded] = useState(false);
  const [engineExpanded, setEngineExpanded] = useState(false);
  const [storedScansCount, setStoredScansCount] = useState(0);

  useEffect(() => {
    const history = loadScanHistory();
    setStoredScansCount(history.length);
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all scan records and evidence packages from this device?')) {
      onClearHistory();
      setStoredScansCount(0);
    }
  };

  const handleExportArchive = () => {
    const history = loadScanHistory();
    if (history.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `compliscan_evidence_vault_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 pb-20 select-none">
      <header className="p-4 bg-slate-900 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">System Settings & Legal Index</h1>
        <p className="text-xs text-slate-400 mt-0.5">CompliScan Mobile Inspector Terminal</p>
      </header>

      <main className="flex-1 p-4 space-y-5">
        {/* Local Device Storage */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            Device Storage & Evidence Vault
          </h2>
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
            <div className="p-3.5 flex justify-between items-center text-sm">
              <span className="text-slate-300">Locally Stored Scan Records</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 text-xs font-mono font-bold">
                {storedScansCount} scans
              </span>
            </div>

            <button 
              onClick={handleExportArchive}
              disabled={storedScansCount === 0}
              className={`w-full flex items-center justify-between p-3.5 text-sm font-medium transition-colors ${
                storedScansCount > 0 
                  ? 'text-indigo-400 hover:bg-indigo-950/20 active:bg-indigo-950/40' 
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>Export Evidence Archive (JSON)</span>
              <Download className="w-4 h-4" />
            </button>

            <button 
              onClick={handleClearHistory}
              disabled={storedScansCount === 0}
              className={`w-full flex items-center justify-between p-3.5 text-sm font-medium transition-colors ${
                storedScansCount > 0 
                  ? 'text-rose-400 hover:bg-rose-950/20 active:bg-rose-950/40' 
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>Clear Evidence Vault & History</span>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Legal Metrology Statutory References */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            Statutory Regulatory Framework
          </h2>
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <button 
              onClick={() => setLegalExpanded(!legalExpanded)}
              className="w-full p-4 flex justify-between items-center text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-slate-200 text-sm font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
              </div>
              {legalExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {legalExpanded && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 space-y-3 leading-relaxed">
                <div>
                  <strong className="text-slate-200 block mb-1">Rule 6 — 10 Mandatory Declarations:</strong>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li>6(1)(a): Manufacturer/Packer name and complete address</li>
                    <li>6(1)(b): Generic or common name of the commodity</li>
                    <li>6(1)(c): Net quantity in metric units of mass or measure</li>
                    <li>6(1)(d): Month & year of manufacture or pre-packaging</li>
                    <li>6(1)(da): Best before or expiry date declaration</li>
                    <li>6(1)(e): Maximum Retail Price (MRP) inclusive of all taxes</li>
                    <li>6(11): Unit Sale Price (USP) mandatory declaration</li>
                    <li>6(1)(n): Consumer care grievance details (phone & email)</li>
                    <li>6(1)(aa): Country of origin for imported goods</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-900">
                  <strong className="text-slate-200 block mb-1">Rule 7 — Table I Font Height Thresholds:</strong>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">≤ 200g / ml: ≥ 1.0 mm</div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">200g - 500g: ≥ 2.0 mm</div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 col-span-2">&gt; 500g / ml: ≥ 4.0 mm</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900">
                  <strong className="text-slate-200 block mb-1">Section 65B Evidence Act Admissibility:</strong>
                  <p>Every scan produces a cryptographic SHA-256 digest of original raw pixels, paired with tamper-evident GPS coordinates and UTC timestamp.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Engine Specs */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Edge-AI Engine Specifications
          </h2>
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <button 
              onClick={() => setEngineExpanded(!engineExpanded)}
              className="w-full p-4 flex justify-between items-center text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-slate-200 text-sm font-medium">
                <Info className="w-4 h-4 text-indigo-400" />
                <span>On-Device Edge Pipeline & Zero-Cost Architecture</span>
              </div>
              {engineExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {engineExpanded && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-300">OCR Engine</span>
                  <span className="text-emerald-400 font-mono">Tesseract.js v7 (WASM)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-300">Barcode Decoder</span>
                  <span className="text-emerald-400 font-mono">ZXing / html5-qrcode (EAN-13)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-300">Metric Caliper</span>
                  <span className="text-indigo-400 font-mono">GS1 Nominal 37.29mm Ratio</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-300">Cloud Infrastructure Cost</span>
                  <span className="text-emerald-400 font-bold">₹0.00 / scan (100% Offline)</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* About Team */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">About & Hackathon Info</h2>
          <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800 text-xs">
            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-300">Event</span>
              <span className="text-slate-200 font-medium">CraftVerse 2.0 • PCCOER Ravet</span>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-300">Problem Statement</span>
              <span className="text-indigo-400 font-mono font-medium">SIH26034 (DoCA)</span>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-300">Team</span>
              <span className="text-emerald-400 font-medium">&lt;AI-lite&gt;Outlaw • ID: 09B345</span>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-300">Version</span>
              <span className="text-slate-400 font-mono">CompliScan v1.0.0 (Production)</span>
            </div>
          </div>
        </section>

        {/* Phase 2 Cloud Sync */}
        <section className="opacity-50">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Phase 2 Features (Cloud Sync)</h2>
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3.5 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Cloud className="w-4 h-4" />
              <span>Ministry Central Database Sync</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium">Coming Soon</span>
          </div>
        </section>
      </main>
    </div>
  );
}
