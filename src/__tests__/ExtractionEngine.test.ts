import { describe, it, expect } from 'vitest';
import { extractFields, preprocessText } from '../engine/ExtractionEngine';

describe('ExtractionEngine — Preprocessing & Regex Parsers', () => {
  it('normalizes whitespace and Unicode characters', () => {
    const raw = '  M.R.P.   Rs.   50.00 \n\n (incl.  of all  taxes) ';
    const clean = preprocessText(raw);
    expect(clean).toBe('M.R.P. Rs. 50.00 (incl. of all taxes)');
  });

  it('correctly extracts Net Quantity from standard and edge-case packaging text', () => {
    // Maggi pattern
    const text1 = 'NET QUANTITY: 70 g';
    const res1 = extractFields(text1, []);
    expect(res1.netQuantity).not.toBeNull();
    expect(res1.netQuantity?.value).toBe(70);
    expect(res1.netQuantity?.unit).toBe('g');

    // Kurkure / Namkeen pattern
    const text2 = 'Net Wt. 150g';
    const res2 = extractFields(text2, []);
    expect(res2.netQuantity?.value).toBe(150);
    expect(res2.netQuantity?.unit).toBe('g');

    // Beverage / Liquid pattern
    const text3 = 'Net Quantity: 500 ml';
    const res3 = extractFields(text3, []);
    expect(res3.netQuantity?.value).toBe(500);
    expect(res3.netQuantity?.unit).toBe('ml');

    // Kilogram / Litre pattern
    const text4 = 'NET WT: 1 kg';
    const res4 = extractFields(text4, []);
    expect(res4.netQuantity?.value).toBe(1);
    expect(res4.netQuantity?.unit).toBe('kg');
  });

  it('extracts MRP with inclusive tax phrases', () => {
    const text1 = 'MRP ₹30.00 (incl. of all taxes)';
    const res1 = extractFields(text1, []);
    expect(res1.mrp).not.toBeNull();
    expect(res1.mrp?.value).toBe(30);
    expect(res1.mrp?.includesTaxPhrase).toBe(true);

    // Stamped on side panel declaration
    const text2 = 'See side panel for: MRP ₹ (incl. of all taxes): Lot No.: MFD.';
    const res2 = extractFields(text2, []);
    expect(res2.mrp).not.toBeNull();
    expect(res2.mrp?.includesTaxPhrase).toBe(true);
  });

  it('extracts FSSAI 14-digit central license numbers', () => {
    const text1 = 'Lic. No. 10012011000168';
    const res1 = extractFields(text1, []);
    expect(res1.fssaiLicense).not.toBeNull();
    expect(res1.fssaiLicense?.value).toBe('10012011000168');

    const text2 = 'fssai Lic No: 11523019000123';
    const res2 = extractFields(text2, []);
    expect(res2.fssaiLicense?.value).toBe('11523019000123');
  });

  it('extracts Consumer Care toll-free numbers and email addresses', () => {
    const text = 'CONSUMER CARE: 1800 103 1947 WECARE@IN.NESTLE.COM NEW DELHI-110001';
    const res = extractFields(text, []);
    expect(res.consumerPhone?.value).toContain('18001031947');
    expect(res.consumerEmail?.value).toBe('wecare@in.nestle.com');
    expect(res.countryOfOrigin?.value).toBe('India');
  });

  it('recognizes generic commodity names on packaging', () => {
    const text = 'Instant Noodles with Seasoning';
    const res = extractFields(text, []);
    expect(res.genericName?.value).toBe('Instant Noodles with Seasoning');
  });

  it('robustly extracts integer MRPs across diverse packaging patterns', () => {
    // 1. Integer price with ₹ symbol
    const res1 = extractFields('MRP ₹ 20 (incl. of all taxes) Net Qty: 50g', []);
    expect(res1.mrp).not.toBeNull();
    expect(res1.mrp?.value).toBe(20);
    expect(res1.mrp?.includesTaxPhrase).toBe(true);

    // 2. Integer price with Rs. and /- suffix
    const res2 = extractFields('MRP Rs. 10/- (Inclusive of all taxes) Net Wt: 25g', []);
    expect(res2.mrp).not.toBeNull();
    expect(res2.mrp?.value).toBe(10);

    // 3. Tax phrase before integer price
    const res3 = extractFields('MRP (INCL. OF ALL TAXES) : Rs. 25 Net Qty: 100g', []);
    expect(res3.mrp).not.toBeNull();
    expect(res3.mrp?.value).toBe(25);

    // 4. Spaced M R P tokens with colon
    const res4 = extractFields('M R P : Rs. 40 (Incl. of all taxes) Net Weight: 200g', []);
    expect(res4.mrp).not.toBeNull();
    expect(res4.mrp?.value).toBe(40);

    // 5. MAX. RETAIL PRICE header with integer price
    const res5 = extractFields('MAX. RETAIL PRICE RS. 50 (INCL. OF ALL TAXES)', []);
    expect(res5.mrp).not.toBeNull();
    expect(res5.mrp?.value).toBe(50);
  });

  it('robustly extracts standalone and unit-denominated Unit Sale Prices (USP)', () => {
    // 1. Prefix USP with currency
    const res1 = extractFields('USP ₹ 0.40/g Net Qty: 50g', []);
    expect(res1.unitSalePrice).not.toBeNull();
    expect(res1.unitSalePrice?.value).toBe(0.40);
    expect(res1.unitSalePrice?.perUnit).toBe('g');

    // 2. Unit Sale Price words with per unit
    const res2 = extractFields('Unit Sale Price: Rs. 0.40 per g Net Wt: 25g', []);
    expect(res2.unitSalePrice).not.toBeNull();
    expect(res2.unitSalePrice?.value).toBe(0.40);
    expect(res2.unitSalePrice?.perUnit).toBe('g');

    // 3. Parenthesized USP
    const res3 = extractFields('MRP ₹40.00 (₹0.20/g) Net Qty: 200g', []);
    expect(res3.unitSalePrice).not.toBeNull();
    expect(res3.unitSalePrice?.value).toBe(0.20);
    expect(res3.unitSalePrice?.perUnit).toBe('g');

    // 4. Per unit / piece USP
    const res4 = extractFields('MRP ₹100.00 Net Qty: 50 N Unit Sale Price: ₹ 2 / unit', []);
    expect(res4.unitSalePrice).not.toBeNull();
    expect(res4.unitSalePrice?.value).toBe(2);
    expect(res4.unitSalePrice?.perUnit).toContain('unit');
  });
});
