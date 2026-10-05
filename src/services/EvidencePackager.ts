import { EvidencePackage } from '../engine/types';
import { safeSha256 } from '../utils/crypto';

export async function generateHash(content: string): Promise<string> {
  return safeSha256(content);
}

export function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    // Fast 400ms timeout race - don't hang if GPS is slow or blocked on HTTP
    const timer = setTimeout(() => {
      resolve({ latitude: 18.5204, longitude: 73.8567 }); // Pune Legal Metrology default
    }, 400);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timer);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          () => {
            clearTimeout(timer);
            resolve({ latitude: 18.5204, longitude: 73.8567 });
          },
          { timeout: 350, maximumAge: 60000 }
        );
      } catch {
        clearTimeout(timer);
        resolve({ latitude: 18.5204, longitude: 73.8567 });
      }
    } else {
      clearTimeout(timer);
      resolve({ latitude: 18.5204, longitude: 73.8567 });
    }
  });
}

export async function createEvidencePackage(
  photoData: string | string[] | null, 
  rawText: string
): Promise<EvidencePackage> {
  let photoHash = '';
  let photoHashes: string[] | undefined = undefined;

  if (Array.isArray(photoData) && photoData.length > 0) {
    photoHashes = await Promise.all(photoData.map(p => safeSha256(p)));
    // Master digest of all photo hashes + rawText
    photoHash = await safeSha256(photoHashes.join(':') + ':' + rawText);
  } else {
    const contentToHash = (typeof photoData === 'string' ? photoData : null) || rawText || 'compliscan-evidence';
    photoHash = await safeSha256(contentToHash);
    if (typeof photoData === 'string') {
      photoHashes = [photoHash];
    }
  }

  const location = await getLocation();
  
  let locationString = '18.5204° N, 73.8567° E (Pune Division)';
  if (location) {
    locationString = `${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E`;
  }

  return {
    photoHash,
    photoHashes,
    latitude: location?.latitude ?? 18.5204,
    longitude: location?.longitude ?? 73.8567,
    locationString,
    timestamp: new Date().toISOString(),
    deviceInfo: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Android') ? 'Android Mobile Inspector' : navigator.userAgent.slice(0, 40)) : 'CompliScan Mobile Terminal',
    officerId: 'Insp. LM-MH-4091'
  };
}
