import { describe, it, expect } from 'vitest';
import { extractFields } from '../engine/ExtractionEngine';
import { evaluate } from '../engine/RulesEngine';

describe('Crunchy Bites User Screenshot Text Audit', () => {
  // Exact OCR text from the user's screenshot (Inspector Audit drawer)
  const userScreenshotOcrText = `Manufactured & Marketed by: | | | | Crunchy Bites Foods Private Limited [ssal I Plot No. 45, Food Park, Sector 8, Lic. No. 1018051003245 8, Greater Noida, Uttar Pradesh — 201306, India. | For consumer complaints, feedback or queries: | Write to: Consumer Care Executive, Crunchy Bites Foods Private Limited, | Plot No. 45, Food Park, Sector 8, Greater Noida, Uttar Pradesh — 201306, India. by Call: 1800 102 7788 (Toll Free) HES Email: care@crunchybites.in E Visit: www.crunchybites.in Scan to explo our flavours Marketed in accordance with Legal Metrology Rules, 2011 | | 1. Maximum Retail Price (MRP) inclusive of all taxes. 2. Net Quantity declared as per standards under the Legal Metrology (Packaged Commodities) Rules, 2011. | 3. For variation in weight, the package complies with the prescribed i Per Serve (20 g) i average weight system and the Under 107 | HIE as per Rule 6 read with Schedule II of the Legal Metrology (Packaged Legal Metrology 14 HF Commies) Rules, 2011. Peskaed ormct) Ti vy. Rules, 2011 < Net Quantity: : 100g Total Fat () 50.00 i - MRP 4 - Salted Fat (g) 3 I | (ncisive of all taxes) Sie 4 : - la Unit Sale Price perg : 0.50 bo hoprorimet values_Per seve = 20. Pack contains Batch No. : CBP2407A Date of Manufacture : 15 JUL 2024 8"906123°450789 = = INGREDIENTS: Potatoes (64%), Edible Vegetable Oil (Palmolein Oil), Iodised Sat, Spices & Condiments (Red Chill Powder, Black Pepper, Use By + 14 NOV 2024 ° Garlic Powder, Onion Powder), Acidity Regulator (INS 330), oN Ww Flavour Enhancer (INS 621), Anticaking Agent (INS 551). il co Cn KeepYour OTHER AINS PERMITTED NATURAL AND NATURE IDENTICAL STORE IN A COOL, DRY AND HYGIENIC PLACE. City Clean FLAVORING SUBSTANCES. May contain traces of milk, soy, wheat and mustard. ONCE OPENED, CONSUME IMMEDIATELY.`;

  it('correctly extracts and evaluates Crunchy Bites packaging', () => {
    const fields = extractFields(userScreenshotOcrText, []);

    const compliance = evaluate(fields, null, []);

    // 1. Manufacturer: PASS
    const mfrCheck = compliance.checks.find(c => c.id === 'R6-1');
    expect(mfrCheck?.status).toBe('PASS');

    // 2. Country of Origin: PASS (Domestic Indian origin verified)
    const cooCheck = compliance.checks.find(c => c.id === 'R6-2');
    expect(cooCheck?.status).toBe('PASS');

    // 3. Generic Name: MUST be FAIL because packet lacks generic commodity descriptor
    expect(fields.genericName).toBeNull();
    const genericCheck = compliance.checks.find(c => c.id === 'R6-3');
    expect(genericCheck?.status).toBe('FAIL');

    // 4. Net Quantity: MUST be 100g (NOT 20g!)
    expect(fields.netQuantity?.value).toBe(100);
    expect(fields.netQuantity?.unit).toBe('g');

    // 5. MRP: MUST be 50.00 (NOT 4!)
    expect(fields.mrp?.value).toBe(50.00);

    // 6. Unit Sale Price: 0.50
    expect(fields.unitSalePrice?.value).toBe(0.50);

    // 7. USP Arithmetic Accuracy: PASS (₹50 ÷ 100g = ₹0.50/g)
    const uspMathCheck = compliance.checks.find(c => c.id === 'R6-11-Math');
    expect(uspMathCheck?.status).toBe('PASS');

    // 8. Manufacturing Date: MUST be 15 JUL 2024 and status PASS
    const mfgCheck = compliance.checks.find(c => c.id === 'R6-5');
    expect(mfgCheck?.status).toBe('PASS');
    expect(mfgCheck?.extractedValue).toContain('15 JUL 2024');

    // 9. Consumer Care: Phone & Email
    expect(fields.consumerPhone?.value).toBe('18001027788');
    expect(fields.consumerEmail?.value).toBe('care@crunchybites.in');

    // 10. FSSAI: 1018051003245
    expect(fields.fssaiLicense?.value).toBeTruthy();
  });
});
