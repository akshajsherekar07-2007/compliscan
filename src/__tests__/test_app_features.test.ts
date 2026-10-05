import { describe, it, expect, beforeEach } from 'vitest';
import { saveScanHistory, loadScanHistory, clearStoredHistory } from '../data/storage';
import { ScanRecord } from '../engine/types';
import { evaluate } from '../engine/RulesEngine';

describe('Storage & Audit Summary Verification', () => {
  const storageMap = new Map<string, string>();

  beforeEach(() => {
    storageMap.clear();
    (globalThis as any).localStorage = {
      getItem: (key: string) => storageMap.get(key) ?? null,
      setItem: (key: string, value: string) => storageMap.set(key, value),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
    };
  });

  it('persists and retrieves scan history with full fidelity', () => {
    const mockRecord: ScanRecord = {
      id: 'test-scan-1',
      createdAt: '2026-10-02T00:00:00.000Z',
      photoDataUrl: 'data:image/jpeg;base64,mockphoto',
      photoDataUrls: ['data:image/jpeg;base64,mockphoto1', 'data:image/jpeg;base64,mockphoto2'],
      extractedFields: {
        mrp: { value: 150, raw: 'MRP Rs. 150', includesTaxPhrase: true },
        netQuantity: { value: 500, unit: 'g', raw: 'Net Wt. 500g' },
        manufacturingDate: { value: '01/2026', raw: 'MFD 01/2026' },
        expiryDate: { value: '12/2026', raw: 'EXP 12/2026' },
        fssaiLicense: { value: '10012011000168', raw: '10012011000168' },
        unitSalePrice: { value: 0.30, perUnit: 'g', raw: 'Rs. 0.30 / g' },
        consumerPhone: { value: '18001031947', raw: '18001031947' },
        consumerEmail: { value: 'care@brand.com', raw: 'care@brand.com' },
        countryOfOrigin: { value: 'India', raw: 'Made in India' },
        manufacturerName: { value: 'Sample Foods Ltd', raw: 'Sample Foods Ltd' },
        genericName: { value: 'Peanut Butter', raw: 'Peanut Butter' },
      },
      complianceResult: {
        score: 8,
        totalChecks: 8,
        status: 'COMPLIANT',
        checks: [
          {
            id: 'R6-1',
            field: 'Manufacturer Name & Address',
            ruleReference: 'Rule 6(1)(a)',
            status: 'PASS',
            severity: 'CRITICAL',
            extractedValue: 'Sample Foods Ltd',
            details: 'Verified',
          },
        ],
        fontMeasurements: [],
        uspVerification: {
          extractedUSP: 0.30,
          calculatedUSP: 0.30,
          variance: 0,
          isWithinTolerance: true,
          fontRatio: 0.6,
          fontRatioCompliant: true,
        },
        timestamp: '2026-10-02T00:00:00.000Z',
      },
      anomalyVerdict: null,
      evidence: {
        photoHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        photoHashes: ['a1b2c3d4e5f6', 'b2c3d4e5f6a1'],
        latitude: 18.5204,
        longitude: 73.8567,
        locationString: 'Shivajinagar, Pune, Maharashtra',
        timestamp: '2026-10-02T00:00:00.000Z',
        deviceInfo: 'Mozilla/5.0 Inspector Terminal',
        officerId: 'Insp. LM-MH-4091',
      },
      rawOcrText: 'MRP Rs. 150 Net Wt. 500g Peanut Butter',
      barcodeValue: '8901262010054',
    };

    saveScanHistory([mockRecord]);
    const loaded = loadScanHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('test-scan-1');
    expect(loaded[0].extractedFields.genericName?.value).toBe('Peanut Butter');
    expect(loaded[0].evidence.officerId).toBe('Insp. LM-MH-4091');

    clearStoredHistory();
    expect(loadScanHistory()).toHaveLength(0);
  });

  it('correctly grants PASS under Rule 6(11) Second Proviso for <=10g sachets', () => {
    const sachetFields: any = {
      mrp: { value: 5, raw: 'MRP Rs. 5', includesTaxPhrase: true },
      netQuantity: { value: 5, unit: 'g', raw: 'Net 5g' },
      manufacturingDate: { value: '08/2026', raw: '08/2026' },
      expiryDate: { value: '08/2027', raw: '08/2027' },
      fssaiLicense: { value: '10012011000168', raw: '10012011000168' },
      unitSalePrice: null, // Sachet doesn't have USP printed
      consumerPhone: { value: '18001031947', raw: '18001031947' },
      consumerEmail: null,
      countryOfOrigin: { value: 'India', raw: 'India', isImported: false },
      manufacturerName: { value: 'Instant Coffee Ltd', raw: 'Instant Coffee Ltd', isDomestic: true },
      genericName: { value: 'Instant Coffee', raw: 'Instant Coffee' },
    };

    const result = evaluate(sachetFields, null, []);
    const uspCheck = result.checks.find((c: any) => c.id === 'R6-8');
    expect(uspCheck).toBeDefined();
    expect(uspCheck?.status).toBe('PASS');
    expect(uspCheck?.details).toContain('Rule 6(11) Second Proviso');
  });
});
