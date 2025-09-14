/**
 * Document Processing Service
 * Integrates Google Document AI, AWS Textract, and other document processing tools
 * Provides deterministic document extraction with AI-powered interpretation
 */

const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');
const AWS = require('aws-sdk');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('node-xlsx');

class DocumentProcessingService {
    constructor() {
        this.setupClients();
        this.setupUpload();
    }

    setupClients() {
        // Google Document AI client
        this.documentAI = new DocumentProcessorServiceClient({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });

        // AWS Textract client
        this.textract = new AWS.Textract({
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });

        // Document AI processor configuration
        this.processorConfig = {
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            location: process.env.GOOGLE_CLOUD_LOCATION || 'us',
            processorId: process.env.DOCUMENT_AI_PROCESSOR_ID
        };
    }

    setupUpload() {
        this.upload = multer({
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
    }

    /**
     * Process a document using the best available service
     * @param {Buffer} fileBuffer - The document file buffer
     * @param {string} mimeType - The MIME type of the document
     * @param {Object} options - Processing options
     * @returns {Object} Extracted document data
     */
    async processDocument(fileBuffer, mimeType, options = {}) {
        try {
            let result;

            // Choose processing method based on file type and options
            if (mimeType === 'application/pdf') {
                result = await this.processPDF(fileBuffer, options);
            } else if (mimeType.includes('word')) {
                result = await this.processWordDocument(fileBuffer, options);
            } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
                result = await this.processExcelDocument(fileBuffer, options);
            } else if (mimeType === 'text/plain') {
                result = await this.processTextDocument(fileBuffer, options);
            } else {
                throw new Error(`Unsupported file type: ${mimeType}`);
            }

            // Enhance with AI-powered analysis if requested
            if (options.includeAIAnalysis) {
                result.aiAnalysis = await this.analyzeWithAI(result.text, options.analysisType);
            }

            return result;
        } catch (error) {
            console.error('Document processing error:', error);
            throw new Error(`Document processing failed: ${error.message}`);
        }
    }

    /**
     * Process PDF documents using Google Document AI with Textract fallback
     */
    async processPDF(fileBuffer, options = {}) {
        try {
            // Try Google Document AI first
            if (this.processorConfig.processorId) {
                return await this.processWithDocumentAI(fileBuffer, options);
            }
        } catch (error) {
            console.warn('Document AI failed, falling back to Textract:', error.message);
        }

        try {
            // Fallback to AWS Textract
            return await this.processWithTextract(fileBuffer, options);
        } catch (error) {
            console.warn('Textract failed, falling back to basic PDF parsing:', error.message);
            // Final fallback to basic PDF parsing
            return await this.processWithBasicPDF(fileBuffer, options);
        }
    }

    /**
     * Process with Google Document AI
     */
    async processWithDocumentAI(fileBuffer, options) {
        const processorName = `projects/${this.processorConfig.projectId}/locations/${this.processorConfig.location}/processors/${this.processorConfig.processorId}`;

        const request = {
            name: processorName,
            rawDocument: {
                content: fileBuffer,
                mimeType: 'application/pdf'
            }
        };

        const [result] = await this.documentAI.processDocument(request);
        const { document } = result;

        return {
            text: document.text || '',
            entities: this.extractEntities(document.entities || []),
            tables: this.extractTables(document.pages || []),
            confidence: this.calculateConfidence(document),
            processingMethod: 'google-document-ai',
            metadata: {
                pageCount: document.pages?.length || 0,
                language: document.textStyles?.[0]?.detectedLanguages?.[0]?.languageCode || 'en'
            }
        };
    }

    /**
     * Process with AWS Textract
     */
    async processWithTextract(fileBuffer, options) {
        const params = {
            Document: {
                Bytes: fileBuffer
            },
            FeatureTypes: ['TABLES', 'FORMS']
        };

        const result = await this.textract.analyzeDocument(params).promise();

        return {
            text: this.extractTextFromTextract(result),
            entities: this.extractEntitiesFromTextract(result),
            tables: this.extractTablesFromTextract(result),
            confidence: this.calculateTextractConfidence(result),
            processingMethod: 'aws-textract',
            metadata: {
                blockCount: result.Blocks?.length || 0
            }
        };
    }

    /**
     * Process with basic PDF parsing
     */
    async processWithBasicPDF(fileBuffer, options) {
        const data = await pdfParse(fileBuffer);

        return {
            text: data.text,
            entities: [],
            tables: [],
            confidence: 0.7, // Basic parsing confidence
            processingMethod: 'basic-pdf',
            metadata: {
                pageCount: data.numpages,
                info: data.info
            }
        };
    }

    /**
     * Process Word documents
     */
    async processWordDocument(fileBuffer, options) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });

        return {
            text: result.value,
            entities: [],
            tables: [],
            confidence: 0.8,
            processingMethod: 'mammoth',
            metadata: {
                messages: result.messages
            }
        };
    }

    /**
     * Process Excel documents
     */
    async processExcelDocument(fileBuffer, options) {
        const workSheets = xlsx.parse(fileBuffer);
        const text = workSheets.map(sheet => 
            sheet.data.map(row => row.join('\t')).join('\n')
        ).join('\n\n');

        return {
            text,
            entities: [],
            tables: workSheets.map(sheet => ({
                name: sheet.name,
                data: sheet.data
            })),
            confidence: 0.9,
            processingMethod: 'node-xlsx',
            metadata: {
                sheetCount: workSheets.length,
                sheetNames: workSheets.map(sheet => sheet.name)
            }
        };
    }

    /**
     * Process text documents
     */
    async processTextDocument(fileBuffer, options) {
        const text = fileBuffer.toString('utf-8');

        return {
            text,
            entities: [],
            tables: [],
            confidence: 1.0,
            processingMethod: 'direct-text',
            metadata: {
                encoding: 'utf-8'
            }
        };
    }

    /**
     * Analyze extracted text with AI
     */
    async analyzeWithAI(text, analysisType = 'general') {
        // This would integrate with your existing AI services
        // For now, return a placeholder
        return {
            analysisType,
            summary: 'AI analysis placeholder',
            keyPoints: [],
            confidence: 0.8,
            timestamp: new Date().toISOString()
        };
    }

    // Helper methods for extracting data from different services
    extractEntities(entities) {
        return entities.map(entity => ({
            text: entity.textAnchor?.content || entity.mentionText || '',
            type: entity.type || 'UNKNOWN',
            confidence: entity.confidence || 0
        }));
    }

    extractTables(pages) {
        // Implementation for extracting tables from Document AI pages
        return [];
    }

    calculateConfidence(document) {
        // Calculate overall confidence based on document quality
        return 0.9; // Placeholder
    }

    extractTextFromTextract(result) {
        const textBlocks = result.Blocks?.filter(block => block.BlockType === 'LINE') || [];
        return textBlocks.map(block => block.Text).join('\n');
    }

    extractEntitiesFromTextract(result) {
        // Implementation for extracting entities from Textract
        return [];
    }

    extractTablesFromTextract(result) {
        // Implementation for extracting tables from Textract
        return [];
    }

    calculateTextractConfidence(result) {
        // Calculate confidence from Textract result
        return 0.8; // Placeholder
    }

    /**
     * Get upload middleware for Express
     */
    getUploadMiddleware() {
        return this.upload;
    }
}

module.exports = new DocumentProcessingService();