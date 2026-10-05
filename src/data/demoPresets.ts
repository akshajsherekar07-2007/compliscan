import { ScanRecord, ExtractedFields, ComplianceResult, EvidencePackage, AnomalyVerdict } from '../engine/types';

// Pre-calibrated FMCG demo presets — the Stage Safety Net
// These provide instant, guaranteed-correct demonstrations

function makeEvidence(hash: string): EvidencePackage {
  return {
    photoHash: hash,
    latitude: 18.5204,
    longitude: 73.8567,
    locationString: '18.5204° N, 73.8567° E',
    timestamp: new Date().toISOString(),
    deviceInfo: 'CompliScan Demo Engine v1.0',
    officerId: 'Insp. LM-MH-4091',
  };
}

// ═══════════════════════════════════════════════
// PRESET 1: Kurkure — Perfect 10/10 Compliant
// ═══════════════════════════════════════════════
const kurkureFields: ExtractedFields = {
  mrp: { value: 30, raw: 'MRP ₹30.00 (incl. of all taxes)', includesTaxPhrase: true, boundingBox: { x: 120, y: 80, width: 180, height: 22 } },
  netQuantity: { value: 150, unit: 'g', raw: 'Net Wt. 150g', boundingBox: { x: 120, y: 110, width: 100, height: 18 } },
  manufacturingDate: { value: '08/2026', raw: 'Mfg Date: 08/2026' },
  expiryDate: { value: '02/2027', raw: 'Best Before: 02/2027' },
  fssaiLicense: { value: '11523019000123', raw: '11523019000123' },
  unitSalePrice: { value: 0.20, perUnit: 'g', raw: '₹0.20 per g', boundingBox: { x: 120, y: 140, width: 90, height: 14 } },
  consumerPhone: { value: '18002588888', raw: '1800-258-8888' },
  consumerEmail: { value: 'consumer@pepsico.co.in', raw: 'consumer@pepsico.co.in' },
  countryOfOrigin: { value: 'India', raw: 'Made in India' },
  manufacturerName: { value: 'PepsiCo India Holdings Pvt Ltd, Gurugram', raw: 'Mfg by PepsiCo India Holdings Pvt Ltd, Gurugram' },
  genericName: { value: 'Puffed Corn Snack — Masala Flavour', raw: 'Puffed Corn Snack — Masala Flavour' },
};

