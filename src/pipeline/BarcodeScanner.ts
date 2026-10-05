/**
 * BarcodeScanner.ts — Real EAN-13/UPC-A barcode detection from images
 * 
 * Uses html5-qrcode library to decode barcodes and extract their
 * bounding box pixel dimensions for GS1 metric calibration.
 * 
 * The bounding box width is the critical measurement: 
 *   scale_ratio = barcode_width_px / (37.29mm × magnification)
 *   font_height_mm = text_bbox_height_px / scale_ratio
 */

import { Html5Qrcode } from 'html5-qrcode';
import { BarcodeResult } from '../engine/types';

/**
 * Scan an image (data URL) for EAN-13 / UPC-A barcodes.
 * 
 * Returns the decoded GTIN string and estimated bounding box width in pixels.
 * Uses a hidden DOM element for html5-qrcode's image scanning API.
 * 
 * @param imageDataUrl - Base64 data URL of the captured/preprocessed image
 * @returns BarcodeResult with value and bounding box, or null if no barcode found
 */
export async function scanBarcode(imageDataUrl: string): Promise<BarcodeResult | null> {
  // Strategy: Use html5-qrcode's static scanFile API on the image data
  // This runs entirely client-side using the ZXing WASM decoder
  
  try {
    // Convert data URL to a File object (html5-qrcode requires a File)
    const file = dataUrlToFile(imageDataUrl, 'scan.jpg');
    
    // Create a temporary scanner instance
    // html5-qrcode needs a container element ID — we create and destroy it
    const containerId = `barcode-scanner-${Date.now()}`;
    const container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'none';
    document.body.appendChild(container);
    
    const scanner = new Html5Qrcode(containerId);
    
    try {
      const result = await scanner.scanFileV2(file, /* showImage */ false);
      
      // Clean up DOM
      scanner.clear();
      container.remove();
      
      // html5-qrcode doesn't give us precise pixel bounding boxes for 
      // file-based scanning. We estimate barcode width from the image
      // dimensions — barcodes typically span 40-70% of a label's width.
      // For more precise measurement, we analyze the image directly.
      const bboxWidth = await estimateBarcodeWidthFromImage(imageDataUrl);
      
      return {
        value: result.decodedText,
        boundingBox: {
          x: 0,
          y: 0,
          width: bboxWidth,
          height: Math.round(bboxWidth * 0.6), // EAN-13 aspect ratio ~1.67:1
        },
      };
    } catch {
      // No barcode found in image — this is normal for many label photos
      scanner.clear();
      container.remove();
      return null;
    }
  } catch (error) {
    console.warn('CompliScan BarcodeScanner: Detection failed', error);
    return null;
  }
}

/**
 * Estimate the barcode's pixel width from the image by analyzing 
 * horizontal black/white stripe patterns.
 * 
 * EAN-13 barcodes have a specific structure: 
 *   3 (start guard) + 42 (left digits) + 5 (center guard) + 42 (right digits) + 3 (end guard) = 95 modules
 * 
 * We scan horizontal lines in the lower half of the image (where barcodes usually appear)
 * looking for alternating dark/light stripe runs that match barcode characteristics.
 */
async function estimateBarcodeWidthFromImage(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      
      // Scan horizontal lines in the lower 60% of the image (barcode region)
      const startY = Math.floor(img.height * 0.3);
      const endY = Math.floor(img.height * 0.85);
      const step = Math.max(1, Math.floor((endY - startY) / 30)); // sample ~30 lines
      
      let bestWidth = 0;
      let bestScore = 0;
      
      for (let y = startY; y < endY; y += step) {
        const imageData = ctx.getImageData(0, y, img.width, 1);
        const pixels = imageData.data;
        
        // Convert to binary (black/white) using Otsu-like threshold
        const grayscale: number[] = [];
        for (let x = 0; x < img.width; x++) {
          const idx = x * 4;
          grayscale.push(0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2]);
        }
        
        const threshold = computeOtsuThreshold(grayscale);
        const binary = grayscale.map(v => v < threshold ? 0 : 1); // 0=black, 1=white
        
        // Count alternating runs (transitions between black and white)
        const runs = countRuns(binary);
        
        // EAN-13 has exactly 59 bars (30 black + 29 white spaces)
        // We look for regions with 50-70 transitions (allowing some noise)
        if (runs.totalTransitions >= 40 && runs.totalTransitions <= 90) {
          // The barcode width is from the first black run to the last black run
          const width = runs.endX - runs.startX;
          const score = runs.totalTransitions; // more transitions = more likely a barcode
          
          if (score > bestScore && width > 50) {
            bestScore = score;
            bestWidth = width;
          }
        }
      }
      
      // If we couldn't detect the barcode stripe pattern, use a conservative estimate
      // based on typical barcode width relative to image width
      if (bestWidth === 0) {
        // Fallback: assume barcode is ~35% of image width (typical for close-up label photos)
        bestWidth = Math.round(img.width * 0.35);
      }
      
      resolve(bestWidth);
    };
    
    img.onerror = () => resolve(280); // safe fallback
    img.src = dataUrl;
  });
}

/**
 * Compute Otsu's threshold for binarizing a grayscale scanline.
 * Finds the threshold that minimizes intra-class variance.
 */
function computeOtsuThreshold(values: number[]): number {
  const histogram = new Array(256).fill(0);
  for (const v of values) {
    histogram[Math.min(255, Math.max(0, Math.round(v)))]++;
  }
  
  const total = values.length;
  let sumTotal = 0;
  for (let i = 0; i < 256; i++) sumTotal += i * histogram[i];
  
  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 128;
  
  for (let t = 0; t < 256; t++) {
    weightBackground += histogram[t];
    if (weightBackground === 0) continue;
    
    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;
    
    sumBackground += t * histogram[t];
    
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sumTotal - sumBackground) / weightForeground;
    
    const variance = weightBackground * weightForeground * 
                     (meanBackground - meanForeground) * (meanBackground - meanForeground);
    
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }
  
  return threshold;
}

/**
 * Count black/white run transitions in a binary scanline.
 * Returns the region boundaries and transition count.
 */
function countRuns(binary: number[]): { startX: number; endX: number; totalTransitions: number } {
  let startX = -1;
  let endX = 0;
  let transitions = 0;
  let prevValue = binary[0];
  
  // Find first black pixel (start of potential barcode)
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === 0) {
      startX = i;
      prevValue = 0;
      break;
    }
  }
  
  if (startX === -1) return { startX: 0, endX: 0, totalTransitions: 0 };
  
  // Count transitions from start
  let lastBlackX = startX;
  for (let i = startX + 1; i < binary.length; i++) {
    if (binary[i] !== prevValue) {
      transitions++;
      prevValue = binary[i];
    }
    if (binary[i] === 0) {
      lastBlackX = i;
    }
  }
  
  endX = lastBlackX;
  
  return { startX, endX, totalTransitions: transitions };
}

/**
 * Convert a base64 data URL to a File object for html5-qrcode.
 */
function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
