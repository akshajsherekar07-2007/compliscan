import { ScanRecord } from '../engine/types';

interface ScanListItemProps {
  scan: ScanRecord;
  onClick: (scan: ScanRecord) => void;
}

export const ScanListItem: React.FC<ScanListItemProps> = ({ scan, onClick }) => {
  const status = scan.complianceResult.status;

  const getVerdictStyles = () => {
    switch (status) {
      case 'COMPLIANT':
        return { border: 'border-emerald-500', badgeBg: 'bg-emerald-500/20', badgeText: 'text-emerald-400' };
      case 'PARTIAL':
        return { border: 'border-amber-500', badgeBg: 'bg-amber-500/20', badgeText: 'text-amber-400' };
      case 'NON_COMPLIANT':
      default:
        return { border: 'border-rose-500', badgeBg: 'bg-rose-500/20', badgeText: 'text-rose-400' };
    }
  };

  const styles = getVerdictStyles();
  const displayName = scan.barcodeValue || scan.extractedFields.manufacturerName?.value || 'Unknown Product';

  return (
    <button
      onClick={() => onClick(scan)}
      className={`w-full text-left bg-slate-900 border-l-4 ${styles.border} border-y border-r border-y-slate-800 border-r-slate-800 rounded-lg p-4 mb-1 hover:bg-slate-800/80 transition-colors flex items-center justify-between shadow-sm`}
    >
      <div className="flex flex-col">
        <span className="font-semibold text-slate-100 text-sm">{displayName}</span>
        <span className="text-xs text-slate-400 mt-1">
          {new Date(scan.createdAt).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${styles.badgeBg} ${styles.badgeText}`}>
        {scan.complianceResult.score}/10
      </div>
    </button>
  );
};
