/**
 * Enhanced Document Processing API Routes
 * Uses deterministic core with schema validation and audit trails
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const DeterministicDocumentParser = require('../../services/document-processing/deterministic-parser');
const schemaValidationMiddleware = require('../middleware/schema-validation');
const { checkJwt, requirePermission } = require('../auth/auth0-middleware');
const crypto = require('crypto');

// Initialize document parser
const documentParser = new DeterministicDocumentParser();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, and TXT files are allowed.'));
    }
  }
});

/**
 * POST /api/enhanced-document-processing/parse
 * Parse a document using deterministic core with failover
 */
router.post('/parse',
  checkJwt,
  requirePermission('document:process'),
  upload.single('document'),
  schemaValidationMiddleware.validateSchema(require('../../services/io/contracts').PolicyDocIn),
  async (req, res) => {
    const traceId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No document file provided',
          code: 'NO_FILE',
          traceId
        });
      }

      const { mimeType, buffer, originalname, size } = req.file;
      const { enterpriseId, partnerId } = req.validatedInput;

      console.log(`📄 Processing document: ${originalname} (${mimeType}) for enterprise: ${enterpriseId}`);

      // Generate checksum for idempotency
      const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      // Create input for deterministic parser
      const parserInput = {
        enterpriseId,
        partnerId,
        mimeType,
        checksumSha256,
        sizeBytes: size,
        redactionStatus: req.body.redactionStatus || 'none',
        phiToggle: req.body.phiToggle || false,
        priority: req.body.priority || 'medium'
      };

      // Parse document with deterministic core
      const result = await documentParser.parseDocument(parserInput);

      // Create response with audit trail
      const response = {
        success: true,
        data: {
          traceId,
          documentId: result.docId,
          extractedText: result.text,
          entities: result.entities,
          tables: result.tables,
          confidence: result.confidence,
          processingMethod: result.method,
          processingTimeMs: result.processingTimeMs,
          metadata: {
            originalName: originalname,
            mimeType,
            sizeBytes: size,
            pages: result.pages,
            checksumSha256
          },
          errorDetails: result.errorDetails
        },
        processingStats: {
          traceId,
          processingTimeMs: Date.now() - startTime,
          parserStats: documentParser.getStats(),
          cacheStats: documentParser.getCacheStats()
        }
      };

      console.log(`✅ Document processing completed for trace ${traceId} (method: ${result.method}, confidence: ${result.confidence})`);
      
      res.json(response);

    } catch (error) {
      console.error(`❌ Document processing failed for trace ${traceId}:`, error);
      
      res.status(500).json({
        error: 'Document processing failed',
        message: error.message,
        code: 'PROCESSING_ERROR',
        traceId,
        processingTimeMs: Date.now() - startTime
      });
    }
  }
);

/**
 * POST /api/enhanced-document-processing/batch-parse
 * Parse multiple documents in batch
 */
router.post('/batch-parse',
  checkJwt,
  requirePermission('document:process'),
  upload.array('documents', 10), // Max 10 files
  async (req, res) => {
    const traceId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No document files provided',
          code: 'NO_FILES',
          traceId
        });
      }

      const { enterpriseId, partnerId } = req.body;

      console.log(`📄 Processing ${req.files.length} documents in batch for enterprise: ${enterpriseId}`);

      const results = await Promise.allSettled(
        req.files.map(async (file) => {
          try {
            // Generate checksum for idempotency
            const checksumSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

            // Create input for deterministic parser
            const parserInput = {
              enterpriseId,
              partnerId,
              mimeType: file.mimetype,
              checksumSha256,
              sizeBytes: file.size,
              redactionStatus: 'none',
              phiToggle: false,
              priority: 'medium'
            };

            // Parse document
            const result = await documentParser.parseDocument(parserInput);

            return {
              fileName: file.originalname,
              success: true,
              data: result
            };

          } catch (error) {
            return {
              fileName: file.originalname,
              success: false,
              error: error.message
            };
          }
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).map(r => r.value);
      const failed = results.filter(r => r.status === 'rejected' || !r.value.success).map(r => r.value);

      const response = {
        success: true,
        data: {
          traceId,
          total: req.files.length,
          successful: successful.length,
          failed: failed.length,
          results: [...successful, ...failed]
        },
        processingStats: {
          traceId,
          processingTimeMs: Date.now() - startTime,
          parserStats: documentParser.getStats(),
          cacheStats: documentParser.getCacheStats()
        }
      };

      console.log(`✅ Batch processing completed for trace ${traceId}: ${successful.length}/${req.files.length} successful`);
      
      res.json(response);

    } catch (error) {
      console.error(`❌ Batch processing failed for trace ${traceId}:`, error);
      
      res.status(500).json({
        error: 'Batch processing failed',
        message: error.message,
        code: 'BATCH_PROCESSING_ERROR',
        traceId,
        processingTimeMs: Date.now() - startTime
      });
    }
  }
);

/**
 * GET /api/enhanced-document-processing/status/:traceId
 * Get processing status of a document
 */
router.get('/status/:traceId',
  checkJwt,
  requirePermission('document:read'),
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
          message: 'Document processing completed',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        error: 'Failed to check document status',
        message: error.message,
        code: 'STATUS_CHECK_ERROR'
      });
    }
  }
);

/**
 * GET /api/enhanced-document-processing/stats
 * Get document processing statistics
 */
router.get('/stats',
  checkJwt,
  requirePermission('document:read'),
  async (req, res) => {
    try {
      const stats = documentParser.getStats();
      const cacheStats = documentParser.getCacheStats();
      const healthCheck = await documentParser.healthCheck();

      res.json({
        success: true,
        data: {
          parserStats: stats,
          cacheStats,
          healthCheck,
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
 * POST /api/enhanced-document-processing/clear-cache
 * Clear document processing cache
 */
router.post('/clear-cache',
  checkJwt,
  requirePermission('document:admin'),
  async (req, res) => {
    try {
      documentParser.clearCache();

      res.json({
        success: true,
        data: {
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({
        error: 'Failed to clear cache',
        message: error.message,
        code: 'CACHE_CLEAR_ERROR'
      });
    }
  }
);

/**
 * GET /api/enhanced-document-processing/health
 * Health check endpoint
 */
router.get('/health',
  async (req, res) => {
    try {
      const healthCheck = await documentParser.healthCheck();
      const validationStats = schemaValidationMiddleware.getValidationStats();

      res.json({
        success: true,
        data: {
          documentParser: healthCheck,
          schemaValidation: validationStats,
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

module.exports = router;