import { describe, it, expect } from 'vitest';
import { extractFields, fuseExtractedFields } from '../engine/ExtractionEngine';
import { evaluate } from '../engine/RulesEngine';

describe('Zero-Order (Permutation Invariant) Multi-Photo Packaging Inspection', () => {
  // Scenario: A real-world packaged commodity (e.g. Britsun Biscuits / Cylindrical Container)
  // where mandatory declarations are physically distributed across 3 distinct packaging angles.

  // Angle A: Front Principal Display Panel (PDP)
  const frontPdpText = `
    BRITSUN DELIGHT
    BISCUITS
    Net Quantity : 200 g
    FSSAI Lic. No. 10018026001234
    100% Vegetarian
  `;

  // Angle B: Back Information Panel
  const backPanelText = `
    Manufactured & Marketed by:
    Sunrise Foods Private Limited,
    Plot No. 12, Sector 6, Industrial Area, Bhopal, Madhya Pradesh - 462010, India.
    For consumer complaints or queries:
    Call: 1800 120 4567 (Toll Free)
    Email: care@sunrisefoods.in
    Visit: www.sunrisefoods.in
    Marketed in accordance with Legal Metrology Rules, 2011.
  `;

  // Angle C: Crimp / Laser-Inkjet Stamped Flap
  const crimpStampText = `
    Batch No. : BF2408A
    Date of Manufacture : 10 AUG 2024
    Best Before : 09 FEB 2025
    MRPX : 40.00 (Inclusive of all taxes)
    Unit Sale Price: X 0.20 perg
  `;

  it('Individual panels alone have missing fields (proving need for multi-angle inspection)', () => {
    const frontFields = extractFields(frontPdpText, []);
    const backFields = extractFields(backPanelText, []);
    const crimpFields = extractFields(crimpStampText, []);

    // Front has Generic Name & Net Qty, but lacks MRP & Manufacturer
    expect(frontFields.genericName?.value).toBe('Biscuits');
    expect(frontFields.netQuantity?.value).toBe(200);
    expect(frontFields.mrp).toBeNull();
    expect(frontFields.manufacturerName).toBeNull();

    // Back has Manufacturer & Consumer Care, but lacks MRP & Net Qty
    expect(backFields.manufacturerName?.value).toContain('Sunrise Foods');
    expect(backFields.consumerPhone?.value).toBe('18001204567');
    expect(backFields.mrp).toBeNull();
    expect(backFields.netQuantity).toBeNull();

    // Crimp has MRP & USP & Dates, but lacks Generic Name & Manufacturer
    expect(crimpFields.mrp?.value).toBe(40.00);
    expect(crimpFields.unitSalePrice?.value).toBe(0.20);
    expect(crimpFields.genericName).toBeNull();
    expect(crimpFields.manufacturerName).toBeNull();
  });

  it('Zero-Order Property: Order [Front, Back, Crimp] produces complete compliant verdict', () => {
    const fieldsA = extractFields(frontPdpText, []);
    const fieldsB = extractFields(backPanelText, []);
    const fieldsC = extractFields(crimpStampText, []);

    const fusedOrder1 = fuseExtractedFields([fieldsA, fieldsB, fieldsC]);

    expect(fusedOrder1.genericName?.value).toBe('Biscuits');
    expect(fusedOrder1.netQuantity?.value).toBe(200);
    expect(fusedOrder1.manufacturerName?.value).toContain('Sunrise Foods');
    expect(fusedOrder1.mrp?.value).toBe(40.00);
    expect(fusedOrder1.unitSalePrice?.value).toBe(0.20);
    expect(fusedOrder1.manufacturingDate?.value).toContain('10 AUG 2024');
    expect(fusedOrder1.expiryDate?.value).toContain('09 FEB 2025');
    expect(fusedOrder1.consumerPhone?.value).toBe('18001204567');
    expect(fusedOrder1.fssaiLicense?.value).toBe('10018026001234');

    const result = evaluate(fusedOrder1, null, []);
    expect(result.status).toBe('COMPLIANT');
    expect(result.lmScore).toBe(10); // All 10 statutory Rule 6 declarations pass!
    expect(result.lmTotal).toBe(10);
  });

  it('Zero-Order Commutativity: Permutation [Crimp, Front, Back] produces IDENTICAL result', () => {
    const fieldsA = extractFields(frontPdpText, []);
    const fieldsB = extractFields(backPanelText, []);
    const fieldsC = extractFields(crimpStampText, []);

    const fusedOrder1 = fuseExtractedFields([fieldsA, fieldsB, fieldsC]);
    const fusedOrder2 = fuseExtractedFields([fieldsC, fieldsA, fieldsB]);
    const fusedOrder3 = fuseExtractedFields([fieldsB, fieldsC, fieldsA]);

    // Test exact field equivalence across all permutations
    expect(fusedOrder2.mrp?.value).toBe(fusedOrder1.mrp?.value);
    expect(fusedOrder2.netQuantity?.value).toBe(fusedOrder1.netQuantity?.value);
    expect(fusedOrder2.genericName?.value).toBe(fusedOrder1.genericName?.value);
    expect(fusedOrder2.unitSalePrice?.value).toBe(fusedOrder1.unitSalePrice?.value);
    expect(fusedOrder2.manufacturerName?.value).toBe(fusedOrder1.manufacturerName?.value);

    expect(fusedOrder3.mrp?.value).toBe(fusedOrder1.mrp?.value);
    expect(fusedOrder3.netQuantity?.value).toBe(fusedOrder1.netQuantity?.value);
    expect(fusedOrder3.genericName?.value).toBe(fusedOrder1.genericName?.value);

    // Rule evaluation scores must be identical
    const result1 = evaluate(fusedOrder1, null, []);
    const result2 = evaluate(fusedOrder2, null, []);
    const result3 = evaluate(fusedOrder3, null, []);

    expect(result2.status).toBe(result1.status);
    expect(result2.lmScore).toBe(result1.lmScore);
    expect(result3.status).toBe(result1.status);
    expect(result3.lmScore).toBe(result1.lmScore);
  });

  it('Confidence-Weighted Resolution: Clean MRP overrules noisy/zero MRP candidate in other angle', () => {
    const noisyAngle = extractFields('1. Maximum Retail Price (MRP) inclusive of all taxes.', []);
    const cleanAngle = extractFields('Net Quantity: 100g | MRP: 50.00 | Unit Sale Price: 0.50/g', []);

    // Even if noisy angle is processed first, clean angle with positive value wins
    const fused = fuseExtractedFields([noisyAngle, cleanAngle]);
    expect(fused.mrp?.value).toBe(50.00);
    expect(fused.mrp?.confidence).toBeGreaterThan(0.8);
  });
});
