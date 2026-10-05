import { describe, it, expect } from 'vitest';
import { extractFields, fuseExtractedFields } from '../engine/ExtractionEngine';
import { evaluate } from '../engine/RulesEngine';
import { calibrate } from '../engine/GS1Calibrator';

describe('MyFitness Peanut Butter Container Forensic Audit (User Images)', () => {
  // Angle 1: Back Panel OCR (Manufacturer/Marketer, Dates, MRP/USP stamping, FSSAI licenses)
  const backPanelOcrText = `
    MRKETED BY:
    MYFITNESS ENTERPRISES PRIVATE LIMITED
    Plot No. 104, Industrial Area, Vadodara, Gujarat - 390010, India.
    Lic. No. 10824999000152
    MANUFACTURED BY:
    (NF) Nature Food Industries, Plot No. 12, GIDC, Anand, Gujarat - 388001. Lic. No. 10015021001816
    (TS) Top Spread Foods, Plot No. 88, Sector 3, Sanand, Gujarat - 382110. Lic. No. 10722999001593
    For Customer Care:
    Call: 1800 200 4567 | Email: care@myfitness.in
    Netty. : 510g
    MFD. © 11.07.2024
    Expiry P 10.07. 2025
    Batch No. : MF2407P
    MRP/USP ₹ : ₹319.00(₹0.63/g)
    (Inclusive of all taxes)
  `;

  // Angle 2: Side Panel OCR (Ingredients, Nutrition, Allergens, Statutory Commodity Name)
  const sidePanelOcrText = `
    INGREDIENTS: Roasted Peanuts (81%), Dark Chocolate (10%),
    Sugar, Rice Crisps (2%), Salt, Stabilizer (INS 471)
    Allergen Info: Contain Peanuts & Soya
    PEANUT BUTTER (Proprietary Food- 4.2.2.5 Spreads)
    (Serving Size: 32g) (Serving Per Pack 16)
    100% VEGETARIAN
    NUTRITIONAL INFORMATION PER32g PER100g
    Energy (kcal) 180 562.5
    Protein (g) 7.7 24
    Total Carbohydrates (g) 8.9 27.8
    Total Sugars (g) 3.5 10.9
    Added Sugars (g) 3.1 9.7
    Dietary Fiber (g) 1.6 5.0
    Total Fat (g) 12.8 40
    Saturated Fat (g) 3.2 10.0
    Trans Fat (g) 0.0 0.0
    Cholesterol (mg) 0.0 0.0
    Sodium (mg) 64.0 200
    Store in a cool, dry and hygienic place. Oil separation is natural, stir well before use.
  `;

  it('Point 1 Fix: Statutory Generic Commodity Name "Peanut Butter" extracted as PASS (was false FAIL)', () => {
    const sideFields = extractFields(sidePanelOcrText, []);
    expect(sideFields.genericName).not.toBeNull();
    expect(sideFields.genericName?.value).toBe('Peanut Butter');
    expect(sideFields.genericName?.confidence).toBeGreaterThanOrEqual(0.90);
  });

  it('Point 2 & 6 Fix: Combined "MRP/USP ₹ : ₹319.00(₹0.63/g)" extracts both MRP and USP accurately', () => {
    const backFields = extractFields(backPanelOcrText, []);
    expect(backFields.mrp).not.toBeNull();
    expect(backFields.mrp?.value).toBe(319.00);
    expect(backFields.unitSalePrice).not.toBeNull();
    expect(backFields.unitSalePrice?.value).toBe(0.63);
    expect(backFields.unitSalePrice?.perUnit).toBe('g');
  });

  it('Point 2 Fix: Mathematical USP verification passes for 510g (319 / 510 = 0.6255 ≈ 0.63/g)', () => {
    const backFields = extractFields(backPanelOcrText, []);
    const compliance = evaluate(backFields, null, []);
    
    expect(compliance.uspVerification).not.toBeNull();
    expect(compliance.uspVerification?.isWithinTolerance).toBe(true);
    expect(compliance.uspVerification?.variance).toBeLessThan(2.0); // Less than 1% rounding variance

    const mathCheck = compliance.checks.find(c => c.id === 'R6-11-Math');
    expect(mathCheck?.status).toBe('PASS');
    expect(mathCheck?.extractedValue).toContain('0.63');
  });

  it('Point 3 Fix: Rule 7 Font Height flags WARNING instead of false FAIL when uncalibrated', () => {
    const fusedFields = fuseExtractedFields([
      extractFields(backPanelOcrText, []),
      extractFields(sidePanelOcrText, [])
    ]);

    // Barcode detected from OCR pattern with estimated calibration (isEstimated = true)
    const estimatedCalibration = calibrate(280, 1.0, true);
    expect(estimatedCalibration.isEstimated).toBe(true);

    const compliance = evaluate(fusedFields, estimatedCalibration, []);
    const r7Check = compliance.checks.find(c => c.id === 'R7-1');
    expect(r7Check).toBeDefined();
    // Must be WARNING, never a false FAIL on uncalibrated images!
    expect(r7Check?.status).toBe('WARNING');
    expect(r7Check?.details).toContain('Physical metric scale unavailable without verified optical calibration');
  });

  it('Point 4 Fix: Manufacturer and Marketer parsed distinctly', () => {
    const backFields = extractFields(backPanelOcrText, []);
    expect(backFields.marketerName).not.toBeNull();
    expect(backFields.marketerName?.value).toContain('MYFITNESS ENTERPRISES');
    expect(backFields.manufacturerName).not.toBeNull();
    expect(backFields.manufacturerName?.value).toContain('Nature Food Industries');
  });

  it('Point 5 & 7 Fix: Dot-separated date format extracted cleanly (11.07.2024 and 10.07.2025)', () => {
    const backFields = extractFields(backPanelOcrText, []);
    expect(backFields.manufacturingDate?.value).toContain('11.07.2024');
    expect(backFields.expiryDate?.value).toContain('10.07.2025');
  });

  it('Point 10 Fix: Multiple FSSAI Licenses detected across marketer and manufacturing units', () => {
    const backFields = extractFields(backPanelOcrText, []);
    expect(backFields.fssaiLicenses).toBeDefined();
    expect(backFields.fssaiLicenses?.length).toBeGreaterThanOrEqual(3);
    expect(backFields.fssaiLicenses).toContain('10824999000152'); // Marketer
    expect(backFields.fssaiLicenses).toContain('10015021001816'); // Mfg Unit 1
    expect(backFields.fssaiLicenses).toContain('10722999001593'); // Mfg Unit 2
  });

  it('Point 8 Fix: Expanded 10-Point FSSAI Food Labelling Audit passes with rich evidence', () => {
    const fusedFields = fuseExtractedFields([
      extractFields(backPanelOcrText, []),
      extractFields(sidePanelOcrText, [])
    ]);

    const compliance = evaluate(fusedFields, null, []);
    const fsChecks = compliance.foodSafetyChecks || [];
    expect(fsChecks.length).toBe(10);

    // Verify key statutory checks
    const fs1 = fsChecks.find(c => c.id === 'FS-1');
    expect(fs1?.status).toBe('PASS');
    expect(fs1?.extractedValue).toContain('10824999000152');

    const fs2 = fsChecks.find(c => c.id === 'FS-2');
    expect(fs2?.status).toBe('PASS');
    expect(fs2?.extractedValue).toBe('Peanut Butter');

    const fs3 = fsChecks.find(c => c.id === 'FS-3');
    expect(fs3?.status).toBe('PASS');

    const fs4 = fsChecks.find(c => c.id === 'FS-4');
    expect(fs4?.status).toBe('PASS');
    expect(fs4?.extractedValue).toContain('Roasted Peanuts');

    const fs5 = fsChecks.find(c => c.id === 'FS-5');
    expect(fs5?.status).toBe('PASS');

    const fs6 = fsChecks.find(c => c.id === 'FS-6');
    expect(fs6?.status).toBe('PASS');
    expect(fs6?.extractedValue).toContain('Vegetarian');

    const fs7 = fsChecks.find(c => c.id === 'FS-7');
    expect(fs7?.status).toBe('PASS');

    const fs8 = fsChecks.find(c => c.id === 'FS-8');
    expect(fs8?.status).toBe('PASS');

    const fs9 = fsChecks.find(c => c.id === 'FS-9');
    expect(fs9?.status).toBe('PASS');

    const fs10 = fsChecks.find(c => c.id === 'FS-10');
    expect(fs10?.status).toBe('PASS');
  });

  it('Point 9 Fix: Deterministic Cross-Field Consistency Checks (Serving Size math & QUID summation)', () => {
    const fusedFields = fuseExtractedFields([
      extractFields(backPanelOcrText, []),
      extractFields(sidePanelOcrText, [])
    ]);

    const compliance = evaluate(fusedFields, null, []);
    expect(compliance.crossFieldChecks).toBeDefined();
    expect(compliance.crossFieldChecks?.length).toBeGreaterThanOrEqual(2);

    // Check 1: Serving Size arithmetic: 32g × 16 = 512g vs declared 510g net quantity
    const servingCheck = compliance.crossFieldChecks?.find(c => c.id === 'XF-SERVING');
    expect(servingCheck).toBeDefined();
    expect(servingCheck?.status).toBe('PASS');
    expect(servingCheck?.details).toContain('512g');
    expect(servingCheck?.details).toContain('510g');

    // Check 2: QUID Summation: 81% (Peanuts) + 10% (Chocolate) + 2% (Crisps) = 93% ≤ 100%
    const quidCheck = compliance.crossFieldChecks?.find(c => c.id === 'XF-QUID');
    expect(quidCheck).toBeDefined();
    expect(quidCheck?.status).toBe('PASS');
    expect(quidCheck?.details).toContain('93.0%');

    // Check 3: USP Cross-Verification
    const uspCheck = compliance.crossFieldChecks?.find(c => c.id === 'XF-USP');
    expect(uspCheck).toBeDefined();
    expect(uspCheck?.status).toBe('PASS');
  });

  it('Point 11 Fix: Country of Origin correctly marked NOT_APPLICABLE with Indian manufacture proof', () => {
    const fusedFields = fuseExtractedFields([
      extractFields(backPanelOcrText, []),
      extractFields(sidePanelOcrText, [])
    ]);

    const compliance = evaluate(fusedFields, null, []);
    const cooCheck = compliance.checks.find(c => c.id === 'R6-2');
    expect(cooCheck?.status).toBe('PASS');
    expect(cooCheck?.details).toContain('Domestic Indian origin verified');
  });

  it('End-to-End Fusion: Zero-Order multi-panel synthesis produces 100% COMPLIANT product verdict', () => {
    const fusedFields = fuseExtractedFields([
      extractFields(backPanelOcrText, []),
      extractFields(sidePanelOcrText, [])
    ]);

    const compliance = evaluate(fusedFields, null, []);
    expect(compliance.status).toBe('COMPLIANT');
    expect(compliance.lmScore).toBe(10);
    expect(compliance.lmTotal).toBe(10);
    expect(compliance.foodSafetyScore).toBe(compliance.foodSafetyTotal);
  });
});
