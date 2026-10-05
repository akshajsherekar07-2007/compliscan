import { describe, it, expect } from 'vitest';
import { evaluate } from '../engine/RulesEngine';
import { ExtractedFields } from '../engine/types';

describe('RulesEngine — Legal Metrology Statutory Evaluation', () => {
  it('awards COMPLIANT status when all applicable mandatory fields are detected', () => {
    const fields: ExtractedFields = {
      mrp: { value: 14, raw: 'MRP ₹14.00 (incl. of all taxes)', includesTaxPhrase: true },
      netQuantity: { value: 70, unit: 'g', raw: 'NET QUANTITY: 70 g' },
      manufacturingDate: { value: '08/2026', raw: 'MFD: 08/2026' },
      expiryDate: { value: '05/2027', raw: 'USE BY: 05/2027' },
      fssaiLicense: { value: '10012011000168', raw: 'Lic. No. 10012011000168' },
      unitSalePrice: { value: 0.20, perUnit: 'g', raw: 'USP ₹0.20/g' },
      consumerPhone: { value: '18001031947', raw: '1800 103 1947' },
      consumerEmail: { value: 'wecare@in.nestle.com', raw: 'wecare@in.nestle.com' },
      countryOfOrigin: { value: 'India', raw: 'India', isImported: false },
      manufacturerName: { value: 'Nestlé India Limited', raw: 'Nestlé India Limited', isDomestic: true },
      genericName: { value: 'Instant Noodles', raw: 'Instant Noodles' },
    };

    const result = evaluate(fields, null, []);
    expect(result.status).toBe('COMPLIANT');
    expect(result.lmScore).toBe(10);
    expect(result.lmTotal).toBe(10);
    expect(result.totalChecks).toBe(10);

    // Verify Country of Origin is correctly marked PASS for domestic Indian commodities
    const cooCheck = result.checks.find(c => c.id === 'R6-2');
    expect(cooCheck?.status).toBe('PASS');
    expect(cooCheck?.details).toContain('Domestic Indian origin verified');

    // Verify manufacturing date marks PASS
    const mfgCheck = result.checks.find(c => c.id === 'R6-5');
    expect(mfgCheck?.status).toBe('PASS');

    // Verify FSSAI is categorized under FOOD_SAFETY
    const fssaiCheck = result.checks.find(c => c.id === 'FS-1');
    expect(fssaiCheck?.category).toBe('FOOD_SAFETY');
    expect(fssaiCheck?.status).toBe('PASS');
  });

  it('detects violations and flags non-compliance when critical fields are missing', () => {
    const fields: ExtractedFields = {
      mrp: null, // Critical missing!
      netQuantity: { value: 70, unit: 'g', raw: 'NET QUANTITY: 70 g' },
      manufacturingDate: null,
      expiryDate: null,
      fssaiLicense: null,
      unitSalePrice: null,
      consumerPhone: null,
      consumerEmail: null,
      countryOfOrigin: null,
      manufacturerName: null, // Critical missing!
      genericName: null, // Major missing!
    };

    const result = evaluate(fields, null, []);
    expect(result.status).toBe('NON_COMPLIANT');
    
    const mrpCheck = result.checks.find(c => c.id === 'R6-7');
    expect(mrpCheck?.status).toBe('FAIL');

    const mfrCheck = result.checks.find(c => c.id === 'R6-1');
    expect(mfrCheck?.status).toBe('FAIL');
  });

  it('validates USP calculation mathematical tolerance (±5%)', () => {
    const fields: ExtractedFields = {
      mrp: { value: 50, raw: 'MRP ₹50.00', includesTaxPhrase: true },
      netQuantity: { value: 200, unit: 'g', raw: '200g' },
      manufacturingDate: null,
      expiryDate: null,
      fssaiLicense: null,
      // Expected USP: 50 / 200 = 0.25
      unitSalePrice: { value: 0.25, perUnit: 'g', raw: '₹0.25/g' },
      consumerPhone: null,
      consumerEmail: null,
      countryOfOrigin: null,
      manufacturerName: null,
      genericName: null,
    };

    const result = evaluate(fields, null, []);
    expect(result.uspVerification).not.toBeNull();
    expect(result.uspVerification?.calculatedUSP).toBe(0.25);
    expect(result.uspVerification?.isWithinTolerance).toBe(true);

    const mathCheck = result.checks.find(c => c.id === 'R6-11-Math');
    expect(mathCheck?.status).toBe('PASS');
  });

  it('flags OCR confidence warning when Net Quantity extraction is low confidence', () => {
    const fields: ExtractedFields = {
      mrp: { value: 50, raw: 'MRP ₹50.00', includesTaxPhrase: true },
      // Low confidence OCR extraction (e.g. 55%)
      netQuantity: { value: 20, unit: 'g', raw: '20g', confidence: 0.55 },
      manufacturingDate: null,
      expiryDate: null,
      fssaiLicense: null,
      unitSalePrice: { value: 0.50, perUnit: 'g', raw: '₹0.50/g' },
      consumerPhone: null,
      consumerEmail: null,
      countryOfOrigin: null,
      manufacturerName: null,
      genericName: null,
    };

    const result = evaluate(fields, null, []);
    expect(result.uspVerification?.ocrConfidenceAlert).toContain('low OCR confidence');
    
    const mathCheck = result.checks.find(c => c.id === 'R6-11-Math');
    expect(mathCheck?.status).toBe('WARNING');
  });
});
