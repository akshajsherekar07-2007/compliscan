import { describe, it, expect } from 'vitest';
import { extractFields } from '../engine/ExtractionEngine';
import { evaluate } from '../engine/RulesEngine';

describe('Universal Compliance Engine — Cross-Product Verification', () => {
  it('Universally audits Non-Food Commodity (e.g. Detergent Powder) without product-specific rules', () => {
    // Non-food FMCG: No FSSAI license, no food claims
    const detergentOcr = `
      Manufactured & Marketed by:
      CleanCare FMCG Private Limited,
      Plot No. 88, GIDC Industrial Estate,
      Vadodara, Gujarat - 390010, India.
      Generic Name: Detergent Powder
      Net Quantity: 1 kg
      Date of Manufacture: 12/2024
      MRP: ₹140.00 (Inclusive of all taxes)
      Unit Sale Price: ₹140.00 per kg
      Consumer Care: 1800 220 9999
      Email: support@cleancare.in
    `;

    const fields = extractFields(detergentOcr, []);
    const result = evaluate(fields, null, []);

    // 1. Mandatory Legal Metrology declarations
    expect(fields.genericName?.value).toBe('Detergent Powder');
    expect(fields.netQuantity?.value).toBe(1);
    expect(fields.netQuantity?.unit).toBe('kg');
    expect(fields.mrp?.value).toBe(140);
    expect(fields.unitSalePrice?.value).toBe(140);
    expect(fields.manufacturingDate?.value).toBe('12/2024');

    // 2. Non-food Rule 6(1)(d) strictly PASS (mandatory MFD, not exempted)
    const mfdCheck = result.checks.find(c => c.id === 'R6-5');
    expect(mfdCheck?.status).toBe('PASS');
    expect(mfdCheck?.ruleReference).toBe('Rule 6(1)(d)');

    // 3. FSSAI food checks are NOT triggered on non-food
    const fssaiChecks = result.checks.filter(c => c.category === 'FOOD_SAFETY');
    expect(fssaiChecks.length).toBe(0);

    // 4. USP verification is mathematically exact: 140 / 1 = 140
    expect(result.uspVerification?.isWithinTolerance).toBe(true);
    expect(result.uspVerification?.calculatedUSP).toBe(140);

    // 5. Overall Legal Metrology status
    expect(result.status).toBe('COMPLIANT');
  });

  it('Universally audits Breakfast Cereal / Oats without product-specific hacks', () => {
    const oatsOcr = `
      Rolled Oats
      Manufactured by: GreenFields Agri Foods Ltd,
      Sector 14, Food Park, Pantnagar, Uttarakhand - 263153, India.
      Net Quantity: 500 g
      MRP: ₹125.00 (inclusive of all taxes)
      Unit Sale Price: ₹0.25 / g
      MFD: 01/2025
      Best Before: 12 MONTHS
      Lic. No. 10019022004567
      Call: 1800 111 2222
      care@greenfields.in
      INGREDIENTS: 100% Whole Grain Rolled Oats
      NUTRITIONAL INFORMATION Per 100g Energy 389 kcal
      100% VEGETARIAN
    `;

    const fields = extractFields(oatsOcr, []);
    const result = evaluate(fields, null, []);

    expect(fields.genericName?.value).toBe('Rolled Oats');
    expect(fields.netQuantity?.value).toBe(500);
    expect(fields.mrp?.value).toBe(125);
    expect(fields.unitSalePrice?.value).toBe(0.25);
    expect(fields.fssaiLicense?.value).toBe('10019022004567');

    // Food commodity correctly triggers FSSAI audit universally
    const fssaiChecks = result.checks.filter(c => c.category === 'FOOD_SAFETY');
    expect(fssaiChecks.length).toBeGreaterThan(0);

    // Math: 125 / 500 = 0.25
    expect(result.uspVerification?.calculatedUSP).toBe(0.25);
    expect(result.uspVerification?.isWithinTolerance).toBe(true);
    expect(result.status).toBe('COMPLIANT');
  });

  it('Universally audits Imported Packaged Commodity (mandating Country of Origin)', () => {
    const importedOcr = `
      Country of Origin: Switzerland
      Imported and Marketed by:
      Alpine Imports Private Limited,
      Andheri East, Mumbai, Maharashtra - 400069, India.
      Generic Name: Dark Chocolate
      Net Weight: 100 g
      MRP: ₹250.00 (inclusive of all taxes)
      Unit Sale Price: ₹2.50 per g
      Best Before: 30.12.2025
      Lic. No. 10015022000888
      Consumer Helpline: 022-28490000
      customercare@alpineimports.in
      INGREDIENTS: Cocoa Mass, Sugar, Cocoa Butter (55%)
    `;

    const fields = extractFields(importedOcr, []);
    const result = evaluate(fields, null, []);

    expect(fields.countryOfOrigin?.isImported).toBe(true);
    expect(fields.countryOfOrigin?.value).toBe('Switzerland');

    const cooCheck = result.checks.find(c => c.id === 'R6-2');
    expect(cooCheck?.status).toBe('PASS');
    expect(cooCheck?.details).toContain('Switzerland');
  });

  it('Universally flags missing mandatory declarations on ANY product', () => {
    // A defective label missing Net Qty and USP
    const defectiveOcr = `
      Manufactured by: Apex Products Ltd, Delhi - 110020
      Generic Name: Bathing Bar
      MRP: ₹45.00
      Date of Manufacture: 05/2024
      Consumer Care: 1800 000 1111
    `;

    const fields = extractFields(defectiveOcr, []);
    const result = evaluate(fields, null, []);

    // Net Quantity missing
    const netQtyCheck = result.checks.find(c => c.id === 'R6-4');
    expect(netQtyCheck?.status).toBe('FAIL');

    // USP missing
    const uspCheck = result.checks.find(c => c.id === 'R6-8');
    expect(uspCheck?.status).toBe('FAIL');

    // Must be NON_COMPLIANT or PARTIAL
    expect(result.status).not.toBe('COMPLIANT');
  });
});
