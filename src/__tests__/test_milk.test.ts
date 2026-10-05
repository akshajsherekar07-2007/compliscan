import { describe, it, expect } from 'vitest';
import { extractFields } from '../engine/ExtractionEngine';

describe('Milk Carton Issue', () => {
  it('extracts bare dates, MRP, USP and Net Qty', () => {
    const text = `40.00(₹0.24/ml)
AA543 "L4" 10:49
04/07/26 31/03/27
select channel
170 ml`;
    
    const result = extractFields(text, []);
    console.log(JSON.stringify(result, null, 2));
    
    expect(result.netQuantity?.value).toBe(170);
    expect(result.manufacturingDate?.value).toBe('04/07/26');
    expect(result.expiryDate?.value).toBe('31/03/27');
    expect(result.mrp?.value).toBe(40);
    expect(result.unitSalePrice?.value).toBe(0.24);
  });
});
