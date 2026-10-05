import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

export type VerdictStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';

interface ScoreHeroProps {
  score: number;
  totalChecks?: number;
  status: VerdictStatus;
  ruleSetVersion?: string;
}

export const ScoreHero: React.FC<ScoreHeroProps> = ({ 
  score, 
  totalChecks = 10, 
  status,
  ruleSetVersion
}) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 600;
    const incrementTime = 30;
    const totalSteps = Math.ceil(duration / incrementTime);
    const stepValue = score / totalSteps;

    if (score === 0) {
      setDisplayScore(0);
      return;
    }

    const timer = setInterval(() => {
      start += stepValue;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [score]);

  const getStyles = () => {
    switch (status) {
      case 'COMPLIANT':
        return {
          border: 'border-emerald-500',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          label: 'STATUTORILY COMPLIANT',
          Icon: ShieldCheck,
        };
      case 'PARTIAL':
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          label: 'PARTIAL COMPLIANCE',
          Icon: AlertTriangle,
        };
      case 'NON_COMPLIANT':
      default:
        return {
          border: 'border-rose-500',
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          label: 'NON-COMPLIANT',
          Icon: XCircle,
        };
    }
  };

  const styles = getStyles();
  const { Icon } = styles;

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-xl border-l-4 ${styles.border} ${styles.bg} shadow-lg shadow-black/20`}>
      <div className="flex items-center space-x-3 mb-1">
        <Icon className={`w-8 h-8 ${styles.text}`} />
        <span className={`text-xl font-bold tracking-wider ${styles.text}`}>{styles.label}</span>
      </div>

      <div className="text-6xl font-black text-slate-100 my-3 tracking-tighter">
        {displayScore}<span className="text-3xl text-slate-400 font-medium">/{totalChecks}</span>
      </div>

      <div className="text-slate-400 text-sm font-medium text-center">
        {score} of {totalChecks} applicable statutory declarations verified
      </div>

      {ruleSetVersion && (
        <div className="mt-2 text-[11px] font-mono text-slate-500 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800">
          {ruleSetVersion}
        </div>
      )}
    </div>
  );
};
