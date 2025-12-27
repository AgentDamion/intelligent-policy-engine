/**
 * Privacy Scrubber Utility
 * Scrubs PII (Personally Identifiable Information) and PHI (Protected Health Information)
 * from user inputs before sending to LLM providers.
 */

const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  // Pharma specific: Patient IDs often follow specific formats (e.g., US-123-4567)
  patientId: /\b[A-Z]{2}-\d{3}-\d{4}\b/g,
  dateOfBirth: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g
};

export function scrubPII(text: string): { scrubbedText: string; metadata: any } {
  if (!text) return { scrubbedText: text, metadata: { scrubbed: false, findings: {} } };
  
  let scrubbedText = text;
  const findings: any = {};

  for (const [key, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      findings[key] = matches.length;
      scrubbedText = scrubbedText.replace(pattern, `[REDACTED_${key.toUpperCase()}]`);
    }
  }

  return { 
    scrubbedText, 
    metadata: { 
      scrubbed: Object.keys(findings).length > 0,
      findings 
    } 
  };
}

