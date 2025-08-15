// File: api/validation/validation-schemas.js

const Joi = require('joi');

class ValidationSchemas {
    constructor() {
        this.setupSchemas();
    }

    setupSchemas() {
        // ===== AUTHENTICATION SCHEMAS =====
        this.loginSchema = Joi.object({
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .max(255)
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required'
                }),
            password: Joi.string()
                .min(8)
                .max(128)
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                .required()
                .messages({
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                    'string.min': 'Password must be at least 8 characters long',
                    'string.max': 'Password cannot exceed 128 characters'
                })
        });

        this.contextSwitchSchema = Joi.object({
            contextId: Joi.string()
                .uuid()
                .required()
                .messages({
                    'string.guid': 'Context ID must be a valid UUID',
                    'any.required': 'Context ID is required'
                })
        });

        // ===== ENTERPRISE SCHEMAS =====
        this.createEnterpriseSchema = Joi.object({
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
                .required()
                .messages({
                    'any.only': 'Type must be one of: pharma, agency, partner, other'
                }),
            subscriptionTier: Joi.string()
                .valid('standard', 'premium', 'enterprise')
                .default('standard'),
            settings: Joi.object({
                branding: Joi.object({
                    primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
                    logoUrl: Joi.string().uri().optional()
                }).optional(),
                compliance: Joi.object({
                    strictMode: Joi.boolean().default(false),
                    auditTrail: Joi.boolean().default(true)
                }).optional(),
                features: Joi.object({
                    advancedAnalytics: Joi.boolean().default(false),
                    realTimeMonitoring: Joi.boolean().default(false)
                }).optional()
            }).optional()
        });

        // ===== AGENCY SEAT SCHEMAS =====
        this.createAgencySeatSchema = Joi.object({
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
            settings: Joi.object({
                customBranding: Joi.boolean().default(false),
                userLimit: Joi.number().integer().min(1).max(1000).default(10),
                policyLimit: Joi.number().integer().min(1).max(100).default(20)
            }).optional(),
            limits: Joi.object({
                maxUsers: Joi.number().integer().min(1).max(1000).optional(),
                maxPolicies: Joi.number().integer().min(1).max(100).optional(),
                maxSubmissions: Joi.number().integer().min(1).max(10000).optional()
            }).optional()
        });

        // ===== POLICY SCHEMAS =====
        this.createPolicySchema = Joi.object({
            name: Joi.string()
                .min(3)
                .max(255)
                .pattern(/^[a-zA-Z0-9\s\-_()]+$/)
                .required()
                .messages({
                    'string.pattern.base': 'Policy name can only contain letters, numbers, spaces, hyphens, underscores, and parentheses'
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
                requiredApprovals: Joi.array().items(Joi.string()).max(10).optional(),
                restrictedTerms: Joi.array().items(Joi.string()).max(50).optional(),
                stages: Joi.array().items(Joi.string()).max(10).optional(),
                approvers: Joi.array().items(Joi.string()).max(20).optional(),
                brandColors: Joi.array().items(Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/)).max(10).optional(),
                logoUsage: Joi.string().valid('strict', 'flexible', 'none').optional(),
                typography: Joi.string().optional(),
                complianceRules: Joi.object({
                    fdaGuidelines: Joi.boolean().default(false),
                    emaGuidelines: Joi.boolean().default(false),
                    localRegulations: Joi.array().items(Joi.string()).optional()
                }).optional()
            }).required(),
            enterpriseId: Joi.string().uuid().required(),
            agencySeatId: Joi.string().uuid().optional(),
            version: Joi.number().integer().min(1).default(1),
            isTemplate: Joi.boolean().default(false)
        });

        // ===== COMPLIANCE SUBMISSION SCHEMAS =====
        this.complianceSubmissionSchema = Joi.object({
            title: Joi.string()
                .min(5)
                .max(255)
                .required()
                .messages({
                    'string.min': 'Title must be at least 5 characters long',
                    'string.max': 'Title cannot exceed 255 characters'
                }),
            description: Joi.string()
                .max(5000)
                .required()
                .messages({
                    'string.max': 'Description cannot exceed 5000 characters'
                }),
            content: Joi.string()
                .max(50000)
                .required()
                .messages({
                    'string.max': 'Content cannot exceed 50000 characters'
                }),
            contentType: Joi.string()
                .valid('policy', 'report', 'audit', 'review', 'approval', 'regulatory')
                .required()
                .messages({
                    'any.only': 'Content type must be one of: policy, report, audit, review, approval, regulatory'
                }),
            priority: Joi.string()
                .valid('low', 'medium', 'high', 'critical')
                .default('medium'),
            metadata: Joi.object({
                clientName: Joi.string().max(255).optional(),
                campaignName: Joi.string().max(255).optional(),
                drugName: Joi.string()
                    .max(255)
                    .pattern(/^[a-zA-Z0-9\s\-()]+$/)
                    .optional()
                    .messages({
                        'string.pattern.base': 'Drug name can only contain letters, numbers, spaces, hyphens, and parentheses'
                    }),
                regulatoryBody: Joi.string()
                    .valid('FDA', 'EMA', 'HealthCanada', 'PMDA', 'Other')
                    .optional(),
                regulatoryCode: Joi.string()
                    .pattern(/^[A-Z]{2,4}-\d{4,8}$/)
                    .optional()
                    .messages({
                        'string.pattern.base': 'Regulatory code must be in format: XX-1234 or XXX-12345678'
                    }),
                submissionDate: Joi.date().optional(),
                deadline: Joi.date().optional(),
                complianceScore: Joi.number().min(0).max(100).precision(2).optional(),
                riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
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

        // ===== USER MANAGEMENT SCHEMAS =====
        this.inviteUserSchema = Joi.object({
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .max(255)
                .required(),
            name: Joi.string()
                .min(2)
                .max(100)
                .pattern(/^[a-zA-Z\s\-']+$/)
                .required()
                .messages({
                    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes'
                }),
            role: Joi.string()
                .valid('enterprise_owner', 'enterprise_admin', 'seat_admin', 'seat_user')
                .required(),
            permissions: Joi.array().items(Joi.string()).optional(),
            message: Joi.string().max(1000).optional()
        });

        this.updateUserRoleSchema = Joi.object({
            role: Joi.string()
                .valid('enterprise_owner', 'enterprise_admin', 'seat_admin', 'seat_user')
                .required(),
            permissions: Joi.array().items(Joi.string()).optional(),
            isActive: Joi.boolean().optional()
        });

        // ===== BULK OPERATIONS SCHEMAS =====
        this.bulkPolicyAssignmentSchema = Joi.object({
            seatIds: Joi.array().items(Joi.string().uuid()).min(1).max(50).required(),
            policyIds: Joi.array().items(Joi.string().uuid()).min(1).max(20).required(),
            options: Joi.object({
                assignmentType: Joi.string().valid('inherited', 'direct', 'override').default('direct'),
                priority: Joi.number().integer().min(0).max(100).default(0),
                notifyUsers: Joi.boolean().default(true),
                rolloutSchedule: Joi.object({
                    immediate: Joi.boolean().default(true),
                    scheduledDate: Joi.date().optional(),
                    phasedRollout: Joi.boolean().default(false)
                }).optional()
            }).optional()
        });

        // ===== SEARCH AND FILTER SCHEMAS =====
        this.searchSchema = Joi.object({
            query: Joi.string().max(255).optional(),
            filters: Joi.object({
                type: Joi.string().valid('policy', 'submission', 'user', 'enterprise').optional(),
                status: Joi.string().valid('active', 'inactive', 'pending', 'approved', 'rejected').optional(),
                dateRange: Joi.object({
                    start: Joi.date().optional(),
                    end: Joi.date().optional()
                }).optional(),
                priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
            }).optional(),
            pagination: Joi.object({
                page: Joi.number().integer().min(1).default(1),
                limit: Joi.number().integer().min(1).max(100).default(20),
                sortBy: Joi.string().valid('created_at', 'updated_at', 'name', 'priority').default('created_at'),
                sortOrder: Joi.string().valid('asc', 'desc').default('desc')
            }).optional()
        });

        // ===== PHARMACEUTICAL-SPECIFIC SCHEMAS =====
        this.drugInformationSchema = Joi.object({
            drugName: Joi.string()
                .min(2)
                .max(255)
                .pattern(/^[a-zA-Z0-9\s\-()]+$/)
                .required(),
            genericName: Joi.string().max(255).optional(),
            brandName: Joi.string().max(255).optional(),
            therapeuticClass: Joi.string().max(255).optional(),
            regulatoryStatus: Joi.string()
                .valid('approved', 'pending', 'investigational', 'discontinued')
                .required(),
            approvalDate: Joi.date().optional(),
            manufacturer: Joi.string().max(255).optional(),
            indications: Joi.array().items(Joi.string()).max(20).optional(),
            contraindications: Joi.array().items(Joi.string()).max(20).optional(),
            sideEffects: Joi.array().items(Joi.string()).max(50).optional()
        });

        this.regulatorySubmissionSchema = Joi.object({
            submissionType: Joi.string()
                .valid('NDA', 'ANDA', 'BLA', 'PMA', '510k', 'Other')
                .required(),
            regulatoryBody: Joi.string()
                .valid('FDA', 'EMA', 'HealthCanada', 'PMDA', 'Other')
                .required(),
            submissionNumber: Joi.string()
                .pattern(/^[A-Z]{2,4}-\d{4,8}$/)
                .required(),
            submissionDate: Joi.date().required(),
            targetDate: Joi.date().optional(),
            status: Joi.string()
                .valid('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn')
                .default('draft'),
            drugName: Joi.string().max(255).required(),
            applicant: Joi.string().max(255).required(),
            documents: Joi.array().items(
                Joi.object({
                    documentType: Joi.string().valid('clinical', 'non_clinical', 'chemistry', 'other').required(),
                    filename: Joi.string().max(255).required(),
                    size: Joi.number().integer().max(100 * 1024 * 1024).required(), // 100MB max
                    url: Joi.string().uri().optional()
                })
            ).max(50).optional()
        });
    }

    // ===== GETTER METHODS =====

    getLoginSchema() { return this.loginSchema; }
    getContextSwitchSchema() { return this.contextSwitchSchema; }
    getCreateEnterpriseSchema() { return this.createEnterpriseSchema; }
    getCreateAgencySeatSchema() { return this.createAgencySeatSchema; }
    getCreatePolicySchema() { return this.createPolicySchema; }
    getComplianceSubmissionSchema() { return this.complianceSubmissionSchema; }
    getInviteUserSchema() { return this.inviteUserSchema; }
    getUpdateUserRoleSchema() { return this.updateUserRoleSchema; }
    getBulkPolicyAssignmentSchema() { return this.bulkPolicyAssignmentSchema; }
    getSearchSchema() { return this.searchSchema; }
    getDrugInformationSchema() { return this.drugInformationSchema; }
    getRegulatorySubmissionSchema() { return this.regulatorySubmissionSchema; }

    // ===== CUSTOM SCHEMA BUILDER =====

    buildCustomSchema(baseSchema, customRules = {}) {
        return baseSchema.keys(customRules);
    }

    // ===== VALIDATION HELPERS =====

    validateWithCustomRules(schema, data, customRules = {}) {
        const customSchema = this.buildCustomSchema(schema, customRules);
        return customSchema.validate(data, { abortEarly: false });
    }
}

module.exports = new ValidationSchemas(); 