import { ShieldCheck, MapPin, Clock, Fingerprint } from 'lucide-react';
import { EvidencePackage } from '../engine/types';

interface EvidenceCardProps {
  evidence: EvidencePackage;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-inner">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
        <div className="flex items-center space-x-2 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="font-semibold text-sm uppercase tracking-wider">Court-Admissible Evidence Seal</h3>
        </div>
        <span className="text-xs font-medium bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 flex-shrink-0">
          Sec 65B
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-900 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Fingerprint className="w-3 h-3 text-slate-400" />
              <p className="text-xs text-slate-400">
                {evidence.photoHashes && evidence.photoHashes.length > 1 
                  ? `SHA-256 Merkle Root (${evidence.photoHashes.length} Angles Sealed)` 
                  : 'SHA-256 Digital Hash'}
              </p>
            </div>
            {evidence.photoHashes && evidence.photoHashes.length > 1 && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                Multi-Angle Chain
              </span>
            )}
          </div>
          <p className="font-mono-evidence text-xs text-emerald-300 break-all select-all">
            {evidence.photoHash}
          </p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 space-y-2">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <p className="text-xs text-slate-400">GPS Telemetry</p>
            </div>
            <p className="text-sm text-slate-200 font-mono-evidence">{evidence.locationString}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Auditing Officer</p>
            <p className="text-sm text-slate-200">{evidence.officerId}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-500" />
          <p className="text-xs text-slate-500 font-mono-evidence">
            {new Date(evidence.timestamp).toLocaleString('en-IN')}
          </p>
        </div>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest">
          Tamper-Evident Forensic Dossier
        </p>
      </div>
    </div>
  );
};
