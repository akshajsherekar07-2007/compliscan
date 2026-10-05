import { ScanRecord } from '../engine/types';

const STORAGE_KEY = 'compliscan_scan_history_v1';

/**
 * Loads persisted scan history from localStorage.
 */
export function loadScanHistory(): ScanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('CompliScan: Failed to load history from localStorage', error);
    return [];
  }
}

export function saveScanHistory(history: ScanRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('CompliScan: localStorage quota exceeded, trimming heavy photo payloads...', error);
    try {
      // First Fallback: strip heavy photos for all except the most recent scan
      let lightweight = history.map((scan, index) => {
        if (index > 0) {
          return { ...scan, photoDataUrl: null, photoDataUrls: [] };
        }
        return scan;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    } catch (innerError) {
      console.warn('CompliScan: Still exceeding quota, stripping ALL photos...', innerError);
      try {
        // Second Fallback: strip ALL photos to guarantee saving text data
        const ultraLight = history.map(scan => ({ ...scan, photoDataUrl: null, photoDataUrls: [] }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ultraLight));
      } catch (finalError) {
        console.error('CompliScan: Critical storage write failure', finalError);
      }
    }
  }
}

/**
 * Clears all stored scan records.
 */
export function clearStoredHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('CompliScan: Failed to clear localStorage', error);
  }
}
