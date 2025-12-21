/**
 * Prompt Injection Guard
 * 
 * Detects and blocks potential prompt injection attacks in user inputs.
 * This is a critical security layer for agentic AI platforms.
 */

export interface InjectionDetectionResult {
  detected: boolean;
  confidence: number;
  pattern: string;
  category: InjectionCategory;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  matchedText?: string;
}

export type InjectionCategory = 
  | 'instruction_override'
  | 'role_manipulation' 
  | 'system_prompt_leak'
  | 'jailbreak_attempt'
  | 'delimiter_injection'
  | 'encoding_attack'
  | 'context_manipulation'
  | 'tool_abuse'
  | 'data_exfiltration';

interface PatternRule {
  pattern: RegExp;
  category: InjectionCategory;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// Comprehensive prompt injection detection patterns
const INJECTION_PATTERNS: PatternRule[] = [
  // Instruction Override Attacks
  {
    pattern: /ignore\s+(previous|all|above|prior|earlier|any)\s+(instructions?|rules?|prompts?|commands?|guidelines?)/i,
    category: 'instruction_override',
    confidence: 0.95,
    riskLevel: 'critical',
    description: 'Attempt to ignore previous instructions'
  },
  {
    pattern: /disregard\s+(everything|all|any)\s+(above|before|previously)/i,
    category: 'instruction_override',
    confidence: 0.95,
    riskLevel: 'critical',
    description: 'Attempt to disregard prior context'
  },
  {
    pattern: /forget\s+(everything|all|your)\s+(instructions?|training|rules?|guidelines?)/i,
    category: 'instruction_override',
    confidence: 0.95,
    riskLevel: 'critical',
    description: 'Attempt to reset agent instructions'
  },
  {
    pattern: /override\s+(your|the|all)\s+(instructions?|rules?|restrictions?|limitations?)/i,
    category: 'instruction_override',
    confidence: 0.90,
    riskLevel: 'critical',
    description: 'Explicit override attempt'
  },
  {
    pattern: /new\s+instructions?:\s*you\s+(must|should|will|are)/i,
    category: 'instruction_override',
    confidence: 0.90,
    riskLevel: 'critical',
    description: 'Injected instruction block'
  },

  // Role Manipulation Attacks
  {
    pattern: /you\s+are\s+now\s+(in|entering|operating\s+in)\s+(debug|admin|test|developer|root|sudo|maintenance)\s+mode/i,
    category: 'role_manipulation',
    confidence: 0.95,
    riskLevel: 'critical',
    description: 'Attempt to switch to privileged mode'
  },
  {
    pattern: /pretend\s+(you\s+are|to\s+be|you're)\s+(a\s+different|another|an?\s+unrestricted|an?\s+unfiltered)/i,
    category: 'role_manipulation',
    confidence: 0.90,
    riskLevel: 'high',
    description: 'Role impersonation attempt'
  },
  {
    pattern: /act\s+as\s+(if\s+you\s+have\s+no|without\s+any)\s+(restrictions?|limitations?|rules?|filters?)/i,
    category: 'role_manipulation',
    confidence: 0.95,
    riskLevel: 'critical',
    description: 'Attempt to bypass restrictions via roleplay'
  },
  {
    pattern: /you\s+are\s+(DAN|STAN|DUDE|KEVIN|MONGO|JAILBROKEN)/i,
    category: 'role_manipulation',
    confidence: 0.98,
    riskLevel: 'critical',
    description: 'Known jailbreak persona injection'
  },
  {
    pattern: /from\s+now\s+on\s+you\s+(will|must|are|should)\s+(act|behave|respond|operate)/i,
    category: 'role_manipulation',
    confidence: 0.85,
    riskLevel: 'high',
    description: 'Persistent role change attempt'
  },

  // System Prompt Leak Attempts
  {
    pattern: /(show|reveal|display|print|output|tell\s+me|what\s+is)\s+(your|the)\s+(system\s+prompt|initial\s+instructions?|original\s+prompt|base\s+prompt)/i,
    category: 'system_prompt_leak',
    confidence: 0.90,
    riskLevel: 'high',
    description: 'System prompt extraction attempt'
  },
  {
    pattern: /repeat\s+(the\s+)?(text|words?|instructions?)\s+(above|before|at\s+the\s+beginning)/i,
    category: 'system_prompt_leak',
    confidence: 0.85,
    riskLevel: 'high',
    description: 'Indirect prompt extraction via repetition'
  },
  {
    pattern: /what\s+(were|are)\s+you\s+(told|instructed|programmed)\s+to\s+(do|say|not\s+do)/i,
    category: 'system_prompt_leak',
    confidence: 0.80,
    riskLevel: 'medium',
    description: 'Indirect instruction probing'
  },

  // Delimiter Injection Attacks
  {
    pattern: /\[SYSTEM\]|\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/i,
    category: 'delimiter_injection',
    confidence: 0.95,
    riskLevel: 'critical',
    description: 'Chat format delimiter injection'
  },
  {
    pattern: /```system|```instructions?|<system>|<\/system>|<instructions?>|<\/instructions?>/i,
    category: 'delimiter_injection',
    confidence: 0.90,
    riskLevel: 'critical',
    description: 'XML/Markdown delimiter injection'
  },
  {
    pattern: /Human:|Assistant:|User:|AI:|System:|###\s*(Instruction|Response|System)/i,
    category: 'delimiter_injection',
    confidence: 0.85,
    riskLevel: 'high',
    description: 'Conversation role delimiter injection'
  },

  // Jailbreak Attempts
  {
    pattern: /do\s+anything\s+now|bypass\s+(your|all|any)\s+(filters?|restrictions?|safety)/i,
    category: 'jailbreak_attempt',
    confidence: 0.95,
    riskLevel: 'critical',
    description: 'DAN-style jailbreak pattern'
  },
  {
    pattern: /hypothetically|in\s+a\s+hypothetical\s+scenario|for\s+(educational|research)\s+purposes?\s+only/i,
    category: 'jailbreak_attempt',
    confidence: 0.70,
    riskLevel: 'medium',
    description: 'Hypothetical framing evasion'
  },
  {
    pattern: /opposite\s+day|respond\s+(with\s+)?the\s+opposite|reverse\s+(your|all)\s+(responses?|answers?)/i,
    category: 'jailbreak_attempt',
    confidence: 0.85,
    riskLevel: 'high',
    description: 'Logic inversion attack'
  },

  // Tool/Function Abuse
  {
    pattern: /call\s+(the\s+)?function|execute\s+(the\s+)?tool|invoke\s+API|run\s+command/i,
    category: 'tool_abuse',
    confidence: 0.75,
    riskLevel: 'medium',
    description: 'Potential tool invocation manipulation'
  },
  {
    pattern: /\{"(function|tool|action)":\s*"[^"]+"/i,
    category: 'tool_abuse',
    confidence: 0.85,
    riskLevel: 'high',
    description: 'JSON function call injection'
  },

  // Data Exfiltration Attempts
  {
    pattern: /send\s+(this|the|all)\s+(data|information|content)\s+to\s+(my\s+)?([a-z]+\.)+[a-z]+/i,
    category: 'data_exfiltration',
    confidence: 0.90,
    riskLevel: 'critical',
    description: 'Data exfiltration to external endpoint'
  },
  {
    pattern: /include\s+(in\s+your\s+response|at\s+the\s+end)\s+(all|the)\s+(user|customer|patient|client)\s+(data|records?|information)/i,
    category: 'data_exfiltration',
    confidence: 0.90,
    riskLevel: 'critical',
    description: 'Sensitive data extraction attempt'
  },

  // Context Manipulation
  {
    pattern: /end\s+(of\s+)?(user|human)\s+(input|message|prompt)/i,
    category: 'context_manipulation',
    confidence: 0.85,
    riskLevel: 'high',
    description: 'False context boundary injection'
  },
  {
    pattern: /begin\s+(new\s+)?(system|admin|developer)\s+(section|context|mode)/i,
    category: 'context_manipulation',
    confidence: 0.90,
    riskLevel: 'critical',
    description: 'Context escalation attempt'
  },

  // Encoding Attacks
  {
    pattern: /base64|hex|rot13|unicode|decode\s+(this|the\s+following)/i,
    category: 'encoding_attack',
    confidence: 0.70,
    riskLevel: 'medium',
    description: 'Potential encoded payload indicator'
  }
];

// Suspicious token sequences that warrant higher scrutiny
const SUSPICIOUS_TOKENS = [
  'sudo', 'root', 'admin', 'jailbreak', 'bypass', 'override',
  'unrestricted', 'unfiltered', 'uncensored', 'without limits',
  'no rules', 'no restrictions', 'developer mode', 'debug mode'
];

/**
 * Calculates the suspicious token density in the input
 */
function calculateSuspiciousTokenDensity(input: string): number {
  const lowerInput = input.toLowerCase();
  const words = lowerInput.split(/\s+/);
  let suspiciousCount = 0;

  for (const token of SUSPICIOUS_TOKENS) {
    if (lowerInput.includes(token)) {
      suspiciousCount++;
    }
  }

  // Return density as a ratio (0-1)
  return Math.min(suspiciousCount / Math.max(words.length, 1), 1);
}

/**
 * Checks for unusual character distribution that might indicate encoding attacks
 */
function detectEncodingAnomaly(input: string): boolean {
  // Check for high density of non-ASCII characters
  const nonAsciiCount = (input.match(/[^\x00-\x7F]/g) || []).length;
  const nonAsciiRatio = nonAsciiCount / input.length;

  // Check for base64-like patterns
  const base64Pattern = /^[A-Za-z0-9+/]{20,}={0,2}$/;
  const words = input.split(/\s+/);
  const base64LikeWords = words.filter(w => base64Pattern.test(w));

  return nonAsciiRatio > 0.3 || base64LikeWords.length > 2;
}

/**
 * Main detection function - analyzes input for prompt injection attempts
 */
export function detectPromptInjection(userInput: string): InjectionDetectionResult {
  // Normalize input for analysis
  const normalizedInput = userInput.trim();
  
  if (!normalizedInput) {
    return {
      detected: false,
      confidence: 0,
      pattern: '',
      category: 'instruction_override',
      riskLevel: 'low'
    };
  }

  // Check against all patterns
  for (const rule of INJECTION_PATTERNS) {
    const match = rule.pattern.exec(normalizedInput);
    if (match) {
      return {
        detected: true,
        confidence: rule.confidence,
        pattern: rule.pattern.source,
        category: rule.category,
        riskLevel: rule.riskLevel,
        matchedText: match[0]
      };
    }
  }

  // Heuristic checks for more subtle attacks
  const tokenDensity = calculateSuspiciousTokenDensity(normalizedInput);
  if (tokenDensity > 0.1) {
    return {
      detected: true,
      confidence: Math.min(tokenDensity * 5, 0.85),
      pattern: 'suspicious_token_density',
      category: 'jailbreak_attempt',
      riskLevel: tokenDensity > 0.2 ? 'high' : 'medium',
      matchedText: `High suspicious token density: ${(tokenDensity * 100).toFixed(1)}%`
    };
  }

  // Check for encoding anomalies
  if (detectEncodingAnomaly(normalizedInput)) {
    return {
      detected: true,
      confidence: 0.70,
      pattern: 'encoding_anomaly',
      category: 'encoding_attack',
      riskLevel: 'medium',
      matchedText: 'Unusual character distribution detected'
    };
  }

  // No injection detected
  return {
    detected: false,
    confidence: 0,
    pattern: '',
    category: 'instruction_override',
    riskLevel: 'low'
  };
}

/**
 * Batch analysis for multi-message conversations
 */
export function analyzeConversation(messages: string[]): {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  detections: InjectionDetectionResult[];
  summary: string;
} {
  const detections = messages.map(msg => detectPromptInjection(msg));
  const positiveDetections = detections.filter(d => d.detected);

  let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  if (positiveDetections.some(d => d.riskLevel === 'critical')) {
    overallRisk = 'critical';
  } else if (positiveDetections.some(d => d.riskLevel === 'high')) {
    overallRisk = 'high';
  } else if (positiveDetections.length >= 2 || positiveDetections.some(d => d.riskLevel === 'medium')) {
    overallRisk = 'medium';
  }

  const categories = [...new Set(positiveDetections.map(d => d.category))];
  const summary = positiveDetections.length > 0
    ? `Detected ${positiveDetections.length} potential injection(s) across categories: ${categories.join(', ')}`
    : 'No injection patterns detected';

  return { overallRisk, detections, summary };
}

/**
 * Sanitize input by removing or escaping potentially dangerous patterns
 * Use with caution - may alter legitimate user input
 */
export function sanitizeInput(input: string): string {
  let sanitized = input;

  // Remove common delimiter injections
  sanitized = sanitized.replace(/\[SYSTEM\]|\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi, '');
  sanitized = sanitized.replace(/<system>|<\/system>|<instructions?>|<\/instructions?>/gi, '');
  
  // Escape potential role markers
  sanitized = sanitized.replace(/^(Human|Assistant|User|AI|System):/gim, '[User said: $1:]');

  return sanitized;
}

