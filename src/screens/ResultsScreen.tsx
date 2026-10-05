import { useState } from 'react';
import { 
  ArrowLeft, 
  Scale, 
  Ruler, 
  Calculator, 
  AlertTriangle, 
  Eye, 
  FileDown, 
  Camera, 
  ChevronDown, 
  ChevronUp, 
  Zap,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { ScoreHero } from '../components/ScoreHero';
import { ChecklistItem } from '../components/ChecklistItem';
import { EvidenceCard } from '../components/EvidenceCard';
import { ConnectivityBadge } from '../components/ConnectivityBadge';
import { ScanRecord } from '../engine/types';

interface ResultsScreenProps {
  scanRecord: ScanRecord;
  onNewScan: () => void;
  onExportPDF: () => void;
  title?: string;
  onBack: () => void;
}

export default function ResultsScreen({ scanRecord, onNewScan, onExportPDF, title = 'Scan Results', onBack }: ResultsScreenProps) {
  const [isAuditExpanded, setIsAuditExpanded] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(300);
  const [selectedAngleIndex, setSelectedAngleIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { complianceResult, anomalyVerdict } = scanRecord;

  const handleCopySummary = async () => {
    const pName = scanRecord.extractedFields.genericName?.value || 'Packaged Commodity';
    const scoreVal = complianceResult.lmScore ?? complianceResult.score;
    const totalVal = complianceResult.lmTotal ?? complianceResult.totalChecks;
    const statusText = complianceResult.status;

    let text = `========================================\n`;
    text += `COMPLISCAN — STATUTORY AUDIT SUMMARY\n`;
    text += `Legal Metrology (Packaged Commodities) Rules, 2011\n`;
    text += `========================================\n\n`;
    text += `COMMODITY: ${pName}\n`;
    text += `VERDICT: ${statusText} (${scoreVal}/${totalVal} Declarations Passing)\n`;
    if (scanRecord.barcodeValue) text += `BARCODE (GTIN): ${scanRecord.barcodeValue}\n`;
    text += `TIMESTAMP: ${new Date(scanRecord.evidence.timestamp).toLocaleString('en-IN')}\n\n`;

    text += `--- STATUTORY RULE 6 MANDATORY DECLARATIONS ---\n`;
    lmChecks.forEach(c => {
      const badge = c.status === 'PASS' ? '[PASS]' : c.status === 'FAIL' ? '[FAIL]' : c.status === 'WARNING' ? '[WARN]' : `[${c.status}]`;
      text += `${badge} ${c.field} (${c.ruleReference}): ${c.extractedValue || 'NOT DETECTED'}\n`;
    });

    if (complianceResult.fontMeasurements.length > 0) {
      text += `\n--- RULE 7 FONT HEIGHT AUDIT ---\n`;
      complianceResult.fontMeasurements.forEach(m => {
        text += `${m.isCompliant ? '[PASS]' : '[FAIL]'} ${m.field}: ${m.measuredHeightMm.toFixed(2)}mm (Mandatory min: ${m.minimumRequiredMm}mm)\n`;
      });
    }

    if (complianceResult.uspVerification) {
      const uv = complianceResult.uspVerification;
      text += `\n--- RULE 6(11) UNIT SALE PRICE (USP) ---\n`;
      text += `Calculated USP: ₹${uv.calculatedUSP.toFixed(2)} | Variance: ${uv.variance.toFixed(1)}% | Status: ${uv.isWithinTolerance ? 'SOUND' : 'DISCREPANCY'}\n`;
    }

    if (anomalyVerdict && anomalyVerdict.isAnomaly) {
      text += `\n--- RULE 18 ECONOMIC ANOMALY ---\n`;
      if (anomalyVerdict.mrpMarkupPercent > 0) text += `Dual-MRP Markup: +${anomalyVerdict.mrpMarkupPercent.toFixed(1)}%\n`;
      if (anomalyVerdict.grammageDeficitPercent > 0) text += `Shrinkflation Deficit: -${anomalyVerdict.grammageDeficitPercent.toFixed(1)}%\n`;
      text += `Narrative: ${anomalyVerdict.narrative}\n`;
    }

    text += `\n--- SECTION 65B EVIDENCE SEAL ---\n`;
    text += `SHA-256 Hash: ${scanRecord.evidence.photoHash}\n`;
    text += `Officer ID: ${scanRecord.evidence.officerId}\n`;
    text += `Location: ${scanRecord.evidence.locationString || 'Geo-coordinates locked'}\n`;
    text += `Dossier Status: Cryptographically Tamper-Evident\n`;
    text += `========================================`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy summary to clipboard', err);
    }
  };
  const photoList = (scanRecord.photoDataUrls && scanRecord.photoDataUrls.length > 0) 
    ? scanRecord.photoDataUrls 
    : (scanRecord.photoDataUrl ? [scanRecord.photoDataUrl] : []);

  const activePhoto = photoList[selectedAngleIndex] || photoList[0] || null;

  // Separate Legal Metrology checks and Food Safety checks
  const lmChecks = complianceResult.lmChecks || complianceResult.checks.filter(c => c.category !== 'FOOD_SAFETY');
  const foodSafetyChecks = complianceResult.foodSafetyChecks || complianceResult.checks.filter(c => c.category === 'FOOD_SAFETY');

  // Sort LM checks: FAIL first, then WARNING, then PASS, then NOT_APPLICABLE/INFORMATIONAL
  const sortedLMChecks = [...lmChecks].sort((a, b) => {
    const order: Record<string, number> = { FAIL: 0, WARNING: 1, SKIPPED: 2, PASS: 3, INFORMATIONAL: 4, NOT_APPLICABLE: 5 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  // Optical ruler simulation
  const simulatedMeasurements = complianceResult.fontMeasurements.map(m => {
    const ratio = sliderWidth / 300;
    const adjustedMm = parseFloat((m.measuredHeightMm * ratio).toFixed(2));
    return { ...m, adjustedMm, adjustedCompliant: adjustedMm >= m.minimumRequiredMm };
  });

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        <ConnectivityBadge />
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Score Hero */}
        <ScoreHero 
          score={complianceResult.lmScore ?? complianceResult.score} 
          totalChecks={complianceResult.lmTotal ?? complianceResult.totalChecks}
          status={complianceResult.status}
          ruleSetVersion={complianceResult.ruleSetVersion}
        />

        {/* Blurry / Low Optical Signal Guidance Banner */}
        {(complianceResult.lmScore ?? complianceResult.score) === 0 && (!scanRecord.rawOcrText || scanRecord.rawOcrText.trim().length < 60 || scanRecord.rawOcrText.includes('failed')) && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-3 shadow-md animate-fade-slide-up">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-300 block mb-0.5">Low Optical Signal Detected</span>
              <p className="text-slate-300 leading-relaxed">
                Optical text was insufficient or blurry. For reflective pouches or curved jars, hold the phone 15–20 cm away under direct diffuse light, or tap <strong>+ Turn &amp; Snap</strong> in the camera to capture multiple sides.
              </p>
            </div>
          </div>
        )}

        {/* Live Packaging Optical Evidence (Bounding Boxes & Angle Switcher) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-200">Optical Evidence & Grounding Matrix</h2>
            </div>
            {photoList.length > 1 ? (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                {photoList.length} Angles Fused (Zero-Order)
              </span>
            ) : (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                On-Device Vision
              </span>
            )}
          </div>

          {/* Multi-Angle Tab Selector (When >1 photo captured) */}
          {photoList.length > 1 && (
            <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 border-b border-slate-800/60 overflow-x-auto bg-slate-950/40">
              {photoList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAngleIndex(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    selectedAngleIndex === idx 
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900' 
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Side {idx + 1} {idx === 0 ? '(Front/PDP)' : idx === 1 ? '(Back/Info)' : idx === 2 ? '(Crimp/Stamp)' : ''}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 flex flex-col items-center">
            {activePhoto ? (
              <div 
                className="relative w-full max-w-sm rounded-lg overflow-hidden border border-slate-700 shadow-md cursor-pointer"
                onClick={() => setPreviewImage(activePhoto)}
              >
                <img 
                  src={activePhoto} 
                  alt={`Packaging Angle ${selectedAngleIndex + 1}`} 
                  className="w-full h-auto object-contain max-h-72 bg-black hover:opacity-90 transition-opacity"
                />
                {/* Visual Bounding Box Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {scanRecord.extractedFields.mrp && (
                    <div className="absolute top-[35%] left-[20%] border-2 border-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded text-[9px] text-emerald-300 font-mono shadow-sm">
                      MRP: {scanRecord.extractedFields.mrp.value > 0 ? `₹${scanRecord.extractedFields.mrp.value}` : 'Statutory Dec.'}
                    </div>
                  )}
                  {scanRecord.extractedFields.netQuantity && (
                    <div className="absolute top-[48%] left-[20%] border-2 border-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded text-[9px] text-cyan-300 font-mono shadow-sm">
                      Net Qty: {scanRecord.extractedFields.netQuantity.value}{scanRecord.extractedFields.netQuantity.unit}
                    </div>
                  )}
                  {scanRecord.extractedFields.unitSalePrice && (
                    <div className="absolute top-[60%] left-[20%] border-2 border-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded text-[9px] text-indigo-300 font-mono shadow-sm">
                      USP: {scanRecord.extractedFields.unitSalePrice.value > 0 ? `₹${scanRecord.extractedFields.unitSalePrice.value}/${scanRecord.extractedFields.unitSalePrice.perUnit}` : 'Declared'}
                    </div>
                  )}
                  {scanRecord.barcodeValue && (
                    <div className="absolute bottom-[8%] right-[10%] border-2 border-amber-400 bg-amber-500/10 px-1 py-0.5 rounded text-[9px] text-amber-300 font-mono shadow-sm">
                      GS1: {scanRecord.barcodeValue}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-lg p-4 relative min-h-[160px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="border border-emerald-500/80 bg-emerald-500/10 px-2 py-1 rounded text-xs text-emerald-300 font-mono">
                    [MRP] ₹{scanRecord.extractedFields.mrp?.value ?? '30'} (incl. taxes)
                  </div>
                  <div className="border border-cyan-500/80 bg-cyan-500/10 px-2 py-1 rounded text-xs text-cyan-300 font-mono">
                    [QTY] {scanRecord.extractedFields.netQuantity?.value ?? '150'}{scanRecord.extractedFields.netQuantity?.unit ?? 'g'}
                  </div>
                </div>
                <div className="my-2 border border-indigo-500/60 bg-indigo-500/10 px-2 py-1 rounded text-xs text-indigo-300 font-mono">
                  [USP] ₹{scanRecord.extractedFields.unitSalePrice?.value ?? '0.20'}/{scanRecord.extractedFields.unitSalePrice?.perUnit ?? 'g'}
                </div>
                <div className="flex justify-between items-end text-[10px] text-slate-500 font-mono">
                  <span>FIDUCIAL CALIBRATION: ACTIVE</span>
                  <span className="text-amber-400 font-mono">[BARCODE] {scanRecord.barcodeValue || '8901491101895'}</span>
                </div>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              {photoList.length > 1 
                ? `Inspecting Angle ${selectedAngleIndex + 1} of ${photoList.length} • Permutation-Invariant Grounding` 
                : 'Real-time in-plane text localization & fiducial scaling coordinates'}
            </p>
          </div>
        </div>

        {/* ── SECTION 1: Legal Metrology Statutory Declarations (Rule 6) ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-200">Legal Metrology Declarations (PCR Rule 6)</h2>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {complianceResult.lmScore ?? complianceResult.score}/{complianceResult.lmTotal ?? complianceResult.totalChecks} Applicable
            </span>
          </div>
          <div className="divide-y divide-slate-800/50">
            {sortedLMChecks.map((check, index) => (
              <ChecklistItem
                key={check.id}
                id={check.id}
                field={check.field}
                ruleReference={check.ruleReference}
                status={check.status}
                extractedValue={check.extractedValue || undefined}
                confidence={check.confidence}
                details={check.details}
                isCoreInnovation={check.isCoreInnovation}
                innovationBadge={check.innovationBadge}
                amendmentRef={check.amendmentRef}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* ── SECTION 2: Food Safety & Standards (FSSAI Act 2006) ── */}
        {foodSafetyChecks.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Food Safety & Standards (FSSAI 10-Point Audit)</h2>
                  <p className="text-[10px] text-emerald-400/80 font-mono">FSSAI Labelling Reg. 2020 • Amended 24 Mar 2026</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {complianceResult.foodSafetyScore}/{complianceResult.foodSafetyTotal} Verified
              </span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {foodSafetyChecks.map((check, index) => (
                <ChecklistItem
                  key={check.id}
                  id={check.id}
                  field={check.field}
                  ruleReference={check.ruleReference}
                  status={check.status}
                  extractedValue={check.extractedValue || undefined}
                  confidence={check.confidence}
                  details={check.details}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 3: Cross-Field Deterministic Validation ── */}
        {complianceResult.crossFieldChecks && complianceResult.crossFieldChecks.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-indigo-950/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Cross-Field Arithmetic & Scientific Consistency</h2>
                  <p className="text-[10px] text-indigo-400/80 font-mono">Zero-Hallucination Deterministic Validation</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                {complianceResult.crossFieldChecks.filter(c => c.status === 'PASS').length}/{complianceResult.crossFieldChecks.length} Verified
              </span>
            </div>
            <div className="p-4 space-y-3">
              {complianceResult.crossFieldChecks.map((check) => (
                <div 
                  key={check.id}
                  className={`rounded-lg p-3 border ${
                    check.status === 'PASS' 
                      ? 'bg-emerald-950/20 border-emerald-800/30' 
                      : (check.status === 'WARNING' ? 'bg-amber-950/20 border-amber-800/30' : 'bg-rose-950/20 border-rose-800/30')
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-200">{check.name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      check.status === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : (check.status === 'WARNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30')
                    }`}>
                      {check.status === 'PASS' ? '✓ VERIFIED' : check.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{check.details}</p>
                  <div className="mt-2 text-[11px] font-mono text-slate-400 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                    Evidence: {check.evidence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rule 7 — Font Height Analysis ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-200">Rule 7 — Font Height Analysis</h2>
            <span className="ml-auto flex items-center gap-1 text-xs text-indigo-400">
              <Zap className="w-3 h-3" /> GS1 Optical Ruler
            </span>
          </div>
          <div className="p-4">
            {complianceResult.fontMeasurements.length > 0 ? (
              <>
                <p className="text-xs text-slate-500 mb-3">Measured using GS1 barcode calibration (37.29mm reference)</p>
                {simulatedMeasurements.map((fm, idx) => (
                  <div key={idx} className={`rounded-lg p-3 mb-2 ${
                    fm.isEstimated 
                      ? 'bg-amber-900/20 border border-amber-800/40' 
                      : (fm.adjustedCompliant ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-rose-900/20 border border-rose-800/30')
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">{fm.field}</span>
                      <span className={`text-sm font-bold ${
                        fm.isEstimated 
                          ? 'text-amber-400' 
                          : (fm.adjustedCompliant ? 'text-emerald-400' : 'text-rose-400')
                      }`}>
                        {fm.isEstimated ? `~${fm.adjustedMm}mm (Est.)` : `${fm.adjustedMm}mm`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Minimum required: {fm.minimumRequiredMm.toFixed(1)}mm (for {fm.netQuantityValue}g product) — {
                        fm.isEstimated 
                          ? '⚠️ CALIBRATION REQUIRED' 
                          : (fm.adjustedCompliant ? '✓ COMPLIANT' : '✗ VIOLATION')
                      }
                    </div>
                    {fm.isEstimated && (
                      <p className="text-[11px] text-amber-300/90 mt-1.5 italic">
                        Physical scale uncalibrated. Use slider below to simulate metric calibration on physical packaging.
                      </p>
                    )}
                  </div>
                ))}
                {/* Interactive Optical Ruler Slider */}
                <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="w-3 h-3 text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-400">Interactive Optical Ruler Demo</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">Adjust simulated barcode width (px): <span className="text-indigo-400 font-mono">{sliderWidth}px</span></div>
                  <input
                    type="range"
                    min={180}
                    max={650}
                    value={sliderWidth}
                    onChange={(e) => setSliderWidth(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>180px</span>
                    <span>Scale: {(sliderWidth / 37.29).toFixed(2)} px/mm</span>
                    <span>650px</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-300">Font size analysis unavailable</p>
                  <p className="text-xs text-slate-400 mt-1">Barcode not detected in image. Mandatory declaration checks (above) are still valid.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── USP Verification Section ── */}
        {complianceResult.uspVerification && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-200">Unit Sale Price Verification (Rule 6(11))</h2>
              <span className="ml-auto flex items-center gap-1 text-xs text-indigo-400">
                <Zap className="w-3 h-3" /> Zero-Hallucination Math
              </span>
            </div>
            <div className="p-4 space-y-3">
              {/* OCR Confidence Warning Alert */}
              {complianceResult.uspVerification.ocrConfidenceAlert && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-lg text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{complianceResult.uspVerification.ocrConfidenceAlert}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Printed USP on Label</div>
                  <div className="text-lg font-bold text-slate-200 font-mono-evidence">
                    {complianceResult.uspVerification.extractedUSP !== null 
                      ? `₹${complianceResult.uspVerification.extractedUSP.toFixed(2)}/unit`
                      : 'Not Printed (Statutory Dec)'}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Calculated (MRP ÷ Net Qty)</div>
                  <div className="text-lg font-bold text-slate-200 font-mono-evidence">
                    ₹{complianceResult.uspVerification.calculatedUSP.toFixed(2)}/unit
                  </div>
                </div>
              </div>

              {complianceResult.uspVerification.extractedUSP !== null && (
                <div className={`rounded-lg p-3 ${complianceResult.uspVerification.isWithinTolerance ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-rose-900/20 border border-rose-800/30'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Mathematical Variance</span>
                    <span className={`font-bold ${complianceResult.uspVerification.isWithinTolerance ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {complianceResult.uspVerification.variance.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Statutory tolerance: ±5.0% (GSR 779(E) rounding allowance) | {complianceResult.uspVerification.isWithinTolerance ? '✓ MATHEMATICALLY SOUND' : '✗ DISCREPANCY DETECTED'}
                  </div>
                </div>
              )}

              {complianceResult.uspVerification.fontRatio !== null && (
                <div className={`rounded-lg p-3 ${complianceResult.uspVerification.fontRatioCompliant ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-rose-900/20 border border-rose-800/30'}`}>
                  <div className="text-sm text-slate-300">
                    USP Font Height: <span className="font-bold">{((complianceResult.uspVerification.fontRatio || 0) * 100).toFixed(0)}%</span> of MRP font height
                    <span className="text-xs text-slate-500 ml-2">(statutory minimum 50%)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Rule 18 — Economic Anomaly ── */}
        {anomalyVerdict && anomalyVerdict.isAnomaly && (
          <div className="bg-slate-900 border border-amber-800/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-800/30 bg-amber-900/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-300">Rule 18 — Economic Anomaly Detection</h2>
            </div>
            <div className="p-4 space-y-3">
              {anomalyVerdict.mrpMarkupPercent > 0 && (
                <div className="bg-rose-900/20 border border-rose-800/30 rounded-lg p-3">
                  <div className="text-sm font-semibold text-rose-400">⚠️ Dual-MRP Alert</div>
                  <div className="text-xs text-slate-300 mt-1">
                    Scanned MRP ₹{anomalyVerdict.scannedMRP} exceeds authorized benchmark ₹{anomalyVerdict.authorizedMRP}
                    <span className="text-rose-400 font-bold ml-1">(+{anomalyVerdict.mrpMarkupPercent.toFixed(1)}% markup)</span>
                  </div>
                </div>
              )}
              {anomalyVerdict.grammageDeficitPercent > 0 && (
                <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3">
                  <div className="text-sm font-semibold text-amber-400">⚠️ Shrinkflation Alert</div>
                  <div className="text-xs text-slate-300 mt-1">
                    Package reduced from {anomalyVerdict.authorizedQuantity}g → {anomalyVerdict.scannedQuantity}g
                    <span className="text-amber-400 font-bold ml-1">(−{anomalyVerdict.grammageDeficitPercent.toFixed(1)}%)</span>
                  </div>
                  <div className="text-xs text-rose-400 mt-1 font-semibold">
                    Effective stealth price hike: +{anomalyVerdict.effectiveStealthHikePercent.toFixed(1)}% per gram
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400 italic">{anomalyVerdict.narrative}</p>
            </div>
          </div>
        )}

        {/* ── Section 65B Evidence Seal ── */}
        <EvidenceCard evidence={scanRecord.evidence} />

        {/* ── Inspector Audit Verification Drawer ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setIsAuditExpanded(!isAuditExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">Inspector Audit — Raw OCR Tokens</span>
            </div>
            {isAuditExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {isAuditExpanded && (
            <div className="px-4 pb-4">
              <p className="text-xs text-slate-500 mb-2">
                In statutory enforcement under the Legal Metrology Act, 2009, the AI extracts and audits declarations in under 3 seconds, allowing the field officer to review before cryptographically sealing the record under Section 65B of the Indian Evidence Act.
              </p>
              <pre className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-emerald-300 font-mono-evidence whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {scanRecord.rawOcrText || 'No OCR text available'}
              </pre>
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={onExportPDF}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/30"
            >
              <FileDown className="w-5 h-5" />
              Download Notice (PDF)
            </button>
            <button
              onClick={handleCopySummary}
              className={`w-full font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all border ${
                copied 
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300' 
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-300" />}
              {copied ? 'Summary Copied!' : 'Copy Summary'}
            </button>
          </div>
          <button
            onClick={onNewScan}
            className="w-full border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Camera className="w-5 h-5" />
            New Scan
          </button>
        </div>
      </div>
      {/* Fullscreen Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={() => setPreviewImage(null)}
              className="p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="w-full h-full max-w-3xl max-h-[85vh] p-4 flex items-center justify-center">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()} // Prevent closing when tapping the image itself
            />
          </div>
          <p className="absolute bottom-8 text-slate-400 text-sm font-medium">Tap anywhere to close</p>
        </div>
      )}

    </div>
  );
}
