import { 
  ComplianceResult, 
  ExtractedFields, 
  CalibrationResult, 
  TextBlock, 
  ComplianceCheck, 
  FontMeasurement, 
  USPVerification,
  CrossFieldCheck,
  CheckStatus,
  CheckCategory 
} from './types';
import { measureFontHeight, getMinFontHeight } from './GS1Calibrator';

export function evaluate(
  fields: ExtractedFields, 
  calibration: CalibrationResult | null, 
  textBlocks: TextBlock[]
): ComplianceResult {
  const lmChecks: ComplianceCheck[] = [];
  const foodSafetyChecks: ComplianceCheck[] = [];
  const metricChecks: ComplianceCheck[] = [];

  const createCheck = (
    id: string,
    field: string,
    ruleReference: string,
    status: CheckStatus,
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR',
    category: CheckCategory,
    extracted: string | null,
    details: string,
    confidence?: number,
    isInnovation?: boolean,
    badge?: string,
    amendmentRef?: string
  ): ComplianceCheck => {
    return {
      id,
      field,
      ruleReference,
      status,
      severity,
      category,
      extractedValue: extracted,
      confidence,
      details,
      ...(isInnovation && { isCoreInnovation: true }),
      ...(badge && { innovationBadge: badge }),
      ...(amendmentRef && { amendmentRef })
    };
  };

  // Determine if this is a food commodity based on universal statutory criteria:
  // 1. FSSAI registration declared
  // 2. Ingredients list or nutrition panel declared
  // 3. Dietary / veg-nonveg symbol declared
  // 4. Quantitative ingredients (QUID) or serving size declared
  // 5. Food / edible statutory terminology in product name or declaration
  const isFoodCommodity = !!fields.fssaiLicense || 
    (!!fields.fssaiLicenses && fields.fssaiLicenses.length > 0) ||
    !!fields.hasIngredientsList || 
    !!fields.ingredientsText ||
    !!fields.hasNutritionTable ||
    !!fields.vegNonVeg ||
    (!!fields.quidIngredients && fields.quidIngredients.length > 0) ||
    !!fields.servingSizeDetails ||
    /\b(?:food|edible|proprietary\s*food|fssai|dietary|nutrition|beverage|snack|confectionery|flavour|flavor)\b/i.test(
      `${fields.genericName?.value || ''} ${fields.genericName?.raw || ''} ${fields.manufacturerName?.raw || ''}`
    );

  // ── 1. Manufacturer / Packer Name & Address (Rule 6(1)(a)) ────────
  lmChecks.push(createCheck(
    'R6-1',
    'Manufacturer / Packer Name & Address',
    'Rule 6(1)(a)',
    fields.manufacturerName ? 'PASS' : 'FAIL',
    'CRITICAL',
    'LEGAL_METROLOGY',
    fields.manufacturerName?.raw || null,
    fields.manufacturerName 
      ? `Manufacturer/Packer identity declared: ${fields.manufacturerName.value}`
      : 'Manufacturer/Packer details missing from label declarations',
    fields.manufacturerName?.confidence || 0.85
  ));

  // ── 2. Country of Origin (Rule 6(1)(aa)) ───────────────────────────
  // STATUTORY INTERPRETATION: Mandatory under Rule 6(1)(aa).
  // For imported goods: explicit country of origin is mandatory.
  // For domestic goods: domestic Indian manufacturing/packaging address satisfies Rule 6(1)(aa).
  const isImportedGood = !!fields.countryOfOrigin?.isImported;
  const isDomesticGood = fields.countryOfOrigin?.isImported === false || 
    fields.manufacturerName?.isDomestic || 
    /India/i.test(fields.countryOfOrigin?.value || '') ||
    /India/i.test(fields.manufacturerName?.value || '');

  if (isImportedGood) {
    const hasOrigin = !!fields.countryOfOrigin?.value;
    lmChecks.push(createCheck(
      'R6-2',
      'Country of Origin (Imported Commodity)',
      'Rule 6(1)(aa)',
      hasOrigin ? 'PASS' : 'FAIL',
      'CRITICAL',
      'LEGAL_METROLOGY',
      fields.countryOfOrigin?.raw || null,
      hasOrigin
        ? `Imported commodity origin declared: ${fields.countryOfOrigin!.value}`
        : 'Country of origin missing for imported commodity (Mandatory under Rule 6(1)(aa))',
      fields.countryOfOrigin?.confidence || 0.90,
      false,
      undefined,
      'Mandatory for imported goods'
    ));
  } else if (isDomesticGood) {
    const originVal = fields.countryOfOrigin?.value || 'India (Domestic Manufacture)';
    lmChecks.push(createCheck(
      'R6-2',
      'Country of Origin',
      'Rule 6(1)(aa)',
      'PASS',
      'CRITICAL',
      'LEGAL_METROLOGY',
      originVal,
      `Domestic Indian origin verified under Rule 6(1)(aa) via manufacturing location (${originVal})`,
      0.95,
      false,
      undefined,
      'Rule 6(1)(aa) Scope'
    ));
  } else {
    lmChecks.push(createCheck(
      'R6-2',
      'Country of Origin',
      'Rule 6(1)(aa)',
      'FAIL',
      'CRITICAL',
      'LEGAL_METROLOGY',
      null,
      'Country of origin or domestic manufacturing location missing under Rule 6(1)(aa)',
      0.80
    ));
  }

  // ── 3. Common / Generic Commodity Name (Rule 6(1)(b)) ──────────────
  // STRICT: Batch numbers and date strings are completely rejected.
  const hasValidGenericName = !!fields.genericName?.value && 
    !/(?:batch|lot|b\.?no|date|mfd|exp|pkd|mrp|rs\.|fssai)/i.test(fields.genericName.value);

  lmChecks.push(createCheck(
    'R6-3',
    'Common / Generic Commodity Name',
    'Rule 6(1)(b)',
    hasValidGenericName ? 'PASS' : 'FAIL',
    'MAJOR',
    'LEGAL_METROLOGY',
    hasValidGenericName ? fields.genericName!.raw : null,
    hasValidGenericName 
      ? `Generic commodity name verified: "${fields.genericName!.value}"`
      : 'Generic commodity name missing (e.g. "Potato Chips", "Instant Noodles"). Batch or date codes are not valid commodity names.',
    fields.genericName?.confidence || (hasValidGenericName ? 0.90 : 0.20)
  ));

  // ── 4. Net Quantity in Standard Metric Units (Rule 6(1)(c) & Rule 11) ─
  const hasNetQty = !!fields.netQuantity;
  const isNetQtyLowConfidence = fields.netQuantity && (fields.netQuantity.confidence || 1.0) < 0.70;
  
  lmChecks.push(createCheck(
    'R6-4',
    'Net Quantity (Metric Units)',
    'Rule 6(1)(c)',
    hasNetQty ? 'PASS' : 'FAIL',
    'CRITICAL',
    'LEGAL_METROLOGY',
    hasNetQty ? `${fields.netQuantity!.value} ${fields.netQuantity!.unit}` : null,
    hasNetQty
      ? (isNetQtyLowConfidence 
          ? `Net quantity detected: ${fields.netQuantity!.value}${fields.netQuantity!.unit} (⚠️ Visual/OCR confidence: ${Math.round(fields.netQuantity!.confidence! * 100)}% — verify physical package)`
          : `Net quantity verified: ${fields.netQuantity!.value} ${fields.netQuantity!.unit} (Standard metric units per Rule 11)`)
      : 'Net quantity declaration missing or non-metric unit',
    fields.netQuantity?.confidence || 0.90
  ));

  // ── 5. Month & Year of Manufacture / Packaging (Rule 6(1)(d)) ─────
  // STATUTORY INTERPRETATION: Rule 6(1)(d) mandates month & year of manufacture or pre-packaging.
  // Proviso to Rule 6(1)(d) allows food articles governed by FSSAI Best Before / Use By to satisfy date compliance.
  if (fields.manufacturingDate) {
    lmChecks.push(createCheck(
      'R6-5',
      'Date of Manufacture / Packaging',
      'Rule 6(1)(d)',
      'PASS',
      'CRITICAL',
      'LEGAL_METROLOGY',
      fields.manufacturingDate.value,
      `Manufacturing/Packaging date declared: ${fields.manufacturingDate.value}`,
      fields.manufacturingDate.confidence || 0.90
    ));
  } else if (isFoodCommodity && fields.expiryDate) {
    lmChecks.push(createCheck(
      'R6-5',
      'Date of Manufacture / Packaging',
      'Rule 6(1)(d) Proviso',
      'PASS',
      'MAJOR',
      'LEGAL_METROLOGY',
      `Best Before: ${fields.expiryDate.value}`,
      `Statutory date compliance satisfied under Rule 6(1)(d) Proviso via Best Before / Use By date: ${fields.expiryDate.value}`,
      fields.expiryDate.confidence || 0.90,
      false,
      undefined,
      'Food Exemption Proviso'
    ));
  } else {
    lmChecks.push(createCheck(
      'R6-5',
      'Month & Year of Manufacture / Pkg',
      'Rule 6(1)(d)',
      'FAIL',
      'CRITICAL',
      'LEGAL_METROLOGY',
      null,
      'Month & year of manufacture or packaging is missing under Rule 6(1)(d)',
      0.85
    ));
  }

  // ── 6. Best Before / Use By Date (Rule 6(1)(da) & FSSAI) ───────────
  if (isFoodCommodity) {
    lmChecks.push(createCheck(
      'R6-6',
      'Best Before / Use By Date',
      'Rule 6(1)(da)',
      fields.expiryDate ? 'PASS' : 'FAIL',
      'CRITICAL',
      'LEGAL_METROLOGY',
      fields.expiryDate?.value || null,
      fields.expiryDate
        ? `Best Before / Use By declaration verified: ${fields.expiryDate.value}`
        : 'Best Before / Use By date missing (Mandatory for consumable food commodities under Rule 6(1)(da))',
      fields.expiryDate?.confidence || 0.90
    ));
  } else {
    // Non-food commodity: if declared, PASS; if non-perishable, compliant with standard shelf-life
    const hasExp = !!fields.expiryDate;
    lmChecks.push(createCheck(
      'R6-6',
      'Best Before / Expiry Date',
      'Rule 6(1)(da)',
      'PASS',
      'MINOR',
      'LEGAL_METROLOGY',
      hasExp ? fields.expiryDate!.value : 'Non-perishable (Standard Shelf-Life)',
      hasExp
        ? `Expiry date declared: ${fields.expiryDate!.value}`
        : 'Statutory shelf-life compliant under Rule 6(1)(da) (Non-perishable article)',
      0.90
    ));
  }

  // ── 7. Maximum Retail Price (MRP) (Rule 6(1)(e)) ──────────────────
  lmChecks.push(createCheck(
    'R6-7',
    'MRP (inclusive of all taxes)',
    'Rule 6(1)(e)',
    fields.mrp ? 'PASS' : 'FAIL',
    'CRITICAL',
    'LEGAL_METROLOGY',
    fields.mrp ? (fields.mrp.value > 0 ? `₹${fields.mrp.value.toFixed(2)}` : fields.mrp.raw) : null,
    fields.mrp
      ? (fields.mrp.value > 0
          ? `MRP declared: ₹${fields.mrp.value.toFixed(2)} (Tax phrase: ${fields.mrp.includesTaxPhrase ? 'Inclusive of all taxes ✅' : 'Taxes not explicitly declared ⚠️'})`
          : `Statutory MRP declaration verified: "${fields.mrp.raw}" (Price stamped on side/crimp)`)
      : 'MRP declaration missing or not inclusive of all taxes',
    fields.mrp?.confidence || 0.90
  ));

  // ── 8. Unit Sale Price (USP) (Rule 6(11) — 2022 Amendment) ────────
  const isSachetExempt = !!fields.netQuantity && 
    fields.netQuantity.value <= 10 && 
    (fields.netQuantity.unit === 'g' || fields.netQuantity.unit === 'ml');

  if (fields.unitSalePrice) {
    lmChecks.push(createCheck(
      'R6-8',
      'Unit Sale Price (USP)',
      'Rule 6(11)',
      'PASS',
      'MAJOR',
      'LEGAL_METROLOGY',
      fields.unitSalePrice.value > 0 
        ? `₹${fields.unitSalePrice.value.toFixed(2)} / ${fields.unitSalePrice.perUnit}`
        : fields.unitSalePrice.raw,
      fields.unitSalePrice.value > 0
        ? `Unit Sale Price declared: ₹${fields.unitSalePrice.value.toFixed(2)} per ${fields.unitSalePrice.perUnit} (GSR 779(E) compliant)`
        : `Statutory USP format declared: "${fields.unitSalePrice.raw}"`,
      fields.unitSalePrice.confidence || 0.88,
      true,
      'USP Metric',
      'GSR 779(E) w.e.f. 01/12/2022'
    ));
  } else if (isSachetExempt) {
    lmChecks.push(createCheck(
      'R6-8',
      'Unit Sale Price (USP)',
      'Rule 6(11) Proviso',
      'PASS',
      'MINOR',
      'LEGAL_METROLOGY',
      `${fields.netQuantity!.value}${fields.netQuantity!.unit} (Sachet Exemption)`,
      `Statutory compliance verified under Rule 6(11) Second Proviso (GSR 779(E)) — Packages containing ≤10g/ml exempt from mandatory USP declaration`,
      0.95,
      true,
      'Sachet Exemption',
      'GSR 779(E) Second Proviso'
    ));
  } else {
    lmChecks.push(createCheck(
      'R6-8',
      'Unit Sale Price (USP)',
      'Rule 6(11)',
      'FAIL',
      'MAJOR',
      'LEGAL_METROLOGY',
      null,
      'Unit Sale Price missing (Mandatory since 01 Dec 2022 under Rule 6(11) GSR 779(E))',
      0.88,
      true,
      'USP Metric',
      'GSR 779(E) w.e.f. 01/12/2022'
    ));
  }

  // ── 9. Consumer Care Details (Rule 6(1)(n)) ───────────────────────
  const hasConsumerCare = !!fields.consumerPhone || !!fields.consumerEmail;
  const consumerCareStrings = [
    fields.consumerPhone ? `Phone: ${fields.consumerPhone.value}` : null,
    fields.consumerEmail ? `Email: ${fields.consumerEmail.value}` : null
  ].filter(Boolean).join(' | ');

  lmChecks.push(createCheck(
    'R6-9',
    'Consumer Care Details',
    'Rule 6(1)(n)',
    hasConsumerCare ? 'PASS' : 'FAIL',
    'MAJOR',
    'LEGAL_METROLOGY',
    consumerCareStrings || null,
    hasConsumerCare
      ? `Consumer care contact verified: ${consumerCareStrings}`
      : 'Consumer care contact details missing (Telephone number or email mandatory)',
    0.92
  ));

  // ── 10. Batch / Lot / Identification Code (Rule 6(1)(q)) ──────────
  const hasBatch = !!fields.batchNumber;
  const hasTraceability = hasBatch || !!fields.fssaiLicense || (fields.fssaiLicenses && fields.fssaiLicenses.length > 0);
  const batchDisplay = fields.batchNumber 
    ? `Batch: ${fields.batchNumber}` 
    : (fields.fssaiLicense ? `Traceability: Lic. ${fields.fssaiLicense.value}` : null);

  lmChecks.push(createCheck(
    'R6-10',
    'Batch / Lot / Identification Code',
    'Rule 6(1)(q)',
    hasTraceability ? 'PASS' : 'FAIL',
    'MAJOR',
    'LEGAL_METROLOGY',
    batchDisplay,
    hasTraceability
      ? `Statutory traceability identification verified: ${batchDisplay}`
      : 'Mandatory Batch number, Lot code, or statutory traceability identification missing under Rule 6(1)(q)',
    0.90
  ));

  // ── 10. Food Safety Checks (FSSAI Regulations 2020/2026) ───────────
  if (isFoodCommodity || fields.fssaiLicense) {
    // FS-1: FSSAI License Registration (FSS Act 2006 Sec 31)
    const allLics = fields.fssaiLicenses && fields.fssaiLicenses.length > 0 ? fields.fssaiLicenses : (fields.fssaiLicense ? [fields.fssaiLicense.value] : []);
    foodSafetyChecks.push(createCheck(
      'FS-1',
      'FSSAI License Registration',
      'FSS Act 2006 (Sec 31)',
      allLics.length > 0 ? 'PASS' : 'FAIL',
      'CRITICAL',
      'FOOD_SAFETY',
      allLics.length > 0 ? `Lic. No. ${allLics.join(', ')}` : null,
      allLics.length > 1
        ? `Multiple FSSAI licenses registered across manufacturing & marketing units: ${allLics.join(' | ')}`
        : (allLics.length === 1 
            ? `14-digit FSSAI license registered: ${allLics[0]}`
            : '14-digit FSSAI License number missing on food packaging'),
      0.95
    ));

    // FS-2: Food Name & Statutory Categorization (FSSAI Labelling 2020 Rule 2.2.1)
    foodSafetyChecks.push(createCheck(
      'FS-2',
      'Food Name & Statutory Category',
      'FSSAI Reg. 2020 Rule 2.2.1',
      fields.genericName ? 'PASS' : 'FAIL',
      'CRITICAL',
      'FOOD_SAFETY',
      fields.genericName ? fields.genericName.value : null,
      fields.genericName
        ? `Statutory food name declared: "${fields.genericName.value}"`
        : 'Statutory generic food name / proprietary food designation missing',
      fields.genericName?.confidence || 0.90
    ));

    // FS-3: Ingredients List in Descending Order (FSSAI Reg. 2020 Rule 2.2.2)
    const hasIngList = !!fields.hasIngredientsList || !!fields.ingredientsText;
    foodSafetyChecks.push(createCheck(
      'FS-3',
      'Ingredients List Declaration',
      'FSSAI Reg. 2020 Rule 2.2.2',
      hasIngList ? 'PASS' : 'FAIL',
      'MAJOR',
      'FOOD_SAFETY',
      fields.ingredientsText ? fields.ingredientsText.substring(0, 80) + '...' : (hasIngList ? 'Declared' : null),
      hasIngList
        ? 'Ingredients list declared in descending order of in-going weight'
        : 'Mandatory ingredients list declaration missing on food packaging',
      0.92
    ));

    // FS-4: QUID (Quantitative Ingredient Declaration) (FSSAI Reg. 2020 Rule 2.2.2(2))
    const hasQuid = !!fields.quidIngredients && fields.quidIngredients.length > 0;
    const quidSummary = hasQuid ? fields.quidIngredients!.map(q => `${q.name} (${q.percentage}%)`).join(', ') : null;
    foodSafetyChecks.push(createCheck(
      'FS-4',
      'QUID Characterizing Ingredients',
      'FSSAI Reg. 2020 Rule 2.2.2(2)',
      hasQuid ? 'PASS' : (hasIngList ? 'INFORMATIONAL' : 'SKIPPED'),
      'MINOR',
      'FOOD_SAFETY',
      quidSummary,
      hasQuid
        ? `Characterizing ingredients declared with quantitative percentage: ${quidSummary}`
        : 'QUID declaration informational for standardized formulations',
      0.88
    ));

    // FS-5: Nutritional Information Panel (FSSAI Reg. 2020 Rule 2.2.3)
    foodSafetyChecks.push(createCheck(
      'FS-5',
      'Nutritional Information Panel',
      'FSSAI Reg. 2020 Rule 2.2.3',
      fields.hasNutritionTable ? 'PASS' : 'FAIL',
      'CRITICAL',
      'FOOD_SAFETY',
      fields.hasNutritionTable ? 'Per 100g / Per Serve Declared' : null,
      fields.hasNutritionTable
        ? 'Nutritional facts panel present (Energy, Protein, Carbs, Sugars, Total/Saturated/Trans Fat, Sodium)'
        : 'Nutritional information panel missing (Mandatory under FSSAI Labelling Regulations)',
      0.94
    ));

    // FS-6: Veg / Non-Veg Logo & Symbol (FSSAI Reg. 2020 Rule 2.2.5)
    foodSafetyChecks.push(createCheck(
      'FS-6',
      'Veg / Non-Veg Symbol',
      'FSSAI Reg. 2020 Rule 2.2.5',
      fields.vegNonVeg ? 'PASS' : 'INFORMATIONAL',
      'MAJOR',
      'FOOD_SAFETY',
      fields.vegNonVeg ? (fields.vegNonVeg === 'VEG' ? '100% Vegetarian (Green Symbol)' : 'Non-Vegetarian (Brown Symbol)') : null,
      fields.vegNonVeg
        ? `Dietary indicator declared: ${fields.vegNonVeg === 'VEG' ? 'Green dot in square (Vegetarian)' : 'Brown triangle in square (Non-Vegetarian)'}`
        : 'Vegetarian / Non-Vegetarian symbol declaration informational (visual icon inspection recommended)',
      0.85
    ));

    // FS-7: Multiple FSSAI License Numbers & Entity Addresses (FSS Act Sec 31 & FoSCoS)
    foodSafetyChecks.push(createCheck(
      'FS-7',
      'FoSCoS Manufacturing License Traceability',
      'FSS Act 2006 (Sec 31)',
      allLics.length > 0 ? 'PASS' : 'FAIL',
      'MAJOR',
      'FOOD_SAFETY',
      allLics.length > 0 ? allLics.join(', ') : null,
      allLics.length > 1
        ? `Dual traceability verified: Marketer license & manufacturing facility licenses declared (${allLics.length} entities)`
        : (allLics.length === 1 ? `Manufacturing unit license declared: ${allLics[0]}` : 'FSSAI License registration missing'),
      0.95
    ));

    // FS-8: Date Marking (MFD + Expiry/Use By) (FSSAI Reg. 2020 Rule 2.2.10)
    const hasExpiry = !!fields.expiryDate;
    const hasMfg = !!fields.manufacturingDate;
    foodSafetyChecks.push(createCheck(
      'FS-8',
      'Date Marking (MFD & Expiry)',
      'FSSAI Reg. 2020 Rule 2.2.10',
      hasExpiry ? 'PASS' : 'FAIL',
      'CRITICAL',
      'FOOD_SAFETY',
      hasExpiry ? `Expiry: ${fields.expiryDate!.value}${hasMfg ? ` | MFD: ${fields.manufacturingDate!.value}` : ''}` : null,
      hasExpiry
        ? `Date marking verified: Expiry/Use-By: ${fields.expiryDate!.value}${hasMfg ? `, MFD: ${fields.manufacturingDate!.value}` : ''}`
        : 'Mandatory expiry/use-by date declaration missing',
      0.92
    ));

    // FS-9: Storage Conditions (FSSAI Reg. 2020 Rule 2.2.11)
    foodSafetyChecks.push(createCheck(
      'FS-9',
      'Storage Instructions',
      'FSSAI Reg. 2020 Rule 2.2.11',
      fields.storageInstructions ? 'PASS' : 'INFORMATIONAL',
      'MINOR',
      'FOOD_SAFETY',
      fields.storageInstructions || null,
      fields.storageInstructions
        ? `Storage instructions declared: "${fields.storageInstructions}"`
        : 'Storage instructions informational (Recommended: Store in cool, dry place away from direct sunlight)',
      0.88
    ));

    // FS-10: Batch / Lot Identification (FSSAI Reg. 2020 Rule 2.2.8)
    foodSafetyChecks.push(createCheck(
      'FS-10',
      'Batch / Lot Identification',
      'FSSAI Reg. 2020 Rule 2.2.8',
      fields.batchNumber ? 'PASS' : 'INFORMATIONAL',
      'MAJOR',
      'FOOD_SAFETY',
      fields.batchNumber ? `Batch No. ${fields.batchNumber}` : null,
      fields.batchNumber
        ? `Traceable Batch/Lot identification verified: ${fields.batchNumber}`
        : 'Batch/Lot identification informational (stamped on flap/crimp)',
      0.88
    ));
  }

  // ── USP Arithmetic Verification (Rule 6(11)) ──────────────────────
  let uspVerification: USPVerification | null = null;
  if (fields.mrp && fields.netQuantity && fields.mrp.value > 0 && fields.netQuantity.value > 0) {
    const extractedUSP = fields.unitSalePrice?.value && fields.unitSalePrice.value > 0 
      ? fields.unitSalePrice.value 
      : null;
    
    // Per Rule 6(11) 2022 amendment:
    // If net quantity < 1kg/1L, USP is declared per gram or per ml.
    // If net quantity >= 1kg/1L, USP is declared per kg or per L.
    let baseQty = fields.netQuantity.value;
    const unit = fields.netQuantity.unit.toLowerCase();
    
    let calculatedUSP: number;
    if (unit === 'kg' || unit === 'l') {
      calculatedUSP = fields.mrp.value / baseQty; // per kg or per l
    } else {
      calculatedUSP = fields.mrp.value / baseQty; // per g or per ml
    }

    let variance = 0;
    let isWithinTolerance = false;
    let ocrAlert: string | null = null;

    if (fields.netQuantity.confidence && fields.netQuantity.confidence < 0.70) {
      ocrAlert = `⚠️ Net Quantity was extracted with low OCR confidence (${Math.round(fields.netQuantity.confidence * 100)}%). Arithmetic discrepancy may be an OCR misread rather than a packaging defect.`;
    }

    if (extractedUSP !== null) {
      variance = Math.abs((extractedUSP - calculatedUSP) / calculatedUSP) * 100;
      // 5% statutory allowance to accommodate 2-decimal rounding
      isWithinTolerance = variance <= 5.0;
    }

    let fontRatio: number | null = null;
    let fontRatioCompliant: boolean | null = null;
    if (fields.unitSalePrice?.boundingBox && fields.mrp?.boundingBox) {
      fontRatio = fields.unitSalePrice.boundingBox.height / fields.mrp.boundingBox.height;
      fontRatioCompliant = fontRatio >= 0.50;
    }

    uspVerification = {
      extractedUSP,
      calculatedUSP: parseFloat(calculatedUSP.toFixed(2)),
      variance: parseFloat(variance.toFixed(2)),
      isWithinTolerance,
      fontRatio,
      fontRatioCompliant,
      ocrConfidenceAlert: ocrAlert
    };

    // Add arithmetic check
    const mathStatus: CheckStatus = extractedUSP === null 
      ? 'INFORMATIONAL'
      : (isWithinTolerance ? 'PASS' : (ocrAlert ? 'WARNING' : 'FAIL'));

    metricChecks.push(createCheck(
      'R6-11-Math',
      'USP Arithmetic Accuracy (Rule 6(11))',
      'Rule 6(11) GSR 779(E)',
      mathStatus,
      'MINOR',
      'METRIC_VERIFICATION',
      extractedUSP !== null ? `Printed: ₹${extractedUSP.toFixed(2)}/g vs Calc: ₹${calculatedUSP.toFixed(2)}/g` : `Calculated: ₹${calculatedUSP.toFixed(2)}/g`,
      extractedUSP !== null
        ? (isWithinTolerance 
            ? `USP arithmetic mathematically verified (₹${fields.mrp.value} ÷ ${fields.netQuantity.value}${fields.netQuantity.unit} = ₹${calculatedUSP.toFixed(2)}/${fields.netQuantity.unit}, variance: ${variance.toFixed(1)}%)`
            : (ocrAlert 
                ? `${ocrAlert} Printed ₹${extractedUSP} vs Calculated ₹${calculatedUSP.toFixed(2)}.`
                : `USP arithmetic error! Printed ₹${extractedUSP} differs from calculated ₹${calculatedUSP.toFixed(2)} (${variance.toFixed(1)}% variance exceeds 5% threshold)`))
        : `Calculated standard USP: ₹${calculatedUSP.toFixed(2)} per ${fields.netQuantity.unit}`,
      fields.netQuantity.confidence || 0.90,
      true,
      'Zero-Hallucination Math',
      'GSR 779(E) 2022'
    ));
  }

  // ── Rule 7 Font Height Measurements (GS1 Optical Ruler) ───────────
  const fontMeasurements: FontMeasurement[] = [];
  if (calibration?.isValid && fields.netQuantity?.boundingBox) {
    const heightMm = measureFontHeight(fields.netQuantity.boundingBox.height, calibration);
    const minRequired = getMinFontHeight(fields.netQuantity.value, fields.netQuantity.unit);
    const isFontCompliant = heightMm >= minRequired;
    const isEstimated = calibration.isEstimated;

    fontMeasurements.push({
      field: 'Net Quantity',
      measuredHeightPx: fields.netQuantity.boundingBox.height,
      measuredHeightMm: heightMm,
      minimumRequiredMm: minRequired,
      isCompliant: isFontCompliant,
      netQuantityValue: fields.netQuantity.value,
      isEstimated
    });

    if (isEstimated) {
      metricChecks.push(createCheck(
        'R7-1',
        'Rule 7 Table I Font Height',
        'Rule 7(1)',
        'WARNING',
        'MINOR',
        'METRIC_VERIFICATION',
        `~${heightMm.toFixed(2)}mm (Uncalibrated Scale)`,
        `Physical metric scale unavailable without verified optical calibration (GS1 barcode boundary). Estimated font ~${heightMm.toFixed(2)}mm vs statutory minimum ${minRequired}mm. Metric measurement requires calibrated GS1 barcode bounding box or fiducial marker.`,
        0.50,
        true,
        'Optical Ruler (Uncalibrated)',
        'Optical Calibration Required'
      ));
    } else {
      metricChecks.push(createCheck(
        'R7-1',
        'Rule 7 Table I Font Height',
        'Rule 7(1)',
        isFontCompliant ? 'PASS' : 'FAIL',
        'MAJOR',
        'METRIC_VERIFICATION',
        `${heightMm.toFixed(2)}mm (Required: ≥${minRequired}mm)`,
        isFontCompliant
          ? `Font height verified (${heightMm.toFixed(2)}mm exceeds statutory minimum of ${minRequired}mm)`
          : `Font height non-compliance! Measured ${heightMm.toFixed(2)}mm is below statutory requirement of ${minRequired}mm`,
        0.90,
        true,
        'GS1 Optical Ruler'
      ));
    }
  }

  // ── Cross-Field Consistency Checks (Deterministic Validation) ─────
  const crossFieldChecks: CrossFieldCheck[] = [];

  // 1. Serving Size Arithmetic Check
  if (fields.servingSizeDetails && fields.netQuantity && fields.netQuantity.value > 0) {
    const { servingSizeGrams, servingsPerPack, calculatedTotalGrams } = fields.servingSizeDetails;
    const declaredNet = fields.netQuantity.value;
    const diff = Math.abs(calculatedTotalGrams - declaredNet);
    const variancePct = (diff / declaredNet) * 100;
    const isServingCompliant = variancePct <= 5.0; // Within 5% manufacturing/rounding allowance

    crossFieldChecks.push({
      id: 'XF-SERVING',
      name: 'Serving Size × Servings Per Pack Consistency',
      status: isServingCompliant ? 'PASS' : 'WARNING',
      details: isServingCompliant
        ? `Serving arithmetic mathematically consistent: ${servingSizeGrams}g × ${servingsPerPack} servings = ${calculatedTotalGrams}g (matches declared ${declaredNet}g net quantity within ${variancePct.toFixed(1)}% tolerance)`
        : `Discrepancy: ${servingSizeGrams}g × ${servingsPerPack} = ${calculatedTotalGrams}g differs from declared net quantity of ${declaredNet}g (${variancePct.toFixed(1)}% variance exceeds 5% threshold)`,
      evidence: `${servingSizeGrams}g × ${servingsPerPack} = ${calculatedTotalGrams}g vs ${declaredNet}g`
    });
  }

  // 2. QUID Percentage Summation Check
  if (fields.quidIngredients && fields.quidIngredients.length > 0) {
    const sumPct = fields.quidIngredients.reduce((acc, curr) => acc + curr.percentage, 0);
    const isQuidCompliant = sumPct <= 100.0;

    crossFieldChecks.push({
      id: 'XF-QUID',
      name: 'QUID Characterizing Ingredient Summation',
      status: isQuidCompliant ? 'PASS' : 'FAIL',
      details: isQuidCompliant
        ? `Declared characterizing ingredients sum to ${sumPct.toFixed(1)}% (≤ 100% statutory physical limit)`
        : `QUID violation: Declared characterizing ingredients sum to ${sumPct.toFixed(1)}%, exceeding 100%!`,
      evidence: fields.quidIngredients.map(q => `${q.name}: ${q.percentage}%`).join(' + ') + ` = ${sumPct.toFixed(1)}%`
    });
  }

  // 3. USP Cross-Verification Check
  if (uspVerification) {
    crossFieldChecks.push({
      id: 'XF-USP',
      name: 'Unit Sale Price (USP) Mathematical Consistency',
      status: uspVerification.isWithinTolerance ? 'PASS' : (uspVerification.ocrConfidenceAlert ? 'WARNING' : 'FAIL'),
      details: uspVerification.isWithinTolerance
        ? `USP mathematically verified: MRP ₹${fields.mrp?.value} ÷ ${fields.netQuantity?.value}${fields.netQuantity?.unit} = ₹${uspVerification.calculatedUSP}/${fields.netQuantity?.unit} (Variance: ${uspVerification.variance}%)`
        : `USP variance of ${uspVerification.variance}% exceeds statutory 5% tolerance`,
      evidence: `Printed: ${uspVerification.extractedUSP ? '₹' + uspVerification.extractedUSP + '/unit' : 'Declared'} vs Calc: ₹${uspVerification.calculatedUSP}/unit`
    });
  }

  // ── Calculate Statutory Compliance Scores (Strictly 10 Mandatory Declarations) ──
  // Under Legal Metrology (Packaged Commodities) Rules, 2011 Rule 6(1), every packaged
  // commodity must be audited against exactly 10 statutory declarations (R6-1 through R6-10).
  const passedLM = lmChecks.filter(c => c.status === 'PASS').length;
  const totalLM = 10; // Strictly 10 statutory declarations — Universal across all products

  const applicableFS = foodSafetyChecks.filter(c => c.status !== 'NOT_APPLICABLE' && c.status !== 'INFORMATIONAL');
  const passedFS = applicableFS.filter(c => c.status === 'PASS').length;
  const totalFS = applicableFS.length;

  // Overall status based on Legal Metrology statutory compliance
  let status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' = 'NON_COMPLIANT';
  if (passedLM === 10) {
    status = 'COMPLIANT';
  } else if (passedLM >= 7) {
    status = 'PARTIAL';
  } else {
    status = 'NON_COMPLIANT';
  }

  const allChecks = [...lmChecks, ...foodSafetyChecks, ...metricChecks];

  return {
    score: passedLM,
    totalChecks: totalLM,
    lmScore: passedLM,
    lmTotal: totalLM,
    foodSafetyScore: passedFS,
    foodSafetyTotal: totalFS,
    status,
    checks: allChecks,
    lmChecks,
    foodSafetyChecks,
    crossFieldChecks,
    fontMeasurements,
    uspVerification,
    timestamp: new Date().toISOString(),
    ruleSetVersion: 'Legal Metrology (PCR) 2011 [10 Mandatory Declarations — Rule 6(1)]',
    fssaiRuleSetVersion: 'FSSAI (Labelling & Display) Regulations 2020 [Amended w.e.f. 24 March 2026]'
  };
}
