/**
 * Document Processing API Routes
 * Handles document upload, processing, and extraction
 */

const express = require('express');
const router = express.Router();
const documentProcessingService = require('../services/document-processing');
const searchEngineService = require('../services/search-engine');
const { checkJwt, requirePermission } = require('../auth/auth0-middleware');

// Middleware for document upload
const upload = documentProcessingService.getUploadMiddleware();

/**
 * POST /api/document-processing/upload
 * Upload and process a document
 */
router.post('/upload', 
    checkJwt,
    requirePermission('document:upload'),
    upload.single('document'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No document file provided',
                    code: 'NO_FILE'
                });
            }

            const { mimeType, buffer, originalname } = req.file;
            const { 
                includeAIAnalysis = false, 
                analysisType = 'general',
                indexForSearch = true,
                metadata = {}
            } = req.body;

            console.log(`📄 Processing document: ${originalname} (${mimeType})`);

            // Process the document
            const result = await documentProcessingService.processDocument(
                buffer, 
                mimeType, 
                { 
                    includeAIAnalysis, 
                    analysisType,
                    metadata: {
                        ...metadata,
                        originalName: originalname,
                        uploadedBy: req.user.sub,
                        uploadedAt: new Date().toISOString()
                    }
                }
            );

            // Index for search if requested
            if (indexForSearch) {
                try {
                    await searchEngineService.addDocument({
                        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        title: originalname,
                        content: result.text,
                        type: 'document',
                        mimeType,
                        processingMethod: result.processingMethod,
                        confidence: result.confidence,
                        metadata: result.metadata,
                        ...metadata
                    }, 'documents');
                } catch (searchError) {
                    console.warn('Failed to index document for search:', searchError.message);
                }
            }

            res.json({
                success: true,
                data: {
                    documentId: result.documentId || `doc_${Date.now()}`,
                    extractedText: result.text,
                    entities: result.entities,
                    tables: result.tables,
                    confidence: result.confidence,
                    processingMethod: result.processingMethod,
                    metadata: result.metadata,
                    aiAnalysis: result.aiAnalysis,
                    fileInfo: {
                        originalName: originalname,
                        mimeType,
                        size: buffer.length
                    }
                }
            });

        } catch (error) {
            console.error('Document processing error:', error);
            res.status(500).json({
                error: 'Document processing failed',
                message: error.message,
                code: 'PROCESSING_ERROR'
            });
        }
    }
);

/**
 * POST /api/document-processing/batch-upload
 * Upload and process multiple documents
 */
router.post('/batch-upload',
    checkJwt,
    requirePermission('document:upload'),
    upload.array('documents', 10), // Max 10 files
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    error: 'No document files provided',
                    code: 'NO_FILES'
                });
            }

            const { 
                includeAIAnalysis = false, 
                analysisType = 'general',
                indexForSearch = true,
                metadata = {}
            } = req.body;

            console.log(`📄 Processing ${req.files.length} documents in batch`);

            const results = await Promise.allSettled(
                req.files.map(async (file) => {
                    const result = await documentProcessingService.processDocument(
                        file.buffer,
                        file.mimetype,
                        {
                            includeAIAnalysis,
                            analysisType,
                            metadata: {
                                ...metadata,
                                originalName: file.originalname,
                                uploadedBy: req.user.sub,
                                uploadedAt: new Date().toISOString()
                            }
                        }
                    );

                    // Index for search if requested
                    if (indexForSearch) {
                        try {
                            await searchEngineService.addDocument({
                                id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                title: file.originalname,
                                content: result.text,
                                type: 'document',
                                mimeType: file.mimetype,
                                processingMethod: result.processingMethod,
                                confidence: result.confidence,
                                metadata: result.metadata,
                                ...metadata
                            }, 'documents');
                        } catch (searchError) {
                            console.warn('Failed to index document for search:', searchError.message);
                        }
                    }

                    return {
                        fileName: file.originalname,
                        success: true,
                        data: result
                    };
                })
            );

            const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
            const failed = results.filter(r => r.status === 'rejected').map(r => ({
                fileName: r.reason.fileName || 'unknown',
                success: false,
                error: r.reason.message
            }));

            res.json({
                success: true,
                data: {
                    total: req.files.length,
                    successful: successful.length,
                    failed: failed.length,
                    results: [...successful, ...failed]
                }
            });

        } catch (error) {
            console.error('Batch document processing error:', error);
            res.status(500).json({
                error: 'Batch document processing failed',
                message: error.message,
                code: 'BATCH_PROCESSING_ERROR'
            });
        }
    }
);

/**
 * GET /api/document-processing/status/:documentId
 * Get processing status of a document
 */
router.get('/status/:documentId',
    checkJwt,
    requirePermission('document:read'),
    async (req, res) => {
        try {
            const { documentId } = req.params;
            
            // This would typically check a processing queue or database
            // For now, return a placeholder response
            res.json({
                success: true,
                data: {
                    documentId,
                    status: 'completed',
                    progress: 100,
                    message: 'Document processing completed'
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
 * GET /api/document-processing/search
 * Search processed documents
 */
router.get('/search',
    checkJwt,
    requirePermission('document:read'),
    async (req, res) => {
        try {
            const {
                q: searchTerm,
                type = 'all',
                filters = {},
                page = 1,
                size = 20
            } = req.query;

            const searchResults = await searchEngineService.search({
                searchTerm,
                indexType: type,
                filters: JSON.parse(filters || '{}'),
                page: parseInt(page),
                size: parseInt(size)
            });

            res.json({
                success: true,
                data: searchResults
            });

        } catch (error) {
            console.error('Document search error:', error);
            res.status(500).json({
                error: 'Document search failed',
                message: error.message,
                code: 'SEARCH_ERROR'
            });
        }
    }
);

/**
 * DELETE /api/document-processing/:documentId
 * Delete a processed document
 */
router.delete('/:documentId',
    checkJwt,
    requirePermission('document:delete'),
    async (req, res) => {
        try {
            const { documentId } = req.params;
            const { indexType = 'documents' } = req.query;

            // Remove from search index
            await searchEngineService.deleteDocument(documentId, indexType);

            // This would typically also remove from database/storage
            // For now, just confirm deletion from search index

            res.json({
                success: true,
                data: {
                    documentId,
                    message: 'Document deleted successfully'
                }
            });

        } catch (error) {
            console.error('Document deletion error:', error);
            res.status(500).json({
                error: 'Failed to delete document',
                message: error.message,
                code: 'DELETE_ERROR'
            });
        }
    }
);

/**
 * GET /api/document-processing/insights
 * Get document processing insights and analytics
 */
router.get('/insights',
    checkJwt,
    requirePermission('document:read'),
    async (req, res) => {
        try {
            const { filters = {} } = req.query;

            const insights = await searchEngineService.getComplianceInsights(
                JSON.parse(filters || '{}')
            );

            res.json({
                success: true,
                data: insights
            });

        } catch (error) {
            console.error('Insights retrieval error:', error);
            res.status(500).json({
                error: 'Failed to retrieve insights',
                message: error.message,
                code: 'INSIGHTS_ERROR'
            });
        }
    }
);

module.exports = router;