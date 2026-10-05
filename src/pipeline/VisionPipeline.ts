/**
 * VisionPipeline.ts — Main orchestrator for the CompliScan scan pipeline.
 * 
 * Pipeline stages:
 *   1. Image Preprocessing (Canvas GPU filters: grayscale, contrast, brightness)
 *   2. Parallel: OCR text extraction (Tesseract.js WASM) + Barcode detection (html5-qrcode)
 *   3. Field extraction (11 stateless regex parsers) + GS1 metric calibration
 *   4. Compliance evaluation (Rule 6 + Rule 7 + USP math + shrinkflation)
 *   5. Evidence packaging (SHA-256 + GPS + timestamp)
 */

import { performOCR } from './OCREngine';
import { scanBarcode } from './BarcodeScanner';
import { preprocessLabelImage } from './Preprocessor';
import { extractFields, fuseExtractedFields } from '../engine/ExtractionEngine';
import { calibrate } from '../engine/GS1Calibrator';
import { evaluate } from '../engine/RulesEngine';
import { evaluateAnomalies } from '../engine/CommodityRegistry';
import { createEvidencePackage } from '../services/EvidencePackager';
import { ScanRecord, CalibrationResult, BarcodeResult, TextBlock } from '../engine/types';
import { safeRandomUUID } from '../utils/crypto';

export type PipelineStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface PipelineCallbacks {
  onStageChange: (stage: PipelineStage) => void;
}

export async function runPipeline(
  imageInput: string | string[],
  callbacks: PipelineCallbacks
): Promise<ScanRecord> {
  const imageList = Array.isArray(imageInput) ? imageInput : [imageInput];

  // ── Stage 1: Packaging-Optimized Preprocessing & Curved Dewarping ─
  callbacks.onStageChange(1);
  const processedImages = await Promise.all(
    imageList.map(img => preprocessLabelImage(img, {
      maxDimension: 2400,
      enhanceContrast: true,
      dewarpCylindrical: true, // Cylindrical dewarping for curved packaging (jars, bottles, cans)
      suppressGlare: true,     // Specular glare suppression on glossy curved packaging
    }))
  );
  
  // ── Stage 2: Parallel OCR + Barcode Detection Across All Images ────
  callbacks.onStageChange(2);
  
  const ocrAndBarcodeResults = await Promise.all(
    processedImages.map(async (procImg, idx) => {
      const origImg = imageList[idx];
      const [ocrResult, barcodeResult] = await Promise.all([
        performOCR(procImg),
        scanBarcode(origImg).catch(() => null as BarcodeResult | null),
      ]);
      return { ocrResult, barcodeResult };
    })
  );

  // Combine OCR text and blocks from all angles
  const combinedTextParts: string[] = [];
  const allBlocks: TextBlock[] = [];
  const perImageFieldSets = [];

  let detectedBarcodeResult: BarcodeResult | null = null;

  for (let i = 0; i < ocrAndBarcodeResults.length; i++) {
    const { ocrResult, barcodeResult } = ocrAndBarcodeResults[i];
    const angleLabel = imageList.length > 1 ? `=== [PACKAGING ANGLE ${i + 1}] ===\n` : '';
    combinedTextParts.push(`${angleLabel}${ocrResult.text}`);
    allBlocks.push(...ocrResult.textBlocks);

    // Extract fields from this individual angle
    const singleAngleFields = extractFields(ocrResult.text, ocrResult.textBlocks);
    perImageFieldSets.push(singleAngleFields);

    if (barcodeResult && !detectedBarcodeResult) {
      detectedBarcodeResult = barcodeResult;
    }
  }

  const combinedText = combinedTextParts.join('\n\n');

  // Also extract across combined text (captures cross-panel declarations)
  const combinedFields = extractFields(combinedText, allBlocks);

  // ── Stage 3: Zero-Order Field Fusion + GS1 Calibration ───────────
  callbacks.onStageChange(3);
  // Fuse all individual angle fields with combined text fields
  const extractedFields = fuseExtractedFields([...perImageFieldSets, combinedFields]);
  
  // Determine barcode value and calibration from real detection
  let calibration: CalibrationResult | null = null;
  let barcodeValue: string | null = null;
  
  if (detectedBarcodeResult) {
    barcodeValue = detectedBarcodeResult.value;
    const realWidthPx = detectedBarcodeResult.boundingBox.width;
    calibration = calibrate(realWidthPx);
    
    console.log(
      `CompliScan GS1: Barcode ${barcodeValue} detected across ${imageList.length} packaging angle(s).`,
      `Width: ${realWidthPx}px`,
      `Scale: ${calibration.isValid ? calibration.scaleRatio.toFixed(2) : 'INVALID'} px/mm`
    );
  } else {
    // Fallback: search for 13-digit pattern across entire combined text
    const ocrBarcodeMatch = combinedText.match(/\b(\d{13})\b/);
    if (ocrBarcodeMatch) {
      barcodeValue = ocrBarcodeMatch[1];
      calibration = calibrate(280, 1.0, true);
      console.log(`CompliScan GS1: Barcode ${barcodeValue} found in OCR text (uncalibrated estimate).`);
    }
  }
  
  // ── Stage 4: Compliance Rules Evaluation ──────────────────────────
  callbacks.onStageChange(4);
  const complianceResult = evaluate(extractedFields, calibration, allBlocks);
  
  // Evaluate shrinkflation / dual-MRP anomalies if barcode + MRP + quantity available
  let anomalyVerdict = null;
  if (barcodeValue && extractedFields.mrp && extractedFields.netQuantity) {
    anomalyVerdict = evaluateAnomalies(
      barcodeValue,
      extractedFields.mrp.value,
      extractedFields.netQuantity.value
    );
  }
  
  // ── Stage 5: Court-Admissible Multi-Angle Evidence Packaging ──────
  callbacks.onStageChange(5);
  const evidence = await createEvidencePackage(imageList, combinedText);
  
  const scanRecord: ScanRecord = {
    id: safeRandomUUID(),
    createdAt: new Date().toISOString(),
    photoDataUrl: processedImages[0],
    photoDataUrls: processedImages,
    extractedFields,
    complianceResult,
    anomalyVerdict,
    evidence,
    rawOcrText: combinedText || 'CompliScan Optical Extraction Completed',
    barcodeValue,
  };
  
  return scanRecord;
}


