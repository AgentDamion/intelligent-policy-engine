// File: api/validation/validation-middleware.js

import inputValidator from './input-validator.js';
import rateLimit from 'express-rate-limit';

class ValidationMiddleware {
    constructor() {
        this.setupRateLimiters();
    }

    // ===== RATE LIMITING =====

    setupRateLimiters() {
        // General API rate limiter
        this.generalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false
        });

        // Strict limiter for sensitive endpoints
        this.strictLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 20, // Limit each IP to 20 requests per windowMs
            message: {
                error: 'Too many requests to sensitive endpoint, please try again later.',
                retryAfter: '15 minutes'
            }
        });

        // Login rate limiter
        this.loginLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // Limit each IP to 5 login attempts per windowMs
            message: {
                error: 'Too many login attempts, please try again later.',
                retryAfter: '15 minutes'
            }
        });
    }

    // ===== VALIDATION MIDDLEWARE =====

    validatePolicy() {
        return inputValidator.validateRequest(inputValidator.getPolicySchema());
    }

    validateUser() {
        return inputValidator.validateRequest(inputValidator.getUserSchema());
    }

    validateEnterprise() {
        return inputValidator.validateRequest(inputValidator.getEnterpriseSchema());
    }

    validateAgencySeat() {
        return inputValidator.validateRequest(inputValidator.getAgencySeatSchema());
    }

    validateComplianceSubmission() {
        return inputValidator.validateRequest(inputValidator.getComplianceSubmissionSchema());
    }

    // ===== SECURITY MIDDLEWARE =====

    sanitizeInput() {
        return (req, res, next) => {
            // Sanitize body
            if (req.body) {
                req.body = this.sanitizeObject(req.body);
            }

            // Sanitize query parameters
            if (req.query) {
                req.query = this.sanitizeObject(req.query);
            }

            // Sanitize URL parameters
            if (req.params) {
                req.params = this.sanitizeObject(req.params);
            }

            next();
        };
    }

    sanitizeObject(obj) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    sanitizeString(str) {
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:text\/html/gi, '')
            .trim();
    }

    // ===== FILE UPLOAD VALIDATION =====

    validateFileUpload(allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png']) {
        return (req, res, next) => {
            if (!req.files || Object.keys(req.files).length === 0) {
                return next();
            }

            const files = Array.isArray(req.files) ? req.files : Object.values(req.files);
            const validationErrors = [];

            for (const file of files) {
                const result = inputValidator.validateFileUpload(file, allowedTypes);
                if (!result.isValid) {
                    validationErrors.push({
                        filename: file.originalname,
                        error: result.error
                    });
                }
            }

            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'File validation failed',
                    errors: validationErrors
                });
            }

            next();
        };
    }

    // ===== CONTENT TYPE VALIDATION =====

    validateContentType(allowedTypes = ['application/json']) {
        return (req, res, next) => {
            const contentType = req.get('Content-Type');
            
            if (!contentType) {
                return res.status(400).json({
                    success: false,
                    message: 'Content-Type header is required'
                });
            }

            const isValidType = allowedTypes.some(type => 
                contentType.includes(type)
            );

            if (!isValidType) {
                return res.status(415).json({
                    success: false,
                    message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
                });
            }

            next();
        };
    }

    // ===== SIZE LIMITS =====

    validatePayloadSize(maxSize = '10mb') {
        return (req, res, next) => {
            const contentLength = parseInt(req.get('Content-Length') || '0');
            const maxBytes = this.parseSize(maxSize);

            if (contentLength > maxBytes) {
                return res.status(413).json({
                    success: false,
                    message: `Payload size exceeds limit of ${maxSize}`
                });
            }

            next();
        };
    }

    parseSize(size) {
        const units = {
            'b': 1,
            'kb': 1024,
            'mb': 1024 * 1024,
            'gb': 1024 * 1024 * 1024
        };

        const match = size.toLowerCase().match(/^(\d+)([kmg]?b)$/);
        if (!match) {
            return 10 * 1024 * 1024; // Default 10MB
        }

        const [, number, unit] = match;
        return parseInt(number) * units[unit || 'b'];
    }

    // ===== CUSTOM VALIDATION =====

    validateCustom(schema, options = {}) {
        return inputValidator.validateRequest(schema, options);
    }

    // ===== ERROR HANDLING =====

    handleValidationError() {
        return (error, req, res, next) => {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message,
                        code: detail.type
                    }))
                });
            }

            next(error);
        };
    }

    // ===== LOGGING =====

    logValidationAttempt(req, res, next) {
        const originalSend = res.send;
        
        res.send = function(data) {
            if (res.statusCode === 400) {
                console.log(`Validation failed for ${req.method} ${req.path}:`, {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString(),
                    errors: JSON.parse(data).errors
                });
            }
            
            originalSend.call(this, data);
        };

        next();
    }

    // ===== RATE LIMITERS =====

    getGeneralLimiter() {
        return this.generalLimiter;
    }

    getStrictLimiter() {
        return this.strictLimiter;
    }

    getLoginLimiter() {
        return this.loginLimiter;
    }

    // ===== PHARMACEUTICAL-SPECIFIC VALIDATION =====

    validateDrugName() {
        return (req, res, next) => {
            const { drugName } = req.body;
            if (!drugName) {
                return next();
            }

            const result = inputValidator.validateDrugName(drugName);
            if (!result.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid drug name',
                    errors: result.errors
                });
            }

            next();
        };
    }

    validateRegulatoryCode() {
        return (req, res, next) => {
            const { regulatoryCode } = req.body;
            if (!regulatoryCode) {
                return next();
            }

            const result = inputValidator.validateRegulatoryCode(regulatoryCode);
            if (!result.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid regulatory code format',
                    errors: result.errors
                });
            }

            next();
        };
    }

    validateComplianceScore() {
        return (req, res, next) => {
            const { complianceScore } = req.body;
            if (complianceScore === undefined || complianceScore === null) {
                return next();
            }

            const result = inputValidator.validateComplianceScore(complianceScore);
            if (!result.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid compliance score',
                    errors: result.errors
                });
            }

            next();
        };
    }
}

export default new ValidationMiddleware(); 