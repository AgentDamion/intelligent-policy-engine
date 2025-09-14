/**
 * Enhanced Orchestrator API Routes
 * Integrates all production guardrails components
 */

const express = require('express');
const router = express.Router();
const EnhancedOrchestrator = require('../../orchestrator/enhanced');
const SLOMonitor = require('../../services/monitoring/slo-monitor');
const schemaValidationMiddleware = require('../middleware/schema-validation');
const { checkJwt, requirePermission } = require('../auth/auth0-middleware');

// Initialize orchestrator and SLO monitor
const orchestrator = new EnhancedOrchestrator();
const sloMonitor = new SLOMonitor();

/**
 * POST /api/enhanced-orchestrator/process-policy-document
 * Process policy document with full production guardrails
 */
router.post('/process-policy-document',
  checkJwt,
  requirePermission('policy:process'),
  schemaValidationMiddleware.validateSchema(require('../../services/io/contracts').PolicyDocIn),
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      console.log('📄 Processing policy document with production guardrails');
      
      const result = await orchestrator.processPolicyDocument(req.validatedInput);
      
      // Record metrics in SLO monitor
      sloMonitor.recordParsingSuccess(result.success, result.result?.parsedDoc?.method || 'unknown', result.processingTimeMs);
      sloMonitor.recordSchemaValidation(result.success);
      sloMonitor.recordHumanReview(result.humanReviewRequired, result.success ? 'normal_processing' : 'processing_error');
      
      if (result.success && result.result?.validationResult) {
        sloMonitor.recordRuleEngineValidation(
          result.result.validationResult.overall,
          result.result.validationResult.rules
        );
      }
      
      const response = {
        success: result.success,
        data: result.result,
        traceId: result.traceId,
        processingTimeMs: result.processingTimeMs,
        budgetUsed: result.budgetUsed,
        confidence: result.confidence,
        humanReviewRequired: result.humanReviewRequired,
        sloMetrics: sloMonitor.calculateCurrentSLOs()
      };

      if (result.success) {
        console.log(`✅ Policy document processing completed: ${result.traceId} (${result.processingTimeMs}ms, confidence: ${result.confidence.toFixed(3)})`);
        res.json(response);
      } else {
        console.error(`❌ Policy document processing failed: ${result.traceId} - ${result.error}`);
        res.status(500).json({
          ...response,
          error: result.error
        });
      }

    } catch (error) {
      console.error('❌ Policy document processing error:', error);
      
      // Record failure metrics
      sloMonitor.recordParsingSuccess(false, 'error', Date.now() - startTime);
      sloMonitor.recordSchemaValidation(false, 'processing_error');
      sloMonitor.recordHumanReview(true, 'processing_error');
      
      res.status(500).json({
        success: false,
        error: 'Policy document processing failed',
        message: error.message,
        code: 'PROCESSING_ERROR',
        processingTimeMs: Date.now() - startTime,
        humanReviewRequired: true
      });
    }
  }
);

/**
 * POST /api/enhanced-orchestrator/process-tool-submission
 * Process tool submission with full production guardrails
 */
router.post('/process-tool-submission',
  checkJwt,
  requirePermission('tool:submit'),
  schemaValidationMiddleware.validateSchema(require('../../services/io/contracts').ToolSubmissionIn),
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      console.log('🛠️ Processing tool submission with production guardrails');
      
      const result = await orchestrator.processToolSubmission(req.validatedInput);
      
      // Record metrics in SLO monitor
      sloMonitor.recordSchemaValidation(result.success);
      sloMonitor.recordHumanReview(result.humanReviewRequired, result.success ? 'normal_processing' : 'processing_error');
      
      if (result.success && result.result?.validationResult) {
        sloMonitor.recordRuleEngineValidation(
          result.result.validationResult.overall,
          result.result.validationResult.rules
        );
      }
      
      const response = {
        success: result.success,
        data: result.result,
        traceId: result.traceId,
        processingTimeMs: result.processingTimeMs,
        budgetUsed: result.budgetUsed,
        confidence: result.confidence,
        humanReviewRequired: result.humanReviewRequired,
        sloMetrics: sloMonitor.calculateCurrentSLOs()
      };

      if (result.success) {
        console.log(`✅ Tool submission processing completed: ${result.traceId} (${result.processingTimeMs}ms, confidence: ${result.confidence.toFixed(3)})`);
        res.json(response);
      } else {
        console.error(`❌ Tool submission processing failed: ${result.traceId} - ${result.error}`);
        res.status(500).json({
          ...response,
          error: result.error
        });
      }

    } catch (error) {
      console.error('❌ Tool submission processing error:', error);
      
      // Record failure metrics
      sloMonitor.recordSchemaValidation(false, 'processing_error');
      sloMonitor.recordHumanReview(true, 'processing_error');
      
      res.status(500).json({
        success: false,
        error: 'Tool submission processing failed',
        message: error.message,
        code: 'PROCESSING_ERROR',
        processingTimeMs: Date.now() - startTime,
        humanReviewRequired: true
      });
    }
  }
);

