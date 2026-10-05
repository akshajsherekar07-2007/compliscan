import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

interface SplashScreenProps {
  onReady: () => void;
}

export function SplashScreen({ onReady }: SplashScreenProps) {
  const [statusText, setStatusText] = useState('Initializing Edge-AI Engine...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStatusText('Pre-warming WebAssembly OCR & GS1 Calibrator...');
    }, 600);

    const timer2 = setTimeout(() => {
      setStatusText('System Ready — 100% On-Device');
    }, 1200);

    const timer3 = setTimeout(() => {
      onReady();
    }, 1600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onReady]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-8 select-none">
      {/* Top Ministry Badge */}
      <div className="flex items-center gap-2 pt-6 opacity-80">
        <ShieldCheck className="w-5 h-5 text-indigo-400" />
        <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">
          Department of Consumer Affairs (DoCA)
        </span>
      </div>

      {/* Center Brand Hero */}
      <div className="flex flex-col items-center text-center -mt-12">
        <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
          {/* Animated Glow Halo */}
          <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl animate-pulse"></div>

          {/* App Icon Container */}
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl flex items-center justify-center p-3">
            <img src="/icon.svg" alt="CompliScan Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Compli<span className="text-indigo-400">Scan</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
          Statutory Packaging Compliance & Optical Caliper
        </p>

        <div className="mt-8 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner">
          <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          <span className="text-xs text-slate-300 font-medium">{statusText}</span>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="flex flex-col items-center text-center pb-4 text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-400">CraftVerse 2.0 • Team &lt;AI-lite&gt;Outlaw</p>
        <p className="text-[11px]">Rule 6 & 7 Legal Metrology (Packaged Commodities) Rules, 2011</p>
      </div>
    </div>
  );
}
