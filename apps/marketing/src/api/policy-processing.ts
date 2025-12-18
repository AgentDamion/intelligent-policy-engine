/**
 * API Route: Policy Processing
 * Exposes the deterministic processing pipeline via REST API
 */
import { PolicyOrchestrator } from '@/services/orchestrator/policy-orchestrator';
import { PolicyDocumentSchema } from '@/contracts';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export class PolicyProcessingAPI {
  
  /**
   * Process a policy document through the deterministic pipeline
   */
  static async processDocument(request: {
    document: unknown;
    enterpriseId: string;
    options?: {
      timeoutMs?: number;
      forceReprocess?: boolean;
      bypassValidation?: boolean;
    };
  }) {
    const { handleError } = useErrorHandler();
    
    try {
      // Validate enterprise ID
      if (!request.enterpriseId) {
        throw new Error('Enterprise ID is required');
      }

      console.log(`Processing policy document for enterprise: ${request.enterpriseId}`);
      
      const result = await PolicyOrchestrator.processPolicy(
        request.document,
        request.enterpriseId,
        request.options
      );

      return {
        success: true,
        data: result,
        message: `Document processed successfully with outcome: ${result.finalOutcome}`,
      };

    } catch (error) {
      console.error('Policy processing API error:', error);
      
      return handleError(error, 'PolicyProcessingAPI.processDocument', {
        showToast: false,
        fallbackMessage: 'Failed to process policy document',
      });
    }
  }

  /**
   * Get processing statistics for monitoring
   */
  static getProcessingStats() {
    try {
      const stats = PolicyOrchestrator.getProcessingStats();
      
      return {
        success: true,
        data: {
          ...stats,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Failed to get processing stats:', error);
      return {
        success: false,
        error: 'Failed to retrieve processing statistics',
      };
    }
  }

  /**
   * Validate a document against the schema without processing
   */
  static validateDocument(document: unknown) {
    try {
      const validated = PolicyDocumentSchema.parse(document);
      
      return {
        success: true,
        data: {
          valid: true,
          document: validated,
        },
        message: 'Document is valid',
      };
    } catch (error) {
      return {
        success: false,
        data: {
          valid: false,
          errors: error instanceof Error ? error.message : 'Validation failed',
        },
        message: 'Document validation failed',
      };
    }
  }

  /**
   * Test the processing pipeline with a sample document
   */
  static async testPipeline(enterpriseId: string) {
    const sampleDocument = {
      id: 'test-' + Date.now(),
      enterpriseId,
      title: 'Test Policy Document',
      content: 'This is a test policy document for validating the processing pipeline. It contains standard compliance language and should pass validation.',
      mimeType: 'text/plain' as const,
      checksumSha256: 'a'.repeat(64), // Sample checksum
      hasPHI: false,
      metadata: {
        test: true,
        created: new Date().toISOString(),
      },
    };

    return this.processDocument({
      document: sampleDocument,
      enterpriseId,
      options: {
        timeoutMs: 10000,
        forceReprocess: true,
      },
    });
  }
}