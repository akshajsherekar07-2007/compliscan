import { CalibrationResult } from './types';

const BARCODE_NOMINAL_WIDTH_MM = 37.29;

export function calibrate(barcodeWidthPx: number, magnificationFactor: number = 1.0, isEstimated: boolean = false): CalibrationResult {
  if (barcodeWidthPx < 50) {
    return {
      scaleRatio: 0,
      barcodeWidthPx,
      barcodeWidthMm: 0,
      magnificationFactor,
      isValid: false,
      rejectionReason: 'Barcode pixel width too small (< 50px)',
      isEstimated,
    };
  }
  
  if (magnificationFactor < 0.80 || magnificationFactor > 2.00) {
    return {
      scaleRatio: 0,
      barcodeWidthPx,
      barcodeWidthMm: 0,
      magnificationFactor,
      isValid: false,
      rejectionReason: 'Magnification factor outside allowed range [0.80, 2.00]',
      isEstimated,
    };
  }

  const scaleRatio = barcodeWidthPx / (BARCODE_NOMINAL_WIDTH_MM * magnificationFactor);

  return {
    scaleRatio,
    barcodeWidthPx,
    barcodeWidthMm: BARCODE_NOMINAL_WIDTH_MM * magnificationFactor,
    magnificationFactor,
    isValid: true,
    isEstimated,
  };
}

export function measureFontHeight(textHeightPx: number, calibration: CalibrationResult): number {
  if (!calibration.isValid || calibration.scaleRatio === 0) return 0;
  return textHeightPx / calibration.scaleRatio;
}

export function getMinFontHeight(netQtyValue: number, netQtyUnit: string): number {
  let valueInBase = netQtyValue;
  const unit = netQtyUnit.toLowerCase();
  if (unit === 'kg' || unit === 'l') {
    valueInBase = netQtyValue * 1000;
  }
  
  if (valueInBase <= 200) return 1.0;
  if (valueInBase <= 500) return 2.0;
  return 4.0;
}
