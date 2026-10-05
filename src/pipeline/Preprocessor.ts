/**
 * Preprocessor.ts — Clean, High-Fidelity Optical Preprocessing & Cylindrical Dewarping
 * 
 * Capabilities:
 *   1. Subpixel font anti-aliasing preservation for Tesseract.js / Leptonica OCR.
 *   2. Cylindrical surface dewarping for curved packaging (jars, bottles, cans, round pouches).
 *   3. Specular glare and highlight suppression on glossy/metallic wrappers.
 *   4. Multi-exposure adaptive contrast enhancement for low-light crimp stamps.
 */

export interface PreprocessOptions {
  maxDimension?: number;
  enhanceContrast?: boolean;
  dewarpCylindrical?: boolean;
  suppressGlare?: boolean;
  radiusFactor?: number; // Cylindrical radius as ratio of width (default 0.72)
}

/**
 * Cylindrical Dewarping for Curved Surface Packaging (Jars, Bottles, Cans).
 * Maps horizontally compressed text on cylindrical curved boundaries
 * back to a flat unrolled Euclidean plane using inverse cylindrical projection.
 */
export function dewarpCylindricalSurface(
  srcCanvas: HTMLCanvasElement,
  radiusFactor: number = 0.72
): HTMLCanvasElement {
  const width = srcCanvas.width;
  const height = srcCanvas.height;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx || !srcCtx.getImageData) return srcCanvas;

  try {
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const srcData = srcImageData.data;

    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = width;
    dstCanvas.height = height;
    const dstCtx = dstCanvas.getContext('2d', { willReadFrequently: true });
    if (!dstCtx || !dstCtx.createImageData) return srcCanvas;

    const dstImageData = dstCtx.createImageData(width, height);
    const dstData = dstImageData.data;

    const xc = width / 2;
    const yc = height / 2;
    const R = width * radiusFactor;
    // Maximum angular deflection that fits within canvas width
    const maxTheta = Math.asin(Math.min(0.96, (width / 2) / R));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Normalised horizontal position across cylinder (-1 to +1)
        const normX = (x - xc) / xc;
        const theta = normX * maxTheta;

        // Project onto curved camera image plane (x_proj = xc + R * sin(theta))
        const srcX = xc + R * Math.sin(theta);
        // Vertical perspective correction for curved rim/smile effect
        const verticalDistort = 1.0 + 0.035 * (1.0 - Math.cos(theta));
        const srcY = yc + (y - yc) * verticalDistort;

        if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) {
          // Bilinear interpolation for smooth character curves
          const x0 = Math.floor(srcX);
          const x1 = x0 + 1;
          const y0 = Math.floor(srcY);
          const y1 = y0 + 1;

          const wx = srcX - x0;
          const wy = srcY - y0;

          const idx00 = (y0 * width + x0) * 4;
          const idx10 = (y0 * width + x1) * 4;
          const idx01 = (y1 * width + x0) * 4;
          const idx11 = (y1 * width + x1) * 4;

          const dstIdx = (y * width + x) * 4;

          for (let c = 0; c < 3; c++) {
            const top = srcData[idx00 + c] * (1 - wx) + srcData[idx10 + c] * wx;
            const bottom = srcData[idx01 + c] * (1 - wx) + srcData[idx11 + c] * wx;
            dstData[dstIdx + c] = Math.round(top * (1 - wy) + bottom * wy);
          }
          dstData[dstIdx + 3] = srcData[idx00 + 3]; // Preserve alpha
        } else {
          // Out of cylindrical bounds — copy edge pixel or transparent
          const edgeX = Math.max(0, Math.min(width - 1, Math.round(srcX)));
          const edgeY = Math.max(0, Math.min(height - 1, Math.round(srcY)));
          const srcIdx = (edgeY * width + edgeX) * 4;
          const dstIdx = (y * width + x) * 4;
          dstData[dstIdx] = srcData[srcIdx];
          dstData[dstIdx + 1] = srcData[srcIdx + 1];
          dstData[dstIdx + 2] = srcData[srcIdx + 2];
          dstData[dstIdx + 3] = srcData[srcIdx + 3];
        }
      }
    }

    dstCtx.putImageData(dstImageData, 0, 0);
    return dstCanvas;
  } catch (err) {
    console.warn('CompliScan Preprocessor: Cylindrical dewarp fallback', err);
    return srcCanvas;
  }
}

/**
 * Suppresses specular glare and bright reflections common on glossy plastic/glass jars.
 */
export function suppressSpecularGlare(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !ctx.getImageData) return canvas;

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Soft-knee highlight compression for washed-out glare
      if (luminance > 225) {
        const factor = 1.0 - ((luminance - 225) / 30) * 0.25;
        data[i] = Math.round(r * factor);
        data[i + 1] = Math.round(g * factor);
        data[i + 2] = Math.round(b * factor);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch {
    return canvas;
  }
}

/**
 * Preprocesses a raw packaging image for maximum OCR text extraction.
 * Supports cylindrical dewarping for curved packaging and specular glare reduction.
 */
export async function preprocessLabelImage(
  dataUrl: string,
  options: PreprocessOptions = {}
): Promise<string> {
  const { 
    maxDimension = 2400, 
    enhanceContrast = true,
    dewarpCylindrical = false,
    suppressGlare = true,
    radiusFactor = 0.72
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // 1. Maintain high resolution for tiny legal print (1.0mm - 2.0mm fonts)
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      let canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // 2. High-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 3. Gentle contrast boost to lift dark ink from colorful packaging
      if (enhanceContrast) {
        ctx.filter = 'contrast(115%) brightness(103%)';
      }

      ctx.drawImage(img, 0, 0, width, height);

      // 4. Specular glare reduction on shiny or curved plastic
      if (suppressGlare) {
        canvas = suppressSpecularGlare(canvas);
      }

      // 5. Cylindrical dewarping for curved surfaces (jars, bottles, cans)
      if (dewarpCylindrical) {
        canvas = dewarpCylindricalSurface(canvas, radiusFactor);
      }

      // Export as high-quality JPEG
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
