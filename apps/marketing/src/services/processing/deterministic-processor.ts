/**
 * Deterministic Document Processing Service
 * Handles document parsing with failover and caching for idempotent results
 */
import { ParsedDocument, PolicyDocument, ParsedDocumentSchema } from '@/contracts';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Content-based cache for idempotent results
const processingCache = new Map<string, ParsedDocument>();

interface ProcessingOptions {
  forceReprocess?: boolean;
  timeoutMs?: number;
}

export class DeterministicProcessor {
  
  /**
   * Processes a document with deterministic parsing and caching
   */
  static async processDocument(
    document: PolicyDocument,
    options: ProcessingOptions = {}
  ): Promise<ParsedDocument> {
    const { forceReprocess = false, timeoutMs = 30000 } = options;
    const cacheKey = document.checksumSha256;

    // Check cache first for idempotent results
    if (!forceReprocess && processingCache.has(cacheKey)) {
      console.log(`CACHE HIT: Returning processed document for checksum ${cacheKey}`);
      return processingCache.get(cacheKey)!;
    }

    let result: Partial<ParsedDocument>;

    try {
      // Primary: AI Agent Processing
      console.log('🤖 Attempting AI agent processing...');
      result = await this.processWithAIAgent(document, timeoutMs);
      result.parsingMethod = 'ai-agent';
      result.parserConfidence = 0.9;
      
    } catch (aiError) {
      console.warn('AI agent processing failed. Falling back to template parsing.', aiError);
      
      try {
        // Fallback: Template-based processing
        console.log('📝 Attempting template-based processing...');
        result = await this.processWithTemplate(document);
        result.parsingMethod = 'template-fallback';
        result.parserConfidence = 0.6;
        
      } catch (templateError) {
        console.error('Template processing failed. Using manual processing.', templateError);
        
        // Last resort: Manual processing stub
        result = await this.processManually(document);
        result.parsingMethod = 'manual';
        result.parserConfidence = 0.3;
      }
    }

    // Structure final output
    const finalOutput: ParsedDocument = {
      docId: uuidv4(),
      inputChecksum: document.checksumSha256,
      extractedText: result.extractedText || document.content,
      pages: result.pages || 1,
      tablesFound: result.tablesFound || 0,
      parsingMethod: result.parsingMethod!,
      parserConfidence: result.parserConfidence!,
      processedAt: new Date().toISOString(),
    };

    // Validate against schema
    const validatedOutput = ParsedDocumentSchema.parse(finalOutput);

    // Cache successful result
    processingCache.set(cacheKey, validatedOutput);
    console.log(`CACHE MISS: Stored processed document for checksum ${cacheKey}`);

    return validatedOutput;
  }

  /**
   * Primary processing method using AI agents
   */
  private static async processWithAIAgent(
    document: PolicyDocument,
    timeoutMs: number
  ): Promise<Partial<ParsedDocument>> {
    // Simulate AI processing with timeout
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('AI agent processing timeout'));
      }, timeoutMs);

      // Simulate processing
      setTimeout(() => {
        clearTimeout(timer);
        
        if (Math.random() > 0.8) { // 20% failure rate for demo
          reject(new Error('AI agent processing failed'));
          return;
        }

        resolve({
          extractedText: document.content,
          pages: Math.ceil(document.content.length / 1000),
          tablesFound: (document.content.match(/table|column|row/gi) || []).length,
        });
      }, 1000);
    });
  }

  /**
   * Fallback processing using templates
   */
  private static async processWithTemplate(
    document: PolicyDocument
  ): Promise<Partial<ParsedDocument>> {
    // Simple template-based processing
    return {
      extractedText: document.content,
      pages: Math.ceil(document.content.length / 1200),
      tablesFound: Math.max(0, (document.content.match(/\|/g) || []).length - 1),
    };
  }

  /**
   * Manual processing as last resort
   */
  private static async processManually(
    document: PolicyDocument
  ): Promise<Partial<ParsedDocument>> {
    return {
      extractedText: document.content,
      pages: 1,
      tablesFound: 0,
    };
  }

  /**
   * Clear processing cache
   */
  static clearCache(): void {
    processingCache.clear();
    console.log('Processing cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: processingCache.size,
      entries: Array.from(processingCache.keys()),
    };
  }
}