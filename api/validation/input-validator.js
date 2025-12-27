// File: api/validation/input-validator.js

import Joi from 'joi';
import sanitizeHtml from 'sanitize-html';

class InputValidator {
    constructor() {
        this.sanitizers = {
            html: (value) => sanitizeHtml(value, { 
                allowedTags: [], 
                allowedAttributes: {},
                allowedIframeHostnames: []
            }),
            email: (value) => value.toLowerCase().trim(),
            phone: (value) => value.replace(/[^\d+()-]/g, ''),
            url: (value) => {
                try {
                    const url = new URL(value);
                    return url.toString();
                } catch {
                    return value;
                }
            }
        };
    }

    // ===== CORE VALIDATION METHODS =====

    validate(schema, data, options = {}) {
        const { error, value } = schema.validate(data, {
            abortEarly: false,
            allowUnknown: options.allowUnknown || false,
            stripUnknown: options.stripUnknown || true,
            ...options
        });

        if (error) {
            return {
                isValid: false,
                errors: this.formatValidationErrors(error.details),
                sanitizedData: null
            };
        }

        return {
            isValid: true,
            errors: [],
            sanitizedData: this.sanitizeData(value, schema)
        };
    }

    // ===== PHARMACEUTICAL-SPECIFIC VALIDATION =====

