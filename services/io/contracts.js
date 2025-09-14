/**
 * Deterministic Input/Output Contracts
 * Schema-first approach to prevent agent drift and ensure reliability
 * Based on lessons from Mohit Aggarwal's hackathon experience
 */

const Joi = require('joi');

// ===== INPUT CONTRACTS =====

const PolicyDocIn = Joi.object({
  enterpriseId: Joi.string().uuid().required(),
  partnerId: Joi.string().uuid().optional(),
  mimeType: Joi.string().valid('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').required(),
  blobUrl: Joi.string().uri().optional(),
  checksumSha256: Joi.string().length(64).required(),
  sizeBytes: Joi.number().integer().min(1).max(10 * 1024 * 1024).required(),
  redactionStatus: Joi.string().valid('none', 'partial', 'full').default('none'),
  phiToggle: Joi.boolean().default(false),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

const ToolSubmissionIn = Joi.object({
  enterpriseId: Joi.string().uuid().required(),
  partnerId: Joi.string().uuid().optional(),
  toolName: Joi.string().min(1).max(255).required(),
  toolDescription: Joi.string().min(10).max(2000).required(),
  toolCategory: Joi.string().valid('content_generation', 'data_analysis', 'communication', 'automation', 'other').required(),
  dataTypes: Joi.array().items(Joi.string().valid('text', 'images', 'audio', 'video', 'structured_data', 'personal_data')).required(),
  usageContext: Joi.string().min(10).max(1000).required(),
  clientFacing: Joi.boolean().required(),
  regulatoryRequirements: Joi.array().items(Joi.string().valid('GDPR', 'HIPAA', 'SOX', 'PCI-DSS', 'FDA', 'other')).required(),
  urgencyLevel: Joi.number().min(0).max(1).default(0.5)
});

const ComplianceRequestIn = Joi.object({
  enterpriseId: Joi.string().uuid().required(),
  requestType: Joi.string().valid('policy_review', 'audit_request', 'violation_report', 'approval_request').required(),
  context: Joi.string().min(10).max(5000).required(),
  attachments: Joi.array().items(PolicyDocIn).optional(),
  deadline: Joi.date().iso().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
});

// ===== OUTPUT CONTRACTS =====

const ParsedDocOut = Joi.object({
  docId: Joi.string().uuid().required(),
  pages: Joi.number().integer().min(1).required(),
  tables: Joi.array().items(Joi.object({
    rows: Joi.number().integer().min(1).required(),
    cols: Joi.number().integer().min(1).required(),
    content: Joi.array().items(Joi.array().items(Joi.string())).required()
  })).required(),
  text: Joi.string().min(1).required(),
  method: Joi.string().valid('gdocai', 'textract', 'template', 'fallback').required(),
  confidence: Joi.number().min(0).max(1).required(),
  entities: Joi.array().items(Joi.object({
    text: Joi.string().required(),
    type: Joi.string().required(),
    confidence: Joi.number().min(0).max(1).required()
  })).required(),
  processingTimeMs: Joi.number().integer().min(0).required(),
  errorDetails: Joi.string().optional()
});

const PolicyDecision = Joi.object({
  decision: Joi.string().valid('approve', 'reject', 'needs_info', 'conditional_approval').required(),
  rationale: Joi.string().min(20).max(2000).required(),
  requiredControls: Joi.array().items(Joi.string()).required(),
  confidence: Joi.number().min(0).max(1).required(),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  complianceStatus: Joi.string().valid('compliant', 'non_compliant', 'conditional', 'unknown').required(),
  humanReviewRequired: Joi.boolean().required(),
  estimatedReviewTime: Joi.string().optional()
});

const ToolAnalysis = Joi.object({
  toolId: Joi.string().uuid().required(),
  approvalStatus: Joi.string().valid('approved', 'rejected', 'pending_review', 'conditional').required(),
  riskAssessment: Joi.object({
    overallRisk: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    riskFactors: Joi.array().items(Joi.string()).required(),
    mitigationStrategies: Joi.array().items(Joi.string()).required()
  }).required(),
  complianceCheck: Joi.object({
    gdpr: Joi.string().valid('compliant', 'non_compliant', 'conditional', 'not_applicable').required(),
    hipaa: Joi.string().valid('compliant', 'non_compliant', 'conditional', 'not_applicable').required(),
    industry: Joi.string().valid('compliant', 'non_compliant', 'conditional', 'not_applicable').required()
  }).required(),
  recommendations: Joi.array().items(Joi.string()).required(),
  confidence: Joi.number().min(0).max(1).required(),
  humanReviewRequired: Joi.boolean().required()
});

const AuditTrailEntry = Joi.object({
  traceId: Joi.string().uuid().required(),
  timestamp: Joi.date().iso().required(),
  agentName: Joi.string().required(),
  action: Joi.string().required(),
  input: Joi.object().required(),
  output: Joi.object().required(),
  confidence: Joi.number().min(0).max(1).required(),
  processingTimeMs: Joi.number().integer().min(0).required(),
  errorDetails: Joi.string().optional(),
  schemaVersion: Joi.string().default('v1')
});

// ===== VALIDATION CONTRACTS =====

const RuleEngineResult = Joi.object({
  ruleId: Joi.string().required(),
  ruleName: Joi.string().required(),
  outcome: Joi.string().valid('STRICT_PASS', 'STRICT_FAIL', 'SOFT_WARN').required(),
  message: Joi.string().required(),
  confidence: Joi.number().min(0).max(1).required(),
  applicable: Joi.boolean().required()
});

const ValidationResult = Joi.object({
  overall: Joi.string().valid('STRICT_PASS', 'STRICT_FAIL', 'SOFT_WARN').required(),
  rules: Joi.array().items(RuleEngineResult).required(),
  confidence: Joi.number().min(0).max(1).required(),
  humanReviewRequired: Joi.boolean().required(),
  recommendations: Joi.array().items(Joi.string()).required()
});

const ConfidenceCalculation = Joi.object({
  parserMethod: Joi.number().min(0).max(1).required(),
  schemaConformance: Joi.number().min(0).max(1).required(),
  ruleOutcome: Joi.number().min(0).max(1).required(),
  modelReliability: Joi.number().min(0).max(1).required(),
  historicalAgreement: Joi.number().min(0).max(1).required(),
  finalConfidence: Joi.number().min(0).max(1).required(),
  breakdown: Joi.object().pattern(Joi.string(), Joi.number()).required()
});

// ===== ORCHESTRATION CONTRACTS =====

const ProcessingBudget = Joi.object({
  maxLatencyMs: Joi.number().integer().min(100).max(30000).required(),
  maxSteps: Joi.number().integer().min(1).max(10).required(),
  maxTokens: Joi.number().integer().min(100).max(10000).required(),
  maxCostUsd: Joi.number().min(0.01).max(10.0).required()
});

const ProcessingContext = Joi.object({
  traceId: Joi.string().uuid().required(),
  schemaVersion: Joi.string().default('v1'),
  model: Joi.string().required(),
  toolVersions: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  inputHash: Joi.string().length(64).required(),
  budget: ProcessingBudget.required(),
  startTime: Joi.date().iso().required(),
  enterpriseId: Joi.string().uuid().required(),
  userId: Joi.string().uuid().optional()
});

const ProcessingResult = Joi.object({
  success: Joi.boolean().required(),
  result: Joi.object().optional(),
  error: Joi.string().optional(),
  traceId: Joi.string().uuid().required(),
  processingTimeMs: Joi.number().integer().min(0).required(),
  budgetUsed: Joi.object({
    latencyMs: Joi.number().integer().min(0).required(),
    steps: Joi.number().integer().min(0).required(),
    tokens: Joi.number().integer().min(0).required(),
    costUsd: Joi.number().min(0).required()
  }).required(),
  confidence: Joi.number().min(0).max(1).required(),
  humanReviewRequired: Joi.boolean().required()
});

// ===== OBSERVABILITY CONTRACTS =====

const SLOMetrics = Joi.object({
  parsingSuccessRate: Joi.number().min(0).max(1).required(),
  schemaValidationPassRate: Joi.number().min(0).max(1).required(),
  ruleEngineStrictPassRate: Joi.number().min(0).max(1).required(),
  humanReviewRate: Joi.number().min(0).max(1).required(),
  timestamp: Joi.date().iso().required(),
  timeWindow: Joi.string().default('1h')
});

const DriftMetrics = Joi.object({
  agentSchemaFailRate: Joi.number().min(0).max(1).required(),
  humanInterventionRate: Joi.number().min(0).max(1).required(),
  confidenceDrift: Joi.number().min(-1).max(1).required(),
  processingTimeDrift: Joi.number().min(-1).max(1).required(),
  timestamp: Joi.date().iso().required(),
  timeWindow: Joi.string().default('1h')
});

// ===== VALIDATION HELPERS =====

function validateInput(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map(detail => `${detail.path.join('.')}: ${detail.message}`).join(', ');
    throw new Error(`Schema validation failed: ${errorMessages}`);
  }
  return value;
}

function validateOutput(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map(detail => `${detail.path.join('.')}: ${detail.message}`).join(', ');
    throw new Error(`Output validation failed: ${errorMessages}`);
  }
  return value;
}

// ===== SCHEMA VERSIONING =====

const SCHEMA_VERSIONS = {
  v1: '2024-01-01',
  v2: '2024-02-01' // Future version
};

function getSchemaVersion() {
  return 'v1';
}

function isSchemaVersionSupported(version) {
  return version in SCHEMA_VERSIONS;
}

module.exports = {
  // Input contracts
  PolicyDocIn,
  ToolSubmissionIn,
  ComplianceRequestIn,
  
  // Output contracts
  ParsedDocOut,
  PolicyDecision,
  ToolAnalysis,
  AuditTrailEntry,
  
  // Validation contracts
  RuleEngineResult,
  ValidationResult,
  ConfidenceCalculation,
  
  // Orchestration contracts
  ProcessingBudget,
  ProcessingContext,
  ProcessingResult,
  
  // Observability contracts
  SLOMetrics,
  DriftMetrics,
  
  // Helper functions
  validateInput,
  validateOutput,
  getSchemaVersion,
  isSchemaVersionSupported,
  SCHEMA_VERSIONS
};