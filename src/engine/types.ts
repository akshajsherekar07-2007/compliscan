// CompliScan — Legal Metrology Compliance Engine Types
// Reference: Legal Metrology (Packaged Commodities) Rules, 2011
// Amended vide GSR 779(E) 2022, GSR 685(E) 2024, and 2025/2026 Notifications

export interface TextBlock {
  text: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface BarcodeResult {
  value: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface CalibrationResult {
  scaleRatio: number;
  barcodeWidthPx: number;
  barcodeWidthMm: number;
  magnificationFactor: number;
  isValid: boolean;
  rejectionReason?: string;
  isEstimated?: boolean;
}

export interface CrossFieldCheck {
  id: string; // e.g. 'XF-SERVING', 'XF-QUID', 'XF-USP'
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INFORMATIONAL';
  details: string;
  evidence: string;
}

export interface ExtractedFields {
  mrp: { 
    value: number; 
    raw: string; 
    includesTaxPhrase: boolean; 
    confidence?: number; 
    boundingBox?: { x: number; y: number; width: number; height: number } 
  } | null;
  netQuantity: { 
    value: number; 
    unit: string; 
    raw: string; 
    confidence?: number; 
    boundingBox?: { x: number; y: number; width: number; height: number } 
  } | null;
  manufacturingDate: { 
    value: string; 
    raw: string; 
    confidence?: number 
  } | null;
  expiryDate: { 
    value: string; 
    raw: string; 
    confidence?: number 
  } | null;
  fssaiLicense: { 
    value: string; 
    raw: string; 
    confidence?: number 
  } | null;
  fssaiLicenses?: string[];
  unitSalePrice: { 
    value: number; 
    perUnit: string; 
    raw: string; 
    confidence?: number; 
    boundingBox?: { x: number; y: number; width: number; height: number } 
  } | null;
  consumerPhone: { 
    value: string; 
    raw: string; 
    confidence?: number 
  } | null;
  consumerEmail: { 
    value: string; 
    raw: string; 
    confidence?: number 
  } | null;
  countryOfOrigin: { 
    value: string; 
    raw: string; 
    isImported?: boolean; 
    isDerived?: boolean; 
    confidence?: number 
  } | null;
  manufacturerName: { 
    value: string; 
    raw: string; 
    isDomestic?: boolean; 
    confidence?: number 
  } | null;
  marketerName?: {
    value: string;
    raw: string;
    confidence?: number;
  } | null;
  genericName: { 
    value: string; 
    raw: string; 
    confidence?: number 
  } | null;
  // FSSAI Food Labelling Fields
  ingredientsText?: string | null;
  hasIngredientsList?: boolean;
  quidIngredients?: Array<{ name: string; percentage: number }>;
  allergenText?: string | null;
  hasNutritionTable?: boolean;
  servingSizeDetails?: {
    servingSizeGrams: number;
    servingsPerPack: number;
    calculatedTotalGrams: number;
  } | null;
  vegNonVeg?: 'VEG' | 'NON_VEG' | null;
  storageInstructions?: string | null;
  batchNumber?: string | null;
}

export type CheckStatus = 'PASS' | 'FAIL' | 'SKIPPED' | 'WARNING' | 'NOT_APPLICABLE' | 'INFORMATIONAL';
export type CheckCategory = 'LEGAL_METROLOGY' | 'FOOD_SAFETY' | 'METRIC_VERIFICATION' | 'CROSS_FIELD';

export interface ComplianceCheck {
  id: string; // e.g. 'R6-1'
  field: string;
  ruleReference: string;
  status: CheckStatus;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  category?: CheckCategory;
  extractedValue: string | null;
  confidence?: number; // 0.0 to 1.0 (OCR Grounding Confidence)
  details: string;
  isCoreInnovation?: boolean;
  innovationBadge?: string;
  amendmentRef?: string; // e.g. "GSR 779(E) w.e.f. 01/12/2022"
}

export interface FontMeasurement {
  field: string;
  measuredHeightPx: number;
  measuredHeightMm: number;
  minimumRequiredMm: number;
  isCompliant: boolean;
  netQuantityValue: number;
  isEstimated?: boolean;
}

export interface USPVerification {
  extractedUSP: number | null;
  calculatedUSP: number;
  variance: number;
  isWithinTolerance: boolean;
  fontRatio: number | null;
  fontRatioCompliant: boolean | null;
  ocrConfidenceAlert?: string | null;
}

export interface ComplianceResult {
  score: number; // backward-compatible: count of passing applicable checks
  totalChecks: number; // count of applicable checks
  lmScore?: number; // Legal Metrology applicable passed
  lmTotal?: number; // Legal Metrology applicable total
  foodSafetyScore?: number;
  foodSafetyTotal?: number;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
  checks: ComplianceCheck[];
  lmChecks?: ComplianceCheck[];
  foodSafetyChecks?: ComplianceCheck[];
  crossFieldChecks?: CrossFieldCheck[];
  fontMeasurements: FontMeasurement[];
  uspVerification: USPVerification | null;
  timestamp: string;
  ruleSetVersion?: string;
  fssaiRuleSetVersion?: string;
}

export interface AnomalyVerdict {
  productName: string;
  isAnomaly: boolean;
  mrpMarkupPercent: number;
  grammageDeficitPercent: number;
  effectiveStealthHikePercent: number;
  narrative: string;
  authorizedMRP: number;
  authorizedQuantity: number;
  scannedMRP: number;
  scannedQuantity: number;
}

export interface ProductBenchmark {
  barcode: string;
  brandName: string;
  standardNetQuantity: number;
  standardUnit: string;
  authorizedStandardMRP: number;
  manufacturer: string;
}

export interface EvidencePackage {
  photoHash: string;
  photoHashes?: string[];
  latitude: number | null;
  longitude: number | null;
  locationString: string;
  timestamp: string;
  deviceInfo: string;
  officerId: string;
}

export interface ScanRecord {
  id: string;
  createdAt: string;
  photoDataUrl: string | null;
  photoDataUrls?: string[];
  extractedFields: ExtractedFields;
  complianceResult: ComplianceResult;
  anomalyVerdict: AnomalyVerdict | null;
  evidence: EvidencePackage;
  rawOcrText: string;
  barcodeValue: string | null;
}
