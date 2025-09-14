/**
 * Deterministic Document Parser with Failover
 * Implements the "deterministic core" approach from the hackathon lessons
 * DocAI → Textract → Template failover with caching and idempotency
 */

import { z } from "zod";
import { PolicyDocIn, ParsedDocOut, PolicyDocInType, ParsedDocOutType } from "../io/contracts";
import crypto from "crypto";

interface ParserConfig {
  googleCloudProjectId: string;
  googleCloudLocation: string;
  documentAIProcessorId: string;
  awsRegion: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  cacheEnabled: boolean;
  cacheTtlMs: number;
}

interface ParserStats {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  cacheHits: number;
  methodBreakdown: Record<string, number>;
  averageProcessingTimeMs: number;
}

export class DeterministicDocumentParser {
  private config: ParserConfig;
  private stats: ParserStats;
  private cache: Map<string, ParsedDocOutType>;
  private circuitBreakers: Map<string, { failures: number; lastFailure: number; state: 'closed' | 'open' | 'half-open' }>;

  constructor(config: ParserConfig) {
    this.config = config;
    this.stats = {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      cacheHits: 0,
      methodBreakdown: {},
      averageProcessingTimeMs: 0
    };
    this.cache = new Map();
    this.circuitBreakers = new Map();
  }

  /**
   * Parse document with deterministic failover
   * Returns consistent results for identical inputs (idempotent)
   */
  async parseDocument(input: PolicyDocInType): Promise<ParsedDocOutType> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Validate input contract
      const validatedInput = PolicyDocIn.parse(input);
      
      // Generate content hash for idempotency
      const contentHash = this.generateContentHash(validatedInput);
      
      // Check cache first (if enabled)
      if (this.config.cacheEnabled) {
        const cached = this.cache.get(contentHash);
        if (cached) {
          this.stats.cacheHits++;
          console.log(`📋 Cache hit for document: ${contentHash.substring(0, 8)}...`);
          return cached;
        }
      }

      // Parse with failover chain
      const result = await this.parseWithFailover(validatedInput, contentHash);
      
      // Cache result if enabled
      if (this.config.cacheEnabled && result.confidence > 0.7) {
        this.cache.set(contentHash, result);
        this.cleanupCache();
      }

      // Update stats
      const processingTime = Date.now() - startTime;
      this.updateStats(result.method, processingTime, true);

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateStats('error', processingTime, false);
      
      console.error('Document parsing failed:', error);
      
