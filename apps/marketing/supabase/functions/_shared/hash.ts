/**
 * Deno-compatible canonicalization and hashing for Edge Functions
 */

const FieldSemantics = {
  'controls.hitl.required': { type: 'boolean', orderless: true },
  'controls.data_residency.required': { type: 'boolean', orderless: true },
  'controls.hitl.reviewers': { type: 'string[]', orderless: true },
  'guardrails.blocked_actions': { type: 'string[]', orderless: true },
  'data_profile.classifications': { type: 'string[]', orderless: true },
  'thresholds.export_sensitivity': { type: 'number', orderless: false },
  'thresholds.max_data_age_days': { type: 'number', orderless: false },
  'workflows.escalation_steps': { type: 'object[]', orderless: false },
  'approval_chain': { type: 'object[]', orderless: false },
} as const;

export const canonicalize = (obj: any, path: string = ''): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    const semantics = FieldSemantics[path as keyof typeof FieldSemantics];
    const canonicalized = obj.map((item, idx) => 
      canonicalize(item, `${path}[${idx}]`)
    );
    
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

export const hashJson = async (obj: any): Promise<string> => {
  const canonical = canonicalize(obj);
  const jsonString = JSON.stringify(canonical);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
