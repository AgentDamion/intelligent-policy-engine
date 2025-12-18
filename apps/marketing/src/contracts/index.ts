/**
 * Schema-First I/O Contracts
 * Centralized, strict data contracts using Zod for deterministic validation
 */
import { z } from 'zod';

// --- Core Entity Contracts ---

export const PolicyDocumentSchema = z.object({
  id: z.string().uuid(),
  enterpriseId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  mimeType: z.enum(['application/pdf', 'text/plain']),
  checksumSha256: z.string().length(64),
  hasPHI: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ParsedDocumentSchema = z.object({
  docId: z.string().uuid(),
  inputChecksum: z.string().length(64),
  extractedText: z.string().min(1),
  pages: z.number().int().min(1),
  tablesFound: z.number().int().min(0),
  parsingMethod: z.enum(['ai-agent', 'template-fallback', 'manual']),
  parserConfidence: z.number().min(0).max(1),
  processedAt: z.string().datetime({ offset: true }),
});

export const AgentDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'NEEDS_REVIEW']),
  rationale: z.string().min(20),
  requiredControls: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  processedAt: z.string().datetime({ offset: true }),
});

export const ValidationResultSchema = z.object({
  ruleResults: z.array(z.object({
    rule: z.string(),
    outcome: z.enum(['STRICT_PASS', 'STRICT_FAIL', 'SOFT_WARN']),
    message: z.string(),
  })),
  finalConfidence: z.number().min(0).max(1),
  finalOutcome: z.enum(['APPROVED', 'REJECTED', 'HUMAN_IN_LOOP']),
  processedAt: z.string().datetime({ offset: true }),
});

export const AuditTrailSchema = z.object({
  traceId: z.string().uuid(),
  enterpriseId: z.string().uuid(),
  input: PolicyDocumentSchema,
  parsedDoc: ParsedDocumentSchema,
  agentDecision: AgentDecisionSchema,
  validationResult: ValidationResultSchema,
  schemaVersion: z.string().default('v1.0'),
  toolVersions: z.record(z.string(), z.string()).optional(),
  createdAt: z.string().datetime({ offset: true }),
});

// --- Type Exports ---
export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;
export type ParsedDocument = z.infer<typeof ParsedDocumentSchema>;
export type AgentDecision = z.infer<typeof AgentDecisionSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type AuditTrail = z.infer<typeof AuditTrailSchema>;