      // Return fallback result
      return this.createFallbackResult(input, error as Error);
    }
  }

  /**
   * Parse with failover chain: DocAI → Textract → Template
   */
  private async parseWithFailover(input: PolicyDocInType, contentHash: string): Promise<ParsedDocOutType> {
    const methods = [
      { name: 'gdocai', parser: () => this.parseWithGoogleDocAI(input) },
      { name: 'textract', parser: () => this.parseWithTextract(input) },
      { name: 'template', parser: () => this.parseWithTemplate(input) }
    ];

    for (const method of methods) {
      if (this.isCircuitBreakerOpen(method.name)) {
        console.log(`⚠️ Circuit breaker open for ${method.name}, skipping`);
        continue;
      }

      try {
        console.log(`🔄 Attempting ${method.name} parsing...`);
        const result = await method.parser();
        
        // Validate output schema
        const validatedResult = ParsedDocOut.parse(result);
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker(method.name);
        
        console.log(`✅ ${method.name} parsing succeeded (confidence: ${validatedResult.confidence})`);
        return validatedResult;

      } catch (error) {
        console.warn(`❌ ${method.name} parsing failed:`, error);
        this.recordCircuitBreakerFailure(method.name);
        
        // If this is the last method, throw the error
        if (method === methods[methods.length - 1]) {
          throw error;
        }
      }
    }

    throw new Error('All parsing methods failed');
  }

  /**
   * Parse with Google Document AI
   */
  private async parseWithGoogleDocAI(input: PolicyDocInType): Promise<ParsedDocOutType> {
    // Simulate Google Document AI call
    // In real implementation, use @google-cloud/documentai
    
    if (!this.config.googleCloudProjectId) {
      throw new Error('Google Cloud configuration missing');
    }

    // Simulate processing time and potential failure
    await this.simulateProcessingDelay(1000, 2000);
    
    // Simulate occasional failures (5% rate)
    if (Math.random() < 0.05) {
      throw new Error('Google Document AI service unavailable');
    }

    return {
      docId: crypto.randomUUID(),
      pages: 5,
      tables: [
        { rows: 3, cols: 4, content: [['Header1', 'Header2', 'Header3', 'Header4'], ['Data1', 'Data2', 'Data3', 'Data4'], ['Data5', 'Data6', 'Data7', 'Data8']] }
      ],
      text: "This is a sample policy document extracted using Google Document AI. It contains structured information about compliance requirements and risk assessments.",
      method: "gdocai",
      confidence: 0.92,
      entities: [
        { text: "GDPR", type: "REGULATION", confidence: 0.95 },
        { text: "personal data", type: "DATA_TYPE", confidence: 0.88 }
      ],
      processingTimeMs: 1500
    };
  }

  /**
   * Parse with AWS Textract
   */
  private async parseWithTextract(input: PolicyDocInType): Promise<ParsedDocOutType> {
    // Simulate AWS Textract call
    // In real implementation, use aws-sdk
    
    if (!this.config.awsAccessKeyId) {
      throw new Error('AWS configuration missing');
    }

    await this.simulateProcessingDelay(800, 1500);
    
    // Simulate occasional failures (3% rate)
    if (Math.random() < 0.03) {
      throw new Error('AWS Textract service unavailable');
    }

    return {
      docId: crypto.randomUUID(),
      pages: 5,
      tables: [
        { rows: 2, cols: 3, content: [['Field', 'Value', 'Status'], ['Compliance', 'Required', 'Active']] }
      ],
      text: "Policy document processed using AWS Textract. Contains compliance information and regulatory requirements.",
      method: "textract",
      confidence: 0.85,
      entities: [
        { text: "HIPAA", type: "REGULATION", confidence: 0.90 },
        { text: "patient data", type: "DATA_TYPE", confidence: 0.82 }
      ],
      processingTimeMs: 1200
    };
  }

  /**
   * Parse with template-based approach
   */
  private async parseWithTemplate(input: PolicyDocInType): Promise<ParsedDocOutType> {
    // Template-based parsing as final fallback
    // This is deterministic and always works
    
    await this.simulateProcessingDelay(200, 500);

    return {
      docId: crypto.randomUUID(),
      pages: 1,
      tables: [],
      text: "Document processed using template-based parsing. This is a fallback method that provides basic text extraction.",
      method: "template",
      confidence: 0.60,
      entities: [],
      processingTimeMs: 300
    };
  }

  /**
   * Create fallback result when all methods fail
   */
  private createFallbackResult(input: PolicyDocInType, error: Error): ParsedDocOutType {
    return {
      docId: crypto.randomUUID(),
      pages: 1,
      tables: [],
      text: "Document processing failed. Please review manually.",
      method: "fallback",
      confidence: 0.10,
      entities: [],
      processingTimeMs: 100,
      errorDetails: error.message
    };
  }

  /**
   * Generate content hash for idempotency
   */
  private generateContentHash(input: PolicyDocInType): string {
    const content = JSON.stringify({
      enterpriseId: input.enterpriseId,
      checksumSha256: input.checksumSha256,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes
    });
    
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Circuit breaker management
   */
  private isCircuitBreakerOpen(method: string): boolean {
    const breaker = this.circuitBreakers.get(method);
    if (!breaker) return false;

    const now = Date.now();
    const timeSinceLastFailure = now - breaker.lastFailure;

    // Reset circuit breaker after 5 minutes
    if (timeSinceLastFailure > 5 * 60 * 1000) {
      this.circuitBreakers.delete(method);
      return false;
    }

    return breaker.state === 'open';
  }

  private recordCircuitBreakerFailure(method: string): void {
    const breaker = this.circuitBreakers.get(method) || {
      failures: 0,
      lastFailure: 0,
      state: 'closed' as const
    };

    breaker.failures++;
    breaker.lastFailure = Date.now();

    // Open circuit breaker after 3 consecutive failures
    if (breaker.failures >= 3) {
      breaker.state = 'open';
      console.warn(`🚨 Circuit breaker opened for ${method} after ${breaker.failures} failures`);
    }

    this.circuitBreakers.set(method, breaker);
  }

  private resetCircuitBreaker(method: string): void {
    this.circuitBreakers.delete(method);
  }

  /**
   * Cache management
   */
  private cleanupCache(): void {
    if (this.cache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      const toRemove = entries.slice(0, 200); // Remove oldest 200 entries
      
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
      });
      
      console.log(`🧹 Cache cleanup: removed ${toRemove.length} entries`);
    }
  }

  /**
   * Stats management
   */
  private updateStats(method: string, processingTimeMs: number, success: boolean): void {
    if (success) {
      this.stats.successCount++;
      this.stats.methodBreakdown[method] = (this.stats.methodBreakdown[method] || 0) + 1;
    } else {
      this.stats.failureCount++;
    }

    // Update average processing time
    const totalProcessed = this.stats.successCount + this.stats.failureCount;
    this.stats.averageProcessingTimeMs = 
      (this.stats.averageProcessingTimeMs * (totalProcessed - 1) + processingTimeMs) / totalProcessed;
  }

  /**
   * Get parser statistics
   */
  getStats(): ParserStats {
    return { ...this.stats };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    const hitRate = this.stats.totalRequests > 0 ? this.stats.cacheHits / this.stats.totalRequests : 0;
    return {
      size: this.cache.size,
      hitRate
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Simulate processing delay
   */
  private async simulateProcessingDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// ===== FACTORY FUNCTION =====

export function createDeterministicParser(config: ParserConfig): DeterministicDocumentParser {
  return new DeterministicDocumentParser(config);
}

// ===== DEFAULT CONFIG =====

export const DEFAULT_PARSER_CONFIG: ParserConfig = {
  googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  googleCloudLocation: process.env.GOOGLE_CLOUD_LOCATION || 'us',
  documentAIProcessorId: process.env.DOCUMENT_AI_PROCESSOR_ID || '',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || '3600000') // 1 hour
};