import { describe, it, expect } from 'vitest';
import { calibrate, measureFontHeight, getMinFontHeight } from '../engine/GS1Calibrator';

describe('GS1Calibrator — Optical Metric Calibration', () => {
  it('calculates accurate scale ratio for nominal 37.29mm EAN-13 barcodes', () => {
    // 373px barcode width / 37.29mm ~ 10.00 px/mm
    const res = calibrate(373, 1.0);
    expect(res.isValid).toBe(true);
    expect(res.scaleRatio).toBeCloseTo(10.002, 1);
  });

  it('rejects barcodes that are too small to provide millimeter accuracy (<50px)', () => {
    const res = calibrate(40, 1.0);
    expect(res.isValid).toBe(false);
    expect(res.rejectionReason).toContain('too small');
  });

  it('accurately converts pixel font heights to physical millimeters', () => {
    const cal = calibrate(372.9, 1.0); // 10 px/mm exactly
    // Text bbox height: 20 pixels = 2.0 mm
    const mm = measureFontHeight(20, cal);
    expect(mm).toBeCloseTo(2.0, 1);
  });

  it('verifies Rule 7 Table I statutory font height thresholds', () => {
    // <= 200g requires >= 1.0mm
    expect(getMinFontHeight(70, 'g')).toBe(1.0);
    expect(getMinFontHeight(200, 'g')).toBe(1.0);

    // 200g - 500g requires >= 2.0mm
    expect(getMinFontHeight(250, 'g')).toBe(2.0);
    expect(getMinFontHeight(500, 'g')).toBe(2.0);

    // > 500g requires >= 4.0mm
    expect(getMinFontHeight(1000, 'g')).toBe(4.0);
    expect(getMinFontHeight(1, 'kg')).toBe(4.0);
    expect(getMinFontHeight(1, 'l')).toBe(4.0);
  });
});