    // Policy validation schemas
    getPolicySchema() {
        return Joi.object({
            name: Joi.string()
                .min(3)
                .max(255)
                .pattern(/^[a-zA-Z0-9\s\-_()]+$/)
                .required()
                .messages({
                    'string.pattern.base': 'Policy name can only contain letters, numbers, spaces, hyphens, underscores, and parentheses',
                    'string.min': 'Policy name must be at least 3 characters long',
                    'string.max': 'Policy name cannot exceed 255 characters'
                }),
            description: Joi.string()
                .max(2000)
                .optional(),
            policyType: Joi.string()
                .valid('compliance', 'workflow', 'brand', 'security', 'regulatory')
                .required()
                .messages({
                    'any.only': 'Policy type must be one of: compliance, workflow, brand, security, regulatory'
                }),
            rules: Joi.object({
                riskThreshold: Joi.number().min(0).max(1).optional(),
                requiredApprovals: Joi.array().items(Joi.string()).optional(),
                restrictedTerms: Joi.array().items(Joi.string()).optional(),
                stages: Joi.array().items(Joi.string()).optional(),
                approvers: Joi.array().items(Joi.string()).optional(),
                brandColors: Joi.array().items(Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/)).optional(),
                logoUsage: Joi.string().valid('strict', 'flexible', 'none').optional(),
                typography: Joi.string().optional()
            }).required(),
            enterpriseId: Joi.string().uuid().required(),
            agencySeatId: Joi.string().uuid().optional()
        });
    }

    // User validation schemas
    getUserSchema() {
        return Joi.object({
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .max(255)
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'string.max': 'Email address cannot exceed 255 characters'
                }),
            name: Joi.string()
                .min(2)
                .max(100)
                .pattern(/^[a-zA-Z\s\-']+$/)
                .required()
                .messages({
                    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
                    'string.min': 'Name must be at least 2 characters long',
                    'string.max': 'Name cannot exceed 100 characters'
                }),
            role: Joi.string()
                .valid('enterprise_owner', 'enterprise_admin', 'seat_admin', 'seat_user', 'platform_super_admin')
                .required(),
            permissions: Joi.array().items(Joi.string()).optional(),
            avatarUrl: Joi.string().uri().optional()
        });
    }

    // Enterprise validation schemas
    getEnterpriseSchema() {
        return Joi.object({
            name: Joi.string()
                .min(2)
                .max(255)
                .pattern(/^[a-zA-Z0-9\s\-&.,()]+$/)
                .required()
                .messages({
                    'string.pattern.base': 'Enterprise name can only contain letters, numbers, spaces, and common punctuation',
                    'string.min': 'Enterprise name must be at least 2 characters long',
                    'string.max': 'Enterprise name cannot exceed 255 characters'
                }),
            slug: Joi.string()
                .min(2)
                .max(100)
                .pattern(/^[a-z0-9-]+$/)
                .required()
                .messages({
                    'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
                    'string.min': 'Slug must be at least 2 characters long',
                    'string.max': 'Slug cannot exceed 100 characters'
                }),
            type: Joi.string()
                .valid('pharma', 'agency', 'partner', 'other')
                .required(),
            subscriptionTier: Joi.string()
                .valid('standard', 'premium', 'enterprise')
                .default('standard'),
            settings: Joi.object().optional()
        });
    }

    // Agency seat validation schemas
    getAgencySeatSchema() {
        return Joi.object({
            name: Joi.string()
                .min(2)
                .max(255)
                .pattern(/^[a-zA-Z0-9\s\-&.,()]+$/)
                .required(),
            slug: Joi.string()
                .min(2)
                .max(100)
                .pattern(/^[a-z0-9-]+$/)
                .required(),
            description: Joi.string()
                .max(1000)
                .optional(),
            seatType: Joi.string()
                .valid('standard', 'premium', 'enterprise')
                .default('standard'),
            settings: Joi.object().optional(),
            limits: Joi.object({
                maxUsers: Joi.number().integer().min(1).max(1000).optional(),
                maxPolicies: Joi.number().integer().min(1).max(100).optional(),
                maxSubmissions: Joi.number().integer().min(1).max(10000).optional()
            }).optional()
        });
    }

    // Compliance submission validation
    getComplianceSubmissionSchema() {
        return Joi.object({
            title: Joi.string()
                .min(5)
                .max(255)
                .required(),
            description: Joi.string()
                .max(5000)
                .required(),
            content: Joi.string()
                .max(50000)
                .required(),
            contentType: Joi.string()
                .valid('policy', 'report', 'audit', 'review', 'approval')
                .required(),
            priority: Joi.string()
                .valid('low', 'medium', 'high', 'critical')
                .default('medium'),
            metadata: Joi.object({
                clientName: Joi.string().max(255).optional(),
                campaignName: Joi.string().max(255).optional(),
                drugName: Joi.string().max(255).optional(),
                regulatoryBody: Joi.string().max(255).optional(),
                submissionDate: Joi.date().optional(),
                deadline: Joi.date().optional()
            }).optional(),
            attachments: Joi.array().items(
                Joi.object({
                    filename: Joi.string().max(255).required(),
                    size: Joi.number().integer().max(50 * 1024 * 1024).required(), // 50MB max
                    type: Joi.string().valid('pdf', 'doc', 'docx', 'txt', 'jpg', 'png').required(),
                    url: Joi.string().uri().optional()
                })
            ).max(10).optional() // Max 10 attachments
        });
    }

    // ===== SECURITY VALIDATION =====

    // SQL Injection prevention
    validateSqlSafe(value, fieldName) {
        const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|--)\b)/i;
        if (sqlPattern.test(value)) {
            return {
                isValid: false,
                error: `${fieldName} contains invalid characters`
            };
        }
        return { isValid: true };
    }

    // XSS prevention
    validateXssSafe(value, fieldName) {
        const xssPattern = /<script|javascript:|on\w+\s*=|data:text\/html/i;
        if (xssPattern.test(value)) {
            return {
                isValid: false,
                error: `${fieldName} contains potentially unsafe content`
            };
        }
        return { isValid: true };
    }

    // File upload validation
    validateFileUpload(file, allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png']) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        if (!file) {
            return { isValid: false, error: 'No file provided' };
        }

        if (file.size > maxSize) {
            return { isValid: false, error: 'File size exceeds 50MB limit' };
        }

        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
            return { 
                isValid: false, 
                error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
            };
        }

        return { isValid: true };
    }

    // ===== UTILITY METHODS =====

    formatValidationErrors(details) {
        return details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            code: detail.type
        }));
    }

    sanitizeData(data, schema) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                // Apply HTML sanitization for text fields
                sanitized[key] = this.sanitizers.html(value);
            } else if (typeof value === 'object' && value !== null) {
                // Recursively sanitize nested objects
                sanitized[key] = this.sanitizeData(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    // ===== MIDDLEWARE FOR EXPRESS =====

    validateRequest(schema, options = {}) {
        return (req, res, next) => {
            const dataToValidate = {
                ...req.body,
                ...req.params,
                ...req.query
            };

            const result = this.validate(schema, dataToValidate, options);

            if (!result.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: result.errors,
                    timestamp: new Date().toISOString()
                });
            }

            // Replace request data with sanitized data
            req.body = result.sanitizedData;
            next();
        };
    }

    // ===== PHARMACEUTICAL-SPECIFIC VALIDATION METHODS =====

    validateDrugName(drugName) {
        const schema = Joi.string()
            .min(2)
            .max(255)
            .pattern(/^[a-zA-Z0-9\s\-()]+$/)
            .required()
            .messages({
                'string.pattern.base': 'Drug name can only contain letters, numbers, spaces, hyphens, and parentheses'
            });

        return this.validate(schema, drugName);
    }

    validateRegulatoryCode(code) {
        const schema = Joi.string()
            .pattern(/^[A-Z]{2,4}-\d{4,8}$/)
            .required()
            .messages({
                'string.pattern.base': 'Regulatory code must be in format: XX-1234 or XXX-12345678'
            });

        return this.validate(schema, code);
    }

    validateComplianceScore(score) {
        const schema = Joi.number()
            .min(0)
            .max(100)
            .precision(2)
            .required()
            .messages({
                'number.min': 'Compliance score must be between 0 and 100',
                'number.max': 'Compliance score must be between 0 and 100'
            });

        return this.validate(schema, score);
    }

    // ===== BATCH VALIDATION =====

    validateBatch(items, schema) {
        const results = {
            valid: [],
            invalid: [],
            errors: []
        };

        items.forEach((item, index) => {
            const result = this.validate(schema, item);
            if (result.isValid) {
                results.valid.push(result.sanitizedData);
            } else {
                results.invalid.push({
                    index,
                    item,
                    errors: result.errors
                });
                results.errors.push(...result.errors.map(error => ({
                    ...error,
                    index
                })));
            }
        });

        return results;
    }
}

export default new InputValidator(); 