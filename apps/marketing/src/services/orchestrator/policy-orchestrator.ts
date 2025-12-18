/**
 * Policy Processing Orchestrator
 * Implements the complete deterministic pipeline with circuit breakers and audit trails
 */
import { 
  PolicyDocument, 
  AgentDecision, 
  PolicyDocumentSchema,
  AgentDecisionSchema 
} from '@/contracts';
import { DeterministicProcessor } from '../processing/deterministic-processor';
import { DeterministicValidator } from '../validation/deterministic-validator';
import { AuditService } from '../audit/audit-service';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface ProcessingOptions {
  timeoutMs?: number;
  forceReprocess?: boolean;
  bypassValidation?: boolean;
}

interface ProcessingResult {
  traceId: string;
  finalOutcome: 'APPROVED' | 'REJECTED' | 'HUMAN_IN_LOOP';
  confidence: number;
  processingTime: number;
}

// Simple circuit breaker for AI agent processing
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open - too many failures');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailure) < this.timeout;
  }

  private onSuccess(): void {
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
  }
}

const agentCircuitBreaker = new CircuitBreaker();

export class PolicyOrchestrator {
  
  /**
   * Main orchestration method that processes a policy document through the deterministic pipeline
   */
  static async processPolicy(
    inputDocument: unknown,
    enterpriseId: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const traceId = uuidv4();
    
    console.log(`[${traceId}] Starting policy processing for enterprise ${enterpriseId}`);

    try {
      // 1. STRICT INPUT VALIDATION
      const validatedInput = PolicyDocumentSchema.parse(inputDocument);
      console.log(`[${traceId}] Input validation passed`);

      // 2. DETERMINISTIC DOCUMENT PROCESSING
      const parsedDoc = await DeterministicProcessor.processDocument(
        validatedInput,
        { 
          forceReprocess: options.forceReprocess,
          timeoutMs: options.timeoutMs 
        }
      );
      console.log(`[${traceId}] Document processed using ${parsedDoc.parsingMethod}`);

      // 3. AI AGENT DECISION (with Circuit Breaker and Real Intelligence)
      const agentDecision = await agentCircuitBreaker.execute(async () => {
        return this.executeRealAgentDecision(parsedDoc, enterpriseId);
      });
      console.log(`[${traceId}] Agent decision: ${agentDecision.decision}`);

      // 4. DETERMINISTIC VALIDATION
      let validationResult;
      if (options.bypassValidation) {
        console.log(`[${traceId}] Validation bypassed`);
        validationResult = {
          ruleResults: [{ rule: 'VALIDATION_BYPASSED', outcome: 'STRICT_PASS' as const, message: 'Validation bypassed' }],
          finalConfidence: agentDecision.confidence,
          finalOutcome: agentDecision.decision === 'APPROVED' ? 'APPROVED' as const : 'REJECTED' as const,
          processedAt: new Date().toISOString(),
        };
      } else {
        validationResult = await DeterministicValidator.validate(
          agentDecision,
          parsedDoc,
          enterpriseId
        );
        console.log(`[${traceId}] Validation complete: ${validationResult.finalOutcome}`);
      }

      // 5. AUDIT TRAIL CREATION
      const auditTraceId = await AuditService.writeAuditTrail({
        enterpriseId,
        input: validatedInput,
        parsedDoc,
        agentDecision,
        validationResult,
        schemaVersion: 'v1.0',
        toolVersions: {
          'orchestrator': '1.0.0',
          'processor': '1.0.0',
          'validator': '1.0.0',
        },
      });

      const processingTime = Date.now() - startTime;
      console.log(`[${traceId}] Processing complete in ${processingTime}ms. Audit: ${auditTraceId}`);

      return {
        traceId: auditTraceId,
        finalOutcome: validationResult.finalOutcome,
        confidence: validationResult.finalConfidence,
        processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[${traceId}] Processing failed after ${processingTime}ms:`, error);
      
      // Log failure for audit
      try {
        await AuditService.writeAuditTrail({
          enterpriseId,
          input: inputDocument as any,
          parsedDoc: {
            docId: uuidv4(),
            inputChecksum: 'ERROR',
            extractedText: 'Processing failed',
            pages: 0,
            tablesFound: 0,
            parsingMethod: 'manual',
            parserConfidence: 0,
            processedAt: new Date().toISOString(),
          },
          agentDecision: {
            decision: 'REJECTED',
            rationale: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            requiredControls: [],
            confidence: 0,
            riskLevel: 'CRITICAL',
            processedAt: new Date().toISOString(),
          },
          validationResult: {
            ruleResults: [{ rule: 'PROCESSING_FAILED', outcome: 'STRICT_FAIL', message: 'System processing failure' }],
            finalConfidence: 0,
            finalOutcome: 'REJECTED',
            processedAt: new Date().toISOString(),
          },
          schemaVersion: 'v1.0',
          toolVersions: {
            'orchestrator': '1.0.0-error',
          },
        });
      } catch (auditError) {
        console.error('Failed to write failure audit trail:', auditError);
      }

      throw error;
    }
  }

  /**
   * Real AI agent decision making using sophisticated Cursor Agent Adapter
   */
  private static async executeRealAgentDecision(
    parsedDoc: any,
    enterpriseId: string
  ): Promise<AgentDecision> {
    
    try {
      console.log('🚀 Using REAL AI agents - No more mock logic!');

      // Call the new Cursor Agent Adapter directly with real AI
      const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://dqemokpnzasbeytdbzei.supabase.co';
      const supabaseKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZW1va3BuemFzYmV5dGRiemVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4Mzg0MzYsImV4cCI6MjA3MDQxNDQzNn0.pOE3ZySoh2h6gBq89_elFx2WanZ5PZe4ikaXxmwLQqk';

      const agentRequest = {
        agentName: 'policy',
        action: 'analyze',
        input: {
          title: 'Policy Document',
          content: parsedDoc.extractedText,
          type: 'policy_document',
          pages: parsedDoc.pages,
          extractionMethod: parsedDoc.parsingMethod,
          confidence: parsedDoc.parserConfidence
        },
        context: {
          enterpriseId,
          documentType: 'policy_document',
          timestamp: new Date().toISOString(),
          requestId: `orchestrator-${Date.now()}`,
          processingSource: 'policy-orchestrator'
        }
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify(agentRequest)
      });

      if (!response.ok) {
        console.warn('AI agent failed, using fallback logic');
        return this.fallbackAgentDecision(parsedDoc);
      }

      const aiResult = await response.json();
      
      if (!aiResult.success) {
        console.warn('AI processing failed:', aiResult.error);
        return this.fallbackAgentDecision(parsedDoc);
      }

      console.log('✅ Real AI decision completed with confidence:', aiResult.result.confidence);

      // Transform AI response to AgentDecision format
      const decision = aiResult.result.decision === 'approve' ? 'APPROVED' as const :
                      aiResult.result.decision === 'reject' ? 'REJECTED' as const :
                      'REJECTED' as const; // Conservative approach for unknown decisions

      const agentDecision: AgentDecision = {
        decision,
        rationale: aiResult.result.reasoning || 'AI analysis completed',
        requiredControls: aiResult.result.metadata?.recommendations || ['AI analysis completed'],
        confidence: Math.min(Math.max(aiResult.result.confidence, 0), 1), // Ensure 0-1 range
        riskLevel: (aiResult.result.riskLevel?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM',
        processedAt: new Date().toISOString(),
      };

      // Validate against schema before returning
      return AgentDecisionSchema.parse(agentDecision);
      
    } catch (error) {
      console.error('Real AI agent processing failed, falling back to basic analysis:', error);
      return this.fallbackAgentDecision(parsedDoc);
    }
  }

  /**
   * Determine overall risk level from multiple agent results
   */
  private static determineOverallRiskLevel(agentResults: any[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (!agentResults || agentResults.length === 0) return 'MEDIUM';
    
    const riskLevels = agentResults.map(r => r.riskLevel);
    
    if (riskLevels.includes('CRITICAL') || riskLevels.includes('HIGH')) return 'HIGH';
    if (riskLevels.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Fallback decision logic when agent coordination fails
   */
  private static fallbackAgentDecision(parsedDoc: any): AgentDecision {
    const content = parsedDoc.extractedText.toLowerCase();
    const hasRiskyTerms = ['unauthorized', 'violation', 'breach', 'illegal', 'non-compliant'].some(term => 
      content.includes(term)
    );

    const decision = hasRiskyTerms ? 'REJECTED' : 'APPROVED';
    const confidence = hasRiskyTerms ? 0.6 : 0.7; // Lower confidence for fallback
    const riskLevel = hasRiskyTerms ? 'HIGH' : content.includes('sensitive') ? 'MEDIUM' : 'LOW';

    return {
      decision: decision as 'APPROVED' | 'REJECTED',
      rationale: hasRiskyTerms 
        ? 'Fallback analysis: Document contains potentially risky terms requiring review'
        : 'Fallback analysis: Document appears to meet basic compliance requirements',
      requiredControls: hasRiskyTerms ? ['legal_review', 'compliance_check', 'manual_verification'] : ['standard_review'],
      confidence,
      riskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Gets processing statistics for monitoring
   */
  static getProcessingStats() {
    return {
      cacheStats: DeterministicProcessor.getCacheStats(),
      circuitBreakerStatus: {
        isOpen: agentCircuitBreaker['isOpen'](),
        failures: agentCircuitBreaker['failures'],
      },
    };
  }
}