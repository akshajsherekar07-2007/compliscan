import Tesseract, { createWorker, PSM } from 'tesseract.js';
import { TextBlock } from '../engine/types';

let workerPromise: Promise<Tesseract.Worker> | null = null;

/**
 * Initializes or retrieves the singleton Tesseract Web Worker.
 * Pre-warmed during app startup to eliminate 3-5 second cold-start delays.
 */
export async function getOCRWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      try {
        const worker = await createWorker('eng', 1, {
          logger: () => {}, // Suppress noisy progress logs in production
        });
        
        // Optimize for FMCG multi-column packaging labels
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO, // PSM 3: Automatic page segmentation
          user_defined_dpi: '300',         // Treat images as 300 DPI for small font clarity
          preserve_interword_spaces: '1',  // Keep formatting between legal labels
        });

        return worker;
      } catch (err) {
        console.warn('CompliScan OCREngine: Failed to initialize singleton worker, falling back', err);
        workerPromise = null;
        throw err;
      }
    })();
  }

  return workerPromise;
}

/**
 * Extracts bounding box words from Tesseract's block hierarchy.
 */
function extractWordsFromData(data: any): TextBlock[] {
  const textBlocks: TextBlock[] = [];

  try {
    // 1. Check direct words array if exposed
    if (data.words && Array.isArray(data.words)) {
      for (const w of data.words) {
        if (w.text && w.bbox) {
          textBlocks.push({
            text: w.text,
            boundingBox: {
              x: w.bbox.x0,
              y: w.bbox.y0,
              width: w.bbox.x1 - w.bbox.x0,
              height: w.bbox.y1 - w.bbox.y0,
            },
          });
        }
      }
      if (textBlocks.length > 0) return textBlocks;
    }

    // 2. Traverse blocks -> paragraphs -> lines -> words
    const blocks = data.blocks;
    if (blocks && Array.isArray(blocks)) {
      for (const block of blocks) {
        const paragraphs = block.paragraphs || [];
        for (const para of paragraphs) {
          const lines = para.lines || [];
          for (const line of lines) {
            const words = line.words || [];
            for (const word of words) {
              if (word.text && word.bbox) {
                textBlocks.push({
                  text: word.text,
                  boundingBox: {
                    x: word.bbox.x0,
                    y: word.bbox.y0,
                    width: word.bbox.x1 - word.bbox.x0,
                    height: word.bbox.y1 - word.bbox.y0,
                  },
                });
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('CompliScan OCREngine: Word extraction fallback triggered', e);
  }

  // 3. Fallback: line-level blocks if no word bboxes found
  if (textBlocks.length === 0 && data.text) {
    const lines = data.text.split('\n').filter((l: string) => l.trim());
    lines.forEach((line: string, idx: number) => {
      textBlocks.push({
        text: line.trim(),
        boundingBox: { x: 10, y: 10 + idx * 24, width: 400, height: 20 },
      });
    });
  }

  return textBlocks;
}

/**
 * Performs high-precision OCR on preprocessed image data URL.
 */
export async function performOCR(imageDataUrl: string): Promise<{ text: string; textBlocks: TextBlock[] }> {
  try {
    const worker = await getOCRWorker();
    const result = await worker.recognize(imageDataUrl);

    const text = result.data.text || '';
    const textBlocks = extractWordsFromData(result.data);

    return { text, textBlocks };
  } catch (error) {
    console.warn('CompliScan OCREngine: Worker recognize failed, using fallback Tesseract.recognize', error);
    // Fallback if singleton worker had an issue
    const fallbackResult = await Tesseract.recognize(imageDataUrl, 'eng');
    const text = fallbackResult.data.text || '';
    const textBlocks = extractWordsFromData(fallbackResult.data);

    return { text, textBlocks };
  }
}
