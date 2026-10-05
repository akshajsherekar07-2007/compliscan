import { ProductBenchmark, AnomalyVerdict } from './types';

export const NATIONAL_COMMODITY_REGISTRY: Record<string, ProductBenchmark> = {
  '8901491101895': { barcode: '8901491101895', brandName: 'Kurkure Masala Munch', standardNetQuantity: 150, standardUnit: 'g', authorizedStandardMRP: 30, manufacturer: 'PepsiCo India' },
  '8904004400572': { barcode: '8904004400572', brandName: "Haldiram's Aloo Bhujia", standardNetQuantity: 200, standardUnit: 'g', authorizedStandardMRP: 50, manufacturer: 'Haldiram Snacks' },
  '8901719104052': { barcode: '8901719104052', brandName: 'Parle-G Gold Biscuits', standardNetQuantity: 100, standardUnit: 'g', authorizedStandardMRP: 10, manufacturer: 'Parle Products' },
  '8901262010054': { barcode: '8901262010054', brandName: 'Amul Pasteurized Butter', standardNetQuantity: 100, standardUnit: 'g', authorizedStandardMRP: 58, manufacturer: 'GCMMF' },
  '8901058852312': { barcode: '8901058852312', brandName: 'Maggi 2-Minute Noodles', standardNetQuantity: 70, standardUnit: 'g', authorizedStandardMRP: 14, manufacturer: 'Nestle India' },
  '8901058000290': { barcode: '8901058000290', brandName: 'Maggi 2-Minute Noodles (Masala)', standardNetQuantity: 70, standardUnit: 'g', authorizedStandardMRP: 14, manufacturer: 'Nestle India Limited' },
  '8901030383452': { barcode: '8901030383452', brandName: 'Bru Instant Coffee', standardNetQuantity: 50, standardUnit: 'g', authorizedStandardMRP: 95, manufacturer: 'Hindustan Unilever' },
};

export function evaluateAnomalies(barcode: string, scannedMRP: number, scannedQuantity: number): AnomalyVerdict | null {
  const benchmark = NATIONAL_COMMODITY_REGISTRY[barcode];
  if (!benchmark) return null;

  const mrpMarkupPercent = ((scannedMRP - benchmark.authorizedStandardMRP) / benchmark.authorizedStandardMRP) * 100;
  const grammageDeficitPercent = ((benchmark.standardNetQuantity - scannedQuantity) / benchmark.standardNetQuantity) * 100;
  
  const standardPricePerUnit = benchmark.authorizedStandardMRP / benchmark.standardNetQuantity;
  const scannedPricePerUnit = scannedMRP / scannedQuantity;
  
  const effectiveStealthHikePercent = ((scannedPricePerUnit - standardPricePerUnit) / standardPricePerUnit) * 100;

  const isAnomaly = mrpMarkupPercent > 0 || grammageDeficitPercent > 0;

  let narrative = "Product matches national registry benchmarks.";
  if (isAnomaly) {
    if (mrpMarkupPercent > 0 && grammageDeficitPercent > 0) {
      narrative = `Dual-anomaly detected: MRP marked up by ${mrpMarkupPercent.toFixed(1)}% and quantity reduced by ${grammageDeficitPercent.toFixed(1)}%, causing an effective price hike of ${effectiveStealthHikePercent.toFixed(1)}%.`;
    } else if (mrpMarkupPercent > 0) {
      narrative = `MRP markup detected: ${mrpMarkupPercent.toFixed(1)}% higher than authorized benchmark.`;
    } else if (grammageDeficitPercent > 0) {
      narrative = `Shrinkflation detected: Grammage reduced by ${grammageDeficitPercent.toFixed(1)}%, causing an effective price hike of ${effectiveStealthHikePercent.toFixed(1)}%.`;
    }
  }

  return {
    productName: benchmark.brandName,
    isAnomaly,
    mrpMarkupPercent,
    grammageDeficitPercent,
    effectiveStealthHikePercent,
    narrative,
    authorizedMRP: benchmark.authorizedStandardMRP,
    authorizedQuantity: benchmark.standardNetQuantity,
    scannedMRP,
    scannedQuantity
  };
}