const kurkureCompliance: ComplianceResult = {
  score: 10,
  totalChecks: 10,
  status: 'COMPLIANT',
  checks: [
    { id: 'R6-1', field: 'Manufacturer Name & Address', ruleReference: 'Rule 6(1)(a)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'PepsiCo India Holdings Pvt Ltd, Gurugram', details: 'Manufacturer info found' },
    { id: 'R6-2', field: 'Country of Origin', ruleReference: 'Rule 6(1)(f)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Made in India', details: 'Country of Origin found' },
    { id: 'R6-3', field: 'Generic/Common Name', ruleReference: 'Rule 6(1)(b)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Puffed Corn Snack — Masala Flavour', details: 'Generic name found' },
    { id: 'R6-4', field: 'Net Quantity', ruleReference: 'Rule 6(1)(c)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'Net Wt. 150g', details: 'Net quantity found in valid SI unit' },
    { id: 'R6-5', field: 'Month & Year of Manufacture', ruleReference: 'Rule 6(1)(d)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Mfg Date: 08/2026', details: 'Manufacturing date found' },
    { id: 'R6-6', field: 'Best Before / Expiry Date', ruleReference: 'Rule 6(1)(da)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'Best Before: 02/2027', details: 'Expiry date found' },
    { id: 'R6-7', field: 'MRP (inclusive of taxes)', ruleReference: 'Rule 6(1)(e)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'MRP ₹30.00 (incl. of all taxes)', details: 'MRP found with tax phrase' },
    { id: 'R6-8', field: 'Unit Sale Price', ruleReference: 'Rule 6(11)', status: 'PASS', severity: 'MAJOR', extractedValue: '₹0.20 per g', details: 'USP declared', isCoreInnovation: true, innovationBadge: 'USP AI' },
    { id: 'R6-9', field: 'Consumer Care Details', ruleReference: 'Rule 6(1)(n)', status: 'PASS', severity: 'MAJOR', extractedValue: '1800-258-8888 / consumer@pepsico.co.in', details: 'Consumer care found' },
    { id: 'R6-10', field: 'FSSAI License Number', ruleReference: 'FSSAI Act 2006', status: 'PASS', severity: 'CRITICAL', extractedValue: '11523019000123', details: 'Valid 14-digit FSSAI license found' },
  ],
  fontMeasurements: [
    { field: 'Net Quantity', measuredHeightPx: 18, measuredHeightMm: 2.4, minimumRequiredMm: 1.0, isCompliant: true, netQuantityValue: 150 },
  ],
  uspVerification: {
    extractedUSP: 0.20,
    calculatedUSP: 0.20,
    variance: 0.0,
    isWithinTolerance: true,
    fontRatio: 0.64,
    fontRatioCompliant: true,
  },
  timestamp: new Date().toISOString(),
};

export const KURKURE_PRESET: ScanRecord = {
  id: 'preset-kurkure-001',
  createdAt: new Date().toISOString(),
  photoDataUrl: null,
  extractedFields: kurkureFields,
  complianceResult: kurkureCompliance,
  anomalyVerdict: null,
  evidence: makeEvidence('a3f2c7e8d4b1f6a9c0e3d7b2f5a8c1d4e7b0f3a6c9d2e5b8a1c4d7e0b3f6a9'),
  rawOcrText: 'Kurkure Masala Munch Puffed Corn Snack Masala Flavour Net Wt. 150g MRP ₹30.00 (incl. of all taxes) ₹0.20 per g Mfg by PepsiCo India Holdings Pvt Ltd Gurugram Haryana Mfg Date: 08/2026 Best Before: 02/2027 FSSAI Lic No 11523019000123 Consumer Helpline 1800-258-8888 consumer@pepsico.co.in Made in India',
  barcodeValue: '8901491101895',
};

// ═══════════════════════════════════════════════
// PRESET 2: Haldiram — Dual-MRP + Missing USP
// ═══════════════════════════════════════════════
const haldiramFields: ExtractedFields = {
  mrp: { value: 65, raw: 'MRP ₹65.00 (incl. of all taxes)', includesTaxPhrase: true, boundingBox: { x: 100, y: 90, width: 170, height: 20 } },
  netQuantity: { value: 200, unit: 'g', raw: 'Net Wt: 200g', boundingBox: { x: 100, y: 120, width: 90, height: 16 } },
  manufacturingDate: { value: '07/2026', raw: 'Pkd on: 07/2026' },
  expiryDate: { value: '01/2027', raw: 'Best Before 01/2027' },
  fssaiLicense: { value: '10014011000456', raw: '10014011000456' },
  unitSalePrice: null, // MISSING — violation
  consumerPhone: { value: '18001234567', raw: '1800-123-4567' },
  consumerEmail: null,
  countryOfOrigin: { value: 'India', raw: 'Product of India' },
  manufacturerName: { value: 'Haldiram Snacks Pvt Ltd, Nagpur', raw: 'Mfg by Haldiram Snacks Pvt Ltd, Nagpur' },
  genericName: { value: 'Spicy Potato Flakes', raw: 'Spicy Potato Flakes' },
};

const haldiramCompliance: ComplianceResult = {
  score: 7,
  totalChecks: 10,
  status: 'PARTIAL',
  checks: [
    { id: 'R6-1', field: 'Manufacturer Name & Address', ruleReference: 'Rule 6(1)(a)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'Haldiram Snacks Pvt Ltd, Nagpur', details: 'Manufacturer info found' },
    { id: 'R6-2', field: 'Country of Origin', ruleReference: 'Rule 6(1)(f)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Product of India', details: 'Country of Origin found' },
    { id: 'R6-3', field: 'Generic/Common Name', ruleReference: 'Rule 6(1)(b)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Spicy Potato Flakes', details: 'Generic name found' },
    { id: 'R6-4', field: 'Net Quantity', ruleReference: 'Rule 6(1)(c)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'Net Wt: 200g', details: 'Net quantity found' },
    { id: 'R6-5', field: 'Month & Year of Manufacture', ruleReference: 'Rule 6(1)(d)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Pkd on: 07/2026', details: 'Manufacturing date found' },
    { id: 'R6-6', field: 'Best Before / Expiry Date', ruleReference: 'Rule 6(1)(da)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'Best Before 01/2027', details: 'Expiry date found' },
    { id: 'R6-7', field: 'MRP (inclusive of taxes)', ruleReference: 'Rule 6(1)(e)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'MRP ₹65.00 (incl. of all taxes)', details: 'MRP found with tax phrase' },
    { id: 'R6-8', field: 'Unit Sale Price', ruleReference: 'Rule 6(11)', status: 'FAIL', severity: 'MAJOR', extractedValue: null, details: 'USP declaration MISSING — Rule 6(11) violation', isCoreInnovation: true, innovationBadge: 'USP AI' },
    { id: 'R6-9', field: 'Consumer Care Details', ruleReference: 'Rule 6(1)(n)', status: 'FAIL', severity: 'MAJOR', extractedValue: null, details: 'Email not detected' },
    { id: 'R6-10', field: 'FSSAI License Number', ruleReference: 'FSSAI Act 2006', status: 'PASS', severity: 'CRITICAL', extractedValue: '10014011000456', details: 'Valid FSSAI license found' },
  ],
  fontMeasurements: [],
  uspVerification: null,
  timestamp: new Date().toISOString(),
};

export const HALDIRAM_PRESET: ScanRecord = {
  id: 'preset-haldiram-001',
  createdAt: new Date().toISOString(),
  photoDataUrl: null,
  extractedFields: haldiramFields,
  complianceResult: haldiramCompliance,
  anomalyVerdict: {
    productName: "Haldiram's Aloo Bhujia 200g",
    isAnomaly: true,
    mrpMarkupPercent: 30.0,
    grammageDeficitPercent: 0,
    effectiveStealthHikePercent: 30.0,
    narrative: 'DUAL-MRP ALERT: Scanned MRP ₹65 exceeds the authorized national benchmark of ₹50 by +30%. This may indicate prohibited transit hub / airport overcharging under Rule 18 of the Legal Metrology (Packaged Commodities) Rules, 2011.',
    authorizedMRP: 50,
    authorizedQuantity: 200,
    scannedMRP: 65,
    scannedQuantity: 200,
  },
  evidence: makeEvidence('b4c1d7e0a3f6c9b2e5d8a1c4f7b0e3d6a9c2f5b8e1d4a7c0f3b6e9d2a5c8f1'),
  rawOcrText: 'Haldiram\'s Aloo Bhujia Spicy Potato Flakes Net Wt: 200g MRP ₹65.00 (incl. of all taxes) Mfg by Haldiram Snacks Pvt Ltd Nagpur Pkd on: 07/2026 Best Before 01/2027 FSSAI 10014011000456 Consumer Care 1800-123-4567 Product of India',
  barcodeValue: '8904004400572',
};

// ═══════════════════════════════════════════════
// PRESET 3: Parle-G — Shrinkflation + USP Math Mismatch
// ═══════════════════════════════════════════════
const parleFields: ExtractedFields = {
  mrp: { value: 10, raw: 'MRP ₹10.00 (incl. of all taxes)', includesTaxPhrase: true, boundingBox: { x: 80, y: 100, width: 160, height: 18 } },
  netQuantity: { value: 85, unit: 'g', raw: 'Net Wt 85g', boundingBox: { x: 80, y: 130, width: 80, height: 14 } },
  manufacturingDate: { value: '08/2026', raw: 'MFG 08/2026' },
  expiryDate: { value: '02/2027', raw: 'BB 02/2027' },
  fssaiLicense: { value: '11517011002123', raw: '11517011002123' },
  unitSalePrice: { value: 0.12, perUnit: 'g', raw: '₹0.12/g', boundingBox: { x: 80, y: 160, width: 70, height: 10 } },
  consumerPhone: { value: '02226169000', raw: '022-2616-9000' },
  consumerEmail: { value: 'feedback@parle.com', raw: 'feedback@parle.com' },
  countryOfOrigin: { value: 'India', raw: 'Made in India' },
  manufacturerName: { value: 'Parle Products Pvt Ltd, Mumbai', raw: 'Manufactured by Parle Products Pvt Ltd, Mumbai' },
  genericName: { value: 'Glucose Biscuits', raw: 'Glucose Biscuits' },
};

const parleCompliance: ComplianceResult = {
  score: 8,
  totalChecks: 10,
  status: 'PARTIAL',
  checks: [
    { id: 'R6-1', field: 'Manufacturer Name & Address', ruleReference: 'Rule 6(1)(a)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'Parle Products Pvt Ltd, Mumbai', details: 'Manufacturer info found' },
    { id: 'R6-2', field: 'Country of Origin', ruleReference: 'Rule 6(1)(f)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Made in India', details: 'Country of Origin found' },
    { id: 'R6-3', field: 'Generic/Common Name', ruleReference: 'Rule 6(1)(b)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Glucose Biscuits', details: 'Generic name found' },
    { id: 'R6-4', field: 'Net Quantity', ruleReference: 'Rule 6(1)(c)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'Net Wt 85g', details: 'Net quantity found' },
    { id: 'R6-5', field: 'Month & Year of Manufacture', ruleReference: 'Rule 6(1)(d)', status: 'PASS', severity: 'MAJOR', extractedValue: 'MFG 08/2026', details: 'Manufacturing date found' },
    { id: 'R6-6', field: 'Best Before / Expiry Date', ruleReference: 'Rule 6(1)(da)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'BB 02/2027', details: 'Expiry date found' },
    { id: 'R6-7', field: 'MRP (inclusive of taxes)', ruleReference: 'Rule 6(1)(e)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'MRP ₹10.00 (incl. of all taxes)', details: 'MRP found with tax phrase' },
    { id: 'R6-8', field: 'Unit Sale Price', ruleReference: 'Rule 6(11)', status: 'PASS', severity: 'MAJOR', extractedValue: '₹0.12/g', details: 'USP declared but MATH MISMATCH detected', isCoreInnovation: true, innovationBadge: 'USP AI' },
    { id: 'R6-9', field: 'Consumer Care Details', ruleReference: 'Rule 6(1)(n)', status: 'PASS', severity: 'MAJOR', extractedValue: '022-2616-9000 / feedback@parle.com', details: 'Consumer care found' },
    { id: 'R6-10', field: 'FSSAI License Number', ruleReference: 'FSSAI Act 2006', status: 'PASS', severity: 'CRITICAL', extractedValue: '11517011002123', details: 'Valid FSSAI license found' },
  ],
  fontMeasurements: [
    { field: 'Net Quantity', measuredHeightPx: 14, measuredHeightMm: 1.87, minimumRequiredMm: 1.0, isCompliant: true, netQuantityValue: 85 },
  ],
  uspVerification: {
    extractedUSP: 0.12,
    calculatedUSP: 0.1176,
    variance: 2.04,
    isWithinTolerance: false,
    fontRatio: 0.56,
    fontRatioCompliant: true,
  },
  timestamp: new Date().toISOString(),
};

export const PARLE_PRESET: ScanRecord = {
  id: 'preset-parle-001',
  createdAt: new Date().toISOString(),
  photoDataUrl: null,
  extractedFields: parleFields,
  complianceResult: parleCompliance,
  anomalyVerdict: {
    productName: 'Parle-G Gold Biscuits',
    isAnomaly: true,
    mrpMarkupPercent: 0,
    grammageDeficitPercent: 15.0,
    effectiveStealthHikePercent: 17.6,
    narrative: 'SHRINKFLATION ALERT: Package grammage reduced from standard 100g to 85g (−15.0%) without proportional MRP reduction. This results in an effective stealth price hike of +17.6% per gram. Consumers are paying ₹0.12/g instead of the authorized ₹0.10/g.',
    authorizedMRP: 10,
    authorizedQuantity: 100,
    scannedMRP: 10,
    scannedQuantity: 85,
  },
  evidence: makeEvidence('c5d2e8f1a4b7c0d3e6f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2'),
  rawOcrText: 'Parle-G Gold Glucose Biscuits Net Wt 85g MRP ₹10.00 (incl. of all taxes) ₹0.12/g Manufactured by Parle Products Pvt Ltd Mumbai MFG 08/2026 BB 02/2027 FSSAI 11517011002123 022-2616-9000 feedback@parle.com Made in India',
  barcodeValue: '8901719104052',
};

// ═══════════════════════════════════════════════
// PRESET 4: Amul — Rule 7 Font Height Failure
// ═══════════════════════════════════════════════
const amulFields: ExtractedFields = {
  mrp: { value: 58, raw: 'MRP ₹58.00 (incl. of all taxes)', includesTaxPhrase: true, boundingBox: { x: 90, y: 85, width: 150, height: 20 } },
  netQuantity: { value: 100, unit: 'g', raw: 'Net Wt 100g', boundingBox: { x: 90, y: 115, width: 80, height: 5 } },
  manufacturingDate: { value: '09/2026', raw: 'Pkd on 09/2026' },
  expiryDate: { value: '10/2026', raw: 'Use By 10/2026' },
  fssaiLicense: { value: '10012011000789', raw: '10012011000789' },
  unitSalePrice: { value: 0.58, perUnit: 'g', raw: '₹0.58 per g', boundingBox: { x: 90, y: 145, width: 90, height: 12 } },
  consumerPhone: { value: '18002583456', raw: '1800-258-3456' },
  consumerEmail: { value: 'consumer@amul.coop', raw: 'consumer@amul.coop' },
  countryOfOrigin: { value: 'India', raw: 'Made in India' },
  manufacturerName: { value: 'Gujarat Cooperative Milk Marketing Federation Ltd, Anand', raw: 'Mfg by GCMMF Ltd, Anand, Gujarat' },
  genericName: { value: 'Pasteurized Table Butter', raw: 'Pasteurized Table Butter' },
};

const amulCompliance: ComplianceResult = {
  score: 9,
  totalChecks: 10,
  status: 'PARTIAL',
  checks: [
    { id: 'R6-1', field: 'Manufacturer Name & Address', ruleReference: 'Rule 6(1)(a)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'GCMMF Ltd, Anand, Gujarat', details: 'Manufacturer info found' },
    { id: 'R6-2', field: 'Country of Origin', ruleReference: 'Rule 6(1)(f)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Made in India', details: 'Country of Origin found' },
    { id: 'R6-3', field: 'Generic/Common Name', ruleReference: 'Rule 6(1)(b)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Pasteurized Table Butter', details: 'Generic name found' },
    { id: 'R6-4', field: 'Net Quantity', ruleReference: 'Rule 6(1)(c)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'Net Wt 100g', details: 'Net quantity found' },
    { id: 'R6-5', field: 'Month & Year of Manufacture', ruleReference: 'Rule 6(1)(d)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Pkd on 09/2026', details: 'Manufacturing date found' },
    { id: 'R6-6', field: 'Best Before / Expiry Date', ruleReference: 'Rule 6(1)(da)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'Use By 10/2026', details: 'Expiry date found' },
    { id: 'R6-7', field: 'MRP (inclusive of taxes)', ruleReference: 'Rule 6(1)(e)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'MRP ₹58.00 (incl. of all taxes)', details: 'MRP found with tax phrase' },
    { id: 'R6-8', field: 'Unit Sale Price', ruleReference: 'Rule 6(11)', status: 'PASS', severity: 'MAJOR', extractedValue: '₹0.58 per g', details: 'USP declared', isCoreInnovation: true, innovationBadge: 'USP AI' },
    { id: 'R6-9', field: 'Consumer Care Details', ruleReference: 'Rule 6(1)(n)', status: 'PASS', severity: 'MAJOR', extractedValue: '1800-258-3456 / consumer@amul.coop', details: 'Consumer care found' },
    { id: 'R6-10', field: 'FSSAI License Number', ruleReference: 'FSSAI Act 2006', status: 'PASS', severity: 'CRITICAL', extractedValue: '10012011000789', details: 'Valid FSSAI license found' },
  ],
  fontMeasurements: [
    { field: 'Net Quantity', measuredHeightPx: 5, measuredHeightMm: 0.60, minimumRequiredMm: 1.0, isCompliant: false, netQuantityValue: 100 },
  ],
  uspVerification: {
    extractedUSP: 0.58,
    calculatedUSP: 0.58,
    variance: 0.0,
    isWithinTolerance: true,
    fontRatio: 0.60,
    fontRatioCompliant: true,
  },
  timestamp: new Date().toISOString(),
};

export const AMUL_PRESET: ScanRecord = {
  id: 'preset-amul-001',
  createdAt: new Date().toISOString(),
  photoDataUrl: null,
  extractedFields: amulFields,
  complianceResult: amulCompliance,
  anomalyVerdict: null,
  evidence: makeEvidence('d6e3f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2e5d8a1c4f7b0e3'),
  rawOcrText: 'Amul Pasteurized Table Butter Net Wt 100g MRP ₹58.00 (incl. of all taxes) ₹0.58 per g Mfg by GCMMF Ltd Anand Gujarat Pkd on 09/2026 Use By 10/2026 FSSAI 10012011000789 1800-258-3456 consumer@amul.coop Made in India',
  barcodeValue: '8901262010054',
};

// ═══════════════════════════════════════════════
// PRESET 5: Maggi 2-Minute Noodles — 10/10 Compliant
// ═══════════════════════════════════════════════
const maggiFields: ExtractedFields = {
  mrp: { value: 14, raw: 'MRP ₹14.00 (incl. of all taxes)', includesTaxPhrase: true, boundingBox: { x: 120, y: 80, width: 170, height: 22 } },
  netQuantity: { value: 70, unit: 'g', raw: 'NET QUANTITY: 70 g', boundingBox: { x: 120, y: 110, width: 95, height: 18 } },
  manufacturingDate: { value: '08/2026', raw: 'MFD: 08/2026' },
  expiryDate: { value: '05/2027', raw: 'USE BY: 05/2027 (9 MONTHS FROM PKG)' },
  fssaiLicense: { value: '10012011000168', raw: 'Lic. No. 10012011000168' },
  unitSalePrice: { value: 0.20, perUnit: 'g', raw: 'USP ₹0.20/g', boundingBox: { x: 120, y: 140, width: 85, height: 14 } },
  consumerPhone: { value: '18001031947', raw: '1800 103 1947' },
  consumerEmail: { value: 'wecare@in.nestle.com', raw: 'wecare@in.nestle.com' },
  countryOfOrigin: { value: 'India', raw: 'FOR SALE IN INDIA (New Delhi - 110 001)' },
  manufacturerName: { value: 'Nestlé India Limited, New Delhi', raw: 'Marketed by: Nestlé India Limited, 100/101 World Trade Centre, New Delhi - 110 001' },
  genericName: { value: 'Instant Noodles with Seasoning', raw: 'Instant Noodles with Seasoning' },
};

const maggiCompliance: ComplianceResult = {
  score: 10,
  totalChecks: 10,
  status: 'COMPLIANT',
  checks: [
    { id: 'R6-1', field: 'Manufacturer Name & Address', ruleReference: 'Rule 6(1)(a)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'Nestlé India Limited, New Delhi - 110 001', details: 'Manufacturer details verified' },
    { id: 'R6-2', field: 'Country of Origin', ruleReference: 'Rule 6(1)(f)', status: 'PASS', severity: 'MAJOR', extractedValue: 'India (New Delhi)', details: 'Domestic origin verified' },
    { id: 'R6-3', field: 'Common/Generic Commodity Name', ruleReference: 'Rule 6(1)(b)', status: 'PASS', severity: 'MAJOR', extractedValue: 'Instant Noodles with Seasoning', details: 'Generic name declared' },
    { id: 'R6-4', field: 'Net Quantity (Metric Units)', ruleReference: 'Rule 6(1)(c)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'NET QUANTITY: 70 g', details: 'Net quantity declared in metric units' },
    { id: 'R6-5', field: 'Month & Year of Manufacture/Pkg', ruleReference: 'Rule 6(1)(d)', status: 'PASS', severity: 'CRITICAL', extractedValue: '08/2026', details: 'Manufacturing date found' },
    { id: 'R6-6', field: 'Best Before / Expiry Date', ruleReference: 'Rule 6(1)(da)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'USE BY 05/2027 (9 MONTHS)', details: 'Expiry declaration found' },
    { id: 'R6-7', field: 'MRP (inclusive of all taxes)', ruleReference: 'Rule 6(1)(e)', status: 'PASS', severity: 'CRITICAL', extractedValue: 'MRP ₹14.00 (incl. of all taxes)', details: 'MRP declared with statutory tax phrase' },
    { id: 'R6-8', field: 'Unit Sale Price (USP)', ruleReference: 'Rule 6(11)', status: 'PASS', severity: 'MAJOR', extractedValue: '₹0.20 per g', details: 'USP declared (₹0.20/g)', isCoreInnovation: true, innovationBadge: 'USP AI' },
    { id: 'R6-9', field: 'Consumer Care Details', ruleReference: 'Rule 6(1)(n)', status: 'PASS', severity: 'MAJOR', extractedValue: '1800 103 1947 / wecare@in.nestle.com', details: 'Consumer helpline & email declared' },
    { id: 'R6-10', field: 'FSSAI License Number', ruleReference: 'FSSAI Act 2006', status: 'PASS', severity: 'CRITICAL', extractedValue: '10012011000168', details: 'Central FSSAI License verified' },
  ],
  fontMeasurements: [
    { field: 'Net Quantity', measuredHeightPx: 14, measuredHeightMm: 1.86, minimumRequiredMm: 1.0, isCompliant: true, netQuantityValue: 70 },
  ],
  uspVerification: {
    extractedUSP: 0.20,
    calculatedUSP: 0.20,
    variance: 0.0,
    isWithinTolerance: true,
    fontRatio: 0.58,
    fontRatioCompliant: true,
  },
  timestamp: new Date().toISOString(),
};

export const MAGGI_PRESET: ScanRecord = {
  id: 'preset-maggi-001',
  createdAt: new Date().toISOString(),
  photoDataUrl: null,
  extractedFields: maggiFields,
  complianceResult: maggiCompliance,
  anomalyVerdict: null,
  evidence: makeEvidence('e7f4a1b8c2d5e9f3a6b0c4d8e1f5a9b2c6d0e3f7a1b4c8d2e5f9a3b6c0d4e8'),
  rawOcrText: 'Nestle Maggi 2-Minute Noodles NET QUANTITY: 70 g MRP ₹14.00 (incl. of all taxes) MFD.-USE BY: 08/2026-05/2027 Lic. No. 10012011000168 1800 103 1947 wecare@in.nestle.com New Delhi - 110 001',
  barcodeValue: '8901058000290',
};

export const DEMO_PRESETS: Record<string, ScanRecord> = {
  kurkure: KURKURE_PRESET,
  haldiram: HALDIRAM_PRESET,
  parle: PARLE_PRESET,
  'parle-g': PARLE_PRESET,
  amul: AMUL_PRESET,
  maggi: MAGGI_PRESET,
};
