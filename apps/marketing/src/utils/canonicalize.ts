import { FieldSemantics } from '@/policy/fieldSemantics';

/**
 * Deterministic JSON canonicalization for hashing
 * Respects field semantics for ordered vs orderless arrays
 */
export const canonicalize = (obj: any, path: string = ''): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    const semantics = FieldSemantics[path as keyof typeof FieldSemantics];
    const canonicalized = obj.map((item, idx) => 
      canonicalize(item, `${path}[${idx}]`)
    );
    
    // Only sort if orderless=true
    return semantics?.orderless 
      ? canonicalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
      : canonicalized;
  }
  
  if (obj && typeof obj === 'object') {
    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach(key => {
        const fieldPath = path ? `${path}.${key}` : key;
        sorted[key] = canonicalize(obj[key], fieldPath);
      });
    return sorted;
  }
  
  return obj;
};

/**
 * Generate SHA-256 hash of canonicalized JSON (browser-compatible)
 */
export const hashJson = async (obj: any): Promise<string> => {
  const canonical = canonicalize(obj);
  const jsonString = JSON.stringify(canonical);
  
  // Browser SubtleCrypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
