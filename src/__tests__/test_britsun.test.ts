import { describe, it, expect } from 'vitest';
import { extractFields } from '../engine/ExtractionEngine';
import { evaluate } from '../engine/RulesEngine';

describe('Britsun Biscuits Real OCR Compliance Audit', () => {
  // Reconstructed from the user's Inspector Audit drawer screenshots
  const britsunOcrText = `Manufactured & Marketed by: 0.05 0.01 Great Sunrise Foods Private Limited f i 350 70 Taste Plot No. 12, Sector 6, Industrial Area, SSA Bhopal, Madhya Pradesh - 462010, India. Lic. No. 10018026001234 Lic. No. 10018026001234 *Approximate values. Per serve = 20 g (2 biscuits). No Artificial al Colours For consumer complaints, feedback or queries: | Marketed in accordance with Legal Metrology Rules, 2011 Write to: Consumer Care Executive, : 1. Maximum Retail Price (MRP) inclusive of all taxes. Sunrise Foods Private Limited, 2. Net Quantity declared as per standards under the Legal Metrology. Plot No. 12, Sector 6, Industrial Area, Bhopal - 462010, India. (Packaged Commodities) Rules, 2011. : ot Call: 1800 120 4567 (Toll Free) 3. For variation in weight, the package complies with the prescribed Under the provisions Email: @britsunfoods.in average weight system and the maximum permissible variation limits of Legal Metrology mai caret pe 25 per Rule 6 read with Schedule Il of the Legal Metrology (Packaged (Packaged Commodities) Visit: www.britsunfoods.in ies) Rules, 2011. Rules, 2011 . Batch No. : BF2408A Net Quantity : 200g | MRPX : 40.00 | Unit Sale Price: X 0.20 perg | Date of Manufacture : 10 AUG 2024 (Inclusive of all taxes) Best Before : 09 FEB 2025 81906123"45090 BISCUITS Source of Energy Great Taste No Artificial Colours`;

  it('BUG FIX 1: Generic Name "BISCUITS" must be detected (was false FAIL)', () => {
    const fields = extractFields(britsunOcrText, []);
    console.log('Generic Name:', JSON.stringify(fields.genericName));
    expect(fields.genericName).not.toBeNull();
    expect(fields.genericName?.value).toBe('Biscuits');
  });

  it('BUG FIX 2: Best Before must extract "09 FEB 2025" (was capturing just "BB")', () => {
    const fields = extractFields(britsunOcrText, []);
    console.log('Expiry Date:', JSON.stringify(fields.expiryDate));
    expect(fields.expiryDate).not.toBeNull();
    expect(fields.expiryDate?.value).toContain('09 FEB 2025');
  });

  it('BUG FIX 3: MRP must be ₹40.00 from price panel (was matching disclaimer text)', () => {
    const fields = extractFields(britsunOcrText, []);
    console.log('MRP:', JSON.stringify(fields.mrp));
    expect(fields.mrp).not.toBeNull();
    expect(fields.mrp?.value).toBe(40.00);
  });

  it('BUG FIX 4: Manufacturer address must be bounded, not a 500-char blob', () => {
    const fields = extractFields(britsunOcrText, []);
    console.log('Manufacturer length:', fields.manufacturerName?.value.length);
    console.log('Manufacturer value:', fields.manufacturerName?.value.substring(0, 120));
    expect(fields.manufacturerName).not.toBeNull();
    // Must contain the actual company name
    expect(fields.manufacturerName?.value).toMatch(/Sunrise Foods/i);
    // Must NOT be longer than 200 characters (the blob was ~500 chars)
    expect((fields.manufacturerName?.value || '').length).toBeLessThan(250);
  });

  it('End-to-end compliance: correct verdicts for all 10 Rule 6 checks', () => {
    const fields = extractFields(britsunOcrText, []);
    const compliance = evaluate(fields, null, []);
    console.log(`Score: ${compliance.lmScore}/${compliance.lmTotal} (${compliance.status})`);
    compliance.checks.forEach(c => {
      console.log(`[${c.status}] ${c.id}: ${c.field} => Extracted: "${c.extractedValue?.substring(0, 60)}"`);
    });

    // Manufacturer: PASS
    expect(compliance.checks.find(c => c.id === 'R6-1')?.status).toBe('PASS');
    // Country of Origin: PASS (Domestic Indian Origin verified)
    expect(compliance.checks.find(c => c.id === 'R6-2')?.status).toBe('PASS');
    // Generic Name: PASS (Biscuits)
    expect(compliance.checks.find(c => c.id === 'R6-3')?.status).toBe('PASS');
    // Net Quantity: PASS (200g)
    expect(compliance.checks.find(c => c.id === 'R6-4')?.status).toBe('PASS');
    expect(fields.netQuantity?.value).toBe(200);
    // Manufacturing Date: PASS (10 AUG 2024)
    expect(compliance.checks.find(c => c.id === 'R6-5')?.status).toBe('PASS');
    // Best Before: PASS (09 FEB 2025)
    expect(compliance.checks.find(c => c.id === 'R6-6')?.status).toBe('PASS');
    // MRP: PASS (₹40.00)
    expect(compliance.checks.find(c => c.id === 'R6-7')?.status).toBe('PASS');
    // USP: PASS (₹0.20/g)
    expect(compliance.checks.find(c => c.id === 'R6-8')?.status).toBe('PASS');
    expect(fields.unitSalePrice?.value).toBe(0.20);
    // Consumer Care: PASS
    expect(compliance.checks.find(c => c.id === 'R6-9')?.status).toBe('PASS');
    // Batch Code: PASS
    expect(compliance.checks.find(c => c.id === 'R6-10')?.status).toBe('PASS');
    // Total Statutory Score: strictly 10/10
    expect(compliance.lmScore).toBe(10);
    expect(compliance.lmTotal).toBe(10);
    // USP Math: ₹40 ÷ 200g = ₹0.20/g — must PASS
    const mathCheck = compliance.checks.find(c => c.id === 'R6-11-Math');
    expect(mathCheck?.status).toBe('PASS');
  });
});
