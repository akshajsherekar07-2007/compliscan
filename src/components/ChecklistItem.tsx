import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, Zap, MinusCircle, Info, AlertTriangle } from 'lucide-react';
import { CheckStatus } from '../engine/types';

export interface ChecklistItemProps {
  id: string;
  field: string;
  ruleReference: string;
  status: CheckStatus;
  severity?: 'CRITICAL' | 'MAJOR' | 'MINOR';
  extractedValue?: string | null;
  confidence?: number;
  details?: string;
  isCoreInnovation?: boolean;
  innovationBadge?: string;
  amendmentRef?: string;
  index?: number;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  field,
  ruleReference,
  status,
  extractedValue,
  confidence,
  details,
  isCoreInnovation,
  innovationBadge,
  amendmentRef,
  index = 0,
}) => {
  const getStatusDetails = () => {
    switch (status) {
      case 'PASS':
        return { 
          Icon: CheckCircle2, 
          iconColor: 'text-emerald-400', 
          pillBg: 'bg-emerald-500/20 border border-emerald-500/30', 
          pillText: 'text-emerald-300',
          label: 'PASS' 
        };
      case 'FAIL':
        return { 
          Icon: XCircle, 
          iconColor: 'text-rose-400', 
          pillBg: 'bg-rose-500/20 border border-rose-500/30', 
          pillText: 'text-rose-300',
          label: 'FAIL' 
        };
      case 'NOT_APPLICABLE':
        return { 
          Icon: MinusCircle, 
          iconColor: 'text-slate-400', 
          pillBg: 'bg-slate-800 border border-slate-700', 
          pillText: 'text-slate-300',
          label: 'NOT APPLICABLE' 
        };
      case 'INFORMATIONAL':
        return { 
          Icon: Info, 
          iconColor: 'text-sky-400', 
          pillBg: 'bg-sky-500/20 border border-sky-500/30', 
          pillText: 'text-sky-300',
          label: 'INFORMATIONAL' 
        };
      case 'WARNING':
        return { 
          Icon: AlertTriangle, 
          iconColor: 'text-amber-400', 
          pillBg: 'bg-amber-500/20 border border-amber-500/30', 
          pillText: 'text-amber-300',
          label: 'WARNING' 
        };
      case 'SKIPPED':
      default:
        return { 
          Icon: HelpCircle, 
          iconColor: 'text-amber-400', 
          pillBg: 'bg-amber-500/20 border border-amber-500/30', 
          pillText: 'text-amber-300',
          label: 'SKIPPED' 
        };
    }
  };

  const { Icon, iconColor, pillBg, pillText, label } = getStatusDetails();

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className="mt-0.5 sm:mt-1 flex-shrink-0">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-slate-100 text-sm sm:text-base">{field}</span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60">
              {ruleReference}
            </span>
            {amendmentRef && (
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                {amendmentRef}
              </span>
            )}
            {isCoreInnovation && (
              <span className="inline-flex items-center space-x-1 bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30">
                <Zap className="w-3 h-3" />
                <span>{innovationBadge || 'Core Innovation'}</span>
              </span>
            )}
          </div>

          {/* Extracted Evidence vs Status Explanation */}
          <div className="mt-1 text-xs sm:text-sm text-slate-300">
            {extractedValue ? (
              <span className="font-mono text-slate-200 bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800 inline-block break-all max-w-full">
                {extractedValue}
              </span>
            ) : (
              <span className={status === 'NOT_APPLICABLE' ? 'text-slate-400 italic' : 'text-rose-400 italic'}>
                {status === 'NOT_APPLICABLE' ? 'Exempt under statute' : 'Not detected on packaging'}
              </span>
            )}

            {/* OCR Confidence badge */}
            {confidence !== undefined && (
              <span className={`ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded ${confidence >= 0.75 ? 'text-emerald-400 bg-emerald-950/40' : 'text-amber-400 bg-amber-950/50 border border-amber-800/50'}`}>
                {confidence < 0.70 ? '⚠️ ' : ''}OCR Grounding: {Math.round(confidence * 100)}%
              </span>
            )}
          </div>

          {/* Legal Rationale / Details */}
          {details && (
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              {details}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0 self-start sm:self-center">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${pillBg} ${pillText}`}>
          {label}
        </span>
      </div>
    </div>
  );
};
