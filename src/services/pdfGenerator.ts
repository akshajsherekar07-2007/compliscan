import jsPDF from 'jspdf';
import { ScanRecord } from '../engine/types';

export function generateFormA1PDF(scan: ScanRecord): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // === HEADER ===
  doc.setFillColor(26, 35, 126); // primary-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FORM A-1', pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('IMPROVEMENT NOTICE', pageWidth / 2, 21, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Under Rule 24 of the Legal Metrology (Packaged Commodities) Rules, 2011', pageWidth / 2, 27, { align: 'center' });
  doc.text('Read with Section 15 of the Legal Metrology Act, 2009', pageWidth / 2, 32, { align: 'center' });
  doc.text('Amended by Jan Vishwas (Amendment of Provisions) Act, 2023', pageWidth / 2, 37, { align: 'center' });

  y = 48;

  // === INSPECTION DETAILS ===
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INSPECTION DETAILS', margin, y);
  y += 2;
  doc.setDrawColor(26, 35, 126);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const addRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 55, y);
    y += 5;
  };

  addRow('Notice No:', `CS-${scan.id.slice(0, 8).toUpperCase()}`);
  addRow('Date & Time:', new Date(scan.evidence.timestamp).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' }));
  addRow('Inspecting Officer:', scan.evidence.officerId);
  addRow('GPS Location:', scan.evidence.locationString);
  addRow('Barcode (EAN-13):', scan.barcodeValue || 'Not detected');
  addRow('Device:', scan.evidence.deviceInfo.slice(0, 60));

  y += 4;

  // === COMPLIANCE VERDICT ===
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPLIANCE VERDICT', margin, y);
  y += 2;
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // Score box
  const scoreColor = scan.complianceResult.status === 'COMPLIANT'
    ? [46, 125, 50] : scan.complianceResult.status === 'PARTIAL'
    ? [245, 127, 23] : [198, 40, 40];

  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(margin, y, 35, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${scan.complianceResult.score}/10`, margin + 17.5, y + 9, { align: 'center' });

  doc.setTextColor(33, 33, 33);
  doc.setFontSize(12);
  doc.text(scan.complianceResult.status.replace('_', '-'), margin + 42, y + 9);

  y += 20;

  // === RULE 6 CHECKLIST ===
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RULE 6 — MANDATORY DECLARATION CHECKS', margin, y);
  y += 2;
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  doc.setFontSize(8);
  const checks = scan.complianceResult.checks.slice(0, 10);

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('Status', margin + 2, y + 4);
  doc.text('Declaration', margin + 22, y + 4);
  doc.text('Extracted Value', margin + 82, y + 4);
  doc.text('Rule Ref', margin + 148, y + 4);
  y += 7;

  doc.setFont('helvetica', 'normal');
  const lmChecks = scan.complianceResult.lmChecks || scan.complianceResult.checks.filter(c => c.category !== 'FOOD_SAFETY');
  
  lmChecks.forEach((check) => {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }

    const statusText = check.status === 'PASS' ? '[PASS]' : check.status === 'FAIL' ? '[FAIL]' : check.status === 'WARNING' ? '[WARN]' : '[N/A]';
    const statusColor = check.status === 'PASS' ? [46, 125, 50] : check.status === 'FAIL' ? [198, 40, 40] : [245, 127, 23];

    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, margin + 2, y + 3);

    doc.setTextColor(33, 33, 33);
    doc.setFont('helvetica', 'normal');
    doc.text(check.field.slice(0, 32), margin + 22, y + 3);
    doc.text((check.extractedValue || 'Not detected').slice(0, 36), margin + 82, y + 3);
    doc.setTextColor(100, 100, 100);
    doc.text(check.ruleReference, margin + 148, y + 3);

    y += 5.5;
  });

  // Food Safety checks if present
  const foodSafetyChecks = scan.complianceResult.foodSafetyChecks || scan.complianceResult.checks.filter(c => c.category === 'FOOD_SAFETY');
  if (foodSafetyChecks.length > 0) {
    if (y > 240) { doc.addPage(); y = margin; }
    y += 2;
    doc.setTextColor(33, 33, 33);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FSSAI FOOD SAFETY LABELLING AUDIT (REGULATIONS 2020)', margin, y);
    y += 2;
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    doc.setFontSize(8);
    foodSafetyChecks.forEach((check) => {
      if (y > 270) { doc.addPage(); y = margin; }

      const statusText = check.status === 'PASS' ? '[PASS]' : check.status === 'FAIL' ? '[FAIL]' : check.status === 'WARNING' ? '[WARN]' : '[INFO]';
      const statusColor = check.status === 'PASS' ? [46, 125, 50] : check.status === 'FAIL' ? [198, 40, 40] : [245, 127, 23];

      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(statusText, margin + 2, y + 3);

      doc.setTextColor(33, 33, 33);
      doc.setFont('helvetica', 'normal');
      doc.text(check.field.slice(0, 32), margin + 22, y + 3);
      doc.text((check.extractedValue || 'Not detected').slice(0, 36), margin + 82, y + 3);
      doc.setTextColor(100, 100, 100);
      doc.text(check.ruleReference, margin + 148, y + 3);

      y += 5.5;
    });
  }

  y += 4;

  // === FONT MEASUREMENTS ===
  if (scan.complianceResult.fontMeasurements.length > 0) {
    if (y > 250) { doc.addPage(); y = margin; }

    doc.setTextColor(33, 33, 33);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RULE 7 — FONT HEIGHT ANALYSIS (GS1 OPTICAL RULER)', margin, y);
    y += 2;
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    doc.setFontSize(9);
    scan.complianceResult.fontMeasurements.forEach((fm) => {
      doc.setFont('helvetica', 'normal');
      doc.text(`${fm.field}: Measured ${fm.measuredHeightMm.toFixed(2)}mm | Minimum required: ${fm.minimumRequiredMm.toFixed(1)}mm | ${fm.isCompliant ? 'COMPLIANT' : 'VIOLATION'}`, margin, y);
      y += 5;
    });
    y += 4;
  }

  // === USP VERIFICATION ===
  if (scan.complianceResult.uspVerification) {
    if (y > 250) { doc.addPage(); y = margin; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('UNIT SALE PRICE VERIFICATION (RULE 6(11))', margin, y);
    y += 2;
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    const usp = scan.complianceResult.uspVerification;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Extracted USP: ₹${usp.extractedUSP?.toFixed(4) || 'N/A'}/unit`, margin, y); y += 5;
    doc.text(`Calculated USP (MRP ÷ Net Qty): ₹${usp.calculatedUSP.toFixed(4)}/unit`, margin, y); y += 5;
    doc.text(`Variance: ${usp.variance.toFixed(2)}% | Tolerance: ±2.0% | ${usp.isWithinTolerance ? 'WITHIN TOLERANCE' : 'EXCEEDS TOLERANCE — MISMATCH'}`, margin, y); y += 5;
    y += 4;
  }

  // === ANOMALY VERDICT ===
  if (scan.anomalyVerdict?.isAnomaly) {
    if (y > 250) { doc.addPage(); y = margin; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RULE 18 — ECONOMIC ANOMALY DETECTION', margin, y);
    y += 2;
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const av = scan.anomalyVerdict;
    if (av.mrpMarkupPercent > 0) {
      doc.text(`Dual-MRP Alert: Scanned ₹${av.scannedMRP} vs Authorized ₹${av.authorizedMRP} (+${av.mrpMarkupPercent.toFixed(1)}% markup)`, margin, y);
      y += 5;
    }
    if (av.grammageDeficitPercent > 0) {
      doc.text(`Shrinkflation Alert: ${av.authorizedQuantity}g → ${av.scannedQuantity}g (−${av.grammageDeficitPercent.toFixed(1)}% reduction, +${av.effectiveStealthHikePercent.toFixed(1)}% stealth hike)`, margin, y);
      y += 5;
    }
    y += 4;
  }

  // === EVIDENCE SEAL ===
  if (y > 235) { doc.addPage(); y = margin; }

  const isMulti = !!scan.evidence.photoHashes && scan.evidence.photoHashes.length > 1;
  const sealHeight = isMulti ? 34 : 28;

  doc.setFillColor(55, 71, 79); // utility-evidence
  doc.rect(margin, y, contentWidth, sealHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SECTION 65B EVIDENCE SEAL', margin + 4, y + 6);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`SHA-256 (Master Evidence Digest): ${scan.evidence.photoHash}`, margin + 4, y + 12);
  doc.text(`GPS: ${scan.evidence.locationString}`, margin + 4, y + 17);
  doc.text(`Timestamp: ${scan.evidence.timestamp}`, margin + 4, y + 22);
  doc.text(`Officer: ${scan.evidence.officerId}`, margin + 100, y + 22);
  if (isMulti) {
    doc.text(`Multi-Angle Packaging Seal: ${scan.evidence.photoHashes!.length} Angles Cryptographically Linked (${scan.evidence.photoHashes!.map((h, i) => `Side ${i + 1}: ${h.slice(0, 8)}...`).join(' | ')})`, margin + 4, y + 28);
  }

  y += sealHeight + 6;

  // === FOOTER ===
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text('This is a computer-generated document. The digital evidence seal ensures tamper-evident integrity under the Indian Evidence Act, 1872 (Section 65B).', pageWidth / 2, 285, { align: 'center' });
  doc.text(`Generated by CompliScan v1.0 | Team <AI-lite>Outlaw (09B345) | SIH26034`, pageWidth / 2, 290, { align: 'center' });

  // Save
  const filename = `CompliScan_Notice_${scan.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}