/**
 * GET /api/enhanced-orchestrator/status/:traceId
 * Get processing status for a trace ID
 */
router.get('/status/:traceId',
  checkJwt,
  requirePermission('orchestrator:read'),
  async (req, res) => {
    try {
      const { traceId } = req.params;
      
      // In a real implementation, this would check a processing queue or database
      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          traceId,
          status: 'completed',
          progress: 100,
          message: 'Processing completed',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        error: 'Failed to check processing status',
        message: error.message,
        code: 'STATUS_CHECK_ERROR'
      });
    }
  }
);

/**
 * GET /api/enhanced-orchestrator/slo-metrics
 * Get current SLO metrics and violations
 */
router.get('/slo-metrics',
  checkJwt,
  requirePermission('orchestrator:read'),
  async (req, res) => {
    try {
      const slos = sloMonitor.calculateCurrentSLOs();
      const violations = sloMonitor.checkSLOViolations();
      const drift = sloMonitor.calculateDriftMetrics();
      
      res.json({
        success: true,
        data: {
          slos,
          violations: violations.violations,
          drift,
          alertThresholds: sloMonitor.alertThresholds,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('SLO metrics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve SLO metrics',
        message: error.message,
        code: 'SLO_METRICS_ERROR'
      });
    }
  }
);

/**
 * GET /api/enhanced-orchestrator/stats
 * Get comprehensive orchestrator statistics
 */
router.get('/stats',
  checkJwt,
  requirePermission('orchestrator:read'),
  async (req, res) => {
    try {
      const orchestratorStats = orchestrator.getStats();
      const sloMetrics = sloMonitor.getMonitoringReport();
      
      res.json({
        success: true,
        data: {
          orchestrator: orchestratorStats,
          slo: sloMetrics,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Stats retrieval error:', error);
      res.status(500).json({
        error: 'Failed to retrieve statistics',
        message: error.message,
        code: 'STATS_ERROR'
      });
    }
  }
);

/**
 * GET /api/enhanced-orchestrator/health
 * Comprehensive health check
 */
router.get('/health',
  async (req, res) => {
    try {
      const orchestratorHealth = await orchestrator.healthCheck();
      const sloMonitorHealth = await sloMonitor.healthCheck();
      
      const overallHealthy = orchestratorHealth.healthy && sloMonitorHealth.healthy;
      
      res.json({
        success: true,
        data: {
          healthy: overallHealthy,
          orchestrator: orchestratorHealth,
          sloMonitor: sloMonitorHealth,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        error: 'Health check failed',
        message: error.message,
        code: 'HEALTH_CHECK_ERROR'
      });
    }
  }
);

/**
 * POST /api/enhanced-orchestrator/reset-metrics
 * Reset all metrics (admin only)
 */
router.post('/reset-metrics',
  checkJwt,
  requirePermission('orchestrator:admin'),
  async (req, res) => {
    try {
      // Reset SLO monitor
      sloMonitor.cleanupOldMetrics();
      
      res.json({
        success: true,
        data: {
          message: 'Metrics reset successfully',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Metrics reset error:', error);
      res.status(500).json({
        error: 'Failed to reset metrics',
        message: error.message,
        code: 'METRICS_RESET_ERROR'
      });
    }
  }
);

module.exports = router;