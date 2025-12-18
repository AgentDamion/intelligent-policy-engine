// File: api/routes/validated-routes.js

const express = require('express');
const router = express.Router();
const validationMiddleware = require('../validation/validation-middleware');
const validationSchemas = require('../validation/validation-schemas');
const inputValidator = require('../validation/input-validator');
const hierarchicalAuth = require('../auth/hierarchical-auth');
const db = require('../../database/connection');

// ===== AUTHENTICATION ROUTES WITH VALIDATION =====

// Login with comprehensive validation
router.post('/auth/login',
    validationMiddleware.getLoginLimiter(),
    validationMiddleware.sanitizeInput(),
    validationMiddleware.validateContentType(['application/json']),
    validationMiddleware.validatePayloadSize('1mb'),
    (req, res, next) => {
        const result = inputValidator.validate(validationSchemas.getLoginSchema(), req.body);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Login validation failed',
                errors: result.errors
            });
        }
        req.body = result.sanitizedData;
        next();
    },
    async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const authResult = await hierarchicalAuth.authenticateUser(email, password);
            
            res.json({
                success: true,
                user: authResult.user,
                token: authResult.token,
                defaultContext: authResult.defaultContext
            });
        } catch (error) {
            res.status(401).json({ 
                success: false,
                message: 'Authentication failed',
                error: error.message 
            });
        }
    }
);

// Context switching with validation
router.post('/auth/context/switch',
    hierarchicalAuth.requireAuth(),
    validationMiddleware.sanitizeInput(),
    validationMiddleware.validateContentType(['application/json']),
    (req, res, next) => {
        const result = inputValidator.validate(validationSchemas.getContextSwitchSchema(), req.body);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Context switch validation failed',
                errors: result.errors
            });
        }
        req.body = result.sanitizedData;
        next();
    },
    async (req, res) => {
        try {
            const { contextId } = req.body;
            const userId = req.user.id;
            
            const switchResult = await hierarchicalAuth.switchUserContext(userId, contextId);
            
            res.json({
                success: true,
                context: switchResult.context,
                token: switchResult.token
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                message: 'Context switch failed',
                error: error.message 
            });
        }
    }
);

// ===== ENTERPRISE MANAGEMENT WITH VALIDATION =====

// Create enterprise with comprehensive validation
router.post('/enterprises',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requireRole(['platform_super_admin']),
    validationMiddleware.getStrictLimiter(),
    validationMiddleware.sanitizeInput(),
    validationMiddleware.validateContentType(['application/json']),
    validationMiddleware.validatePayloadSize('2mb'),
    (req, res, next) => {
        const result = inputValidator.validate(validationSchemas.getCreateEnterpriseSchema(), req.body);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Enterprise creation validation failed',
                errors: result.errors
            });
        }
        req.body = result.sanitizedData;
        next();
    },
    async (req, res) => {
        try {
            const enterprise = await hierarchicalAuth.createEnterprise(req.body, req.user.id);
            
            res.json({ 
                success: true, 
                enterprise,
                message: 'Enterprise created successfully'
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                message: 'Enterprise creation failed',
                error: error.message 
            });
        }
    }
);

// ===== AGENCY SEAT MANAGEMENT WITH VALIDATION =====

// Create agency seat with validation
router.post('/enterprises/:enterpriseId/seats',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('agency_seats', 'create'),
    validationMiddleware.sanitizeInput(),
    validationMiddleware.validateContentType(['application/json']),
    (req, res, next) => {
        const result = inputValidator.validate(validationSchemas.getCreateAgencySeatSchema(), req.body);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Agency seat creation validation failed',
                errors: result.errors
            });
        }
        req.body = result.sanitizedData;
        next();
    },
    async (req, res) => {
        try {
            const { enterpriseId } = req.params;
            
            if (req.context.enterpriseId !== enterpriseId && 
                req.context.role !== 'platform_super_admin') {
                return res.status(403).json({ 
                    success: false,
                    message: 'Access denied to enterprise' 
                });
            }
            
            const seat = await hierarchicalAuth.createAgencySeat(enterpriseId, req.body, req.user.id);
            
            res.json({ 
                success: true, 
                seat,
                message: 'Agency seat created successfully'
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                message: 'Agency seat creation failed',
                error: error.message 
            });
        }
    }
);

// ===== POLICY MANAGEMENT WITH VALIDATION =====

// Create policy with comprehensive validation
router.post('/policies',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('policies', 'create'),
    validationMiddleware.sanitizeInput(),
    validationMiddleware.validateContentType(['application/json']),
    validationMiddleware.validatePayloadSize('5mb'),
    (req, res, next) => {
        const result = inputValidator.validate(validationSchemas.getCreatePolicySchema(), req.body);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Policy creation validation failed',
                errors: result.errors
            });
        }
        req.body = result.sanitizedData;
        next();
    },
    async (req, res) => {
        try {
            const { enterpriseId, agencySeatId, ...policyData } = req.body;
            
            // Verify user has permission to create policies
            if (agencySeatId) {
                if (req.context.agencySeatId !== agencySeatId && 
                    req.context.role !== 'enterprise_admin' &&
                    req.context.role !== 'platform_super_admin') {
                    return res.status(403).json({ 
                        success: false,
                        message: 'Access denied to agency seat' 
                    });
                }
            } else {
                if (req.context.enterpriseId !== enterpriseId && 
                    req.context.role !== 'platform_super_admin') {
                    return res.status(403).json({ 
                        success: false,
                        message: 'Access denied to enterprise' 
                    });
                }
            }
            
            const result = await db.query(`
                INSERT INTO policies 
                (name, description, enterprise_id, agency_seat_id, policy_type, rules, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [
                policyData.name,
                policyData.description,
                enterpriseId,
                agencySeatId || null,
                policyData.policyType,
                JSON.stringify(policyData.rules),
                req.user.id
            ]);
            
            const policy = result.rows[0];
            
            // Log the action
            await hierarchicalAuth.logAction(
                req.user.id,
                req.context.id,
                'create_policy',
                'policy',
                policy.id,
                {
                    policyName: policy.name,
                    enterpriseId,
                    agencySeatId
                }
            );
            
            res.json({ 
                success: true, 
                policy,
                message: 'Policy created successfully'
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                message: 'Policy creation failed',
                error: error.message 
            });
        }
    }
);

// ===== COMPLIANCE SUBMISSION WITH VALIDATION =====

// Create compliance submission with comprehensive validation
router.post('/compliance/submissions',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('submissions', 'create'),
    validationMiddleware.sanitizeInput(),
    validationMiddleware.validateContentType(['application/json']),
    validationMiddleware.validatePayloadSize('10mb'),
    (req, res, next) => {
        const result = inputValidator.validate(validationSchemas.getComplianceSubmissionSchema(), req.body);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Compliance submission validation failed',
                errors: result.errors
            });
        }
        req.body = result.sanitizedData;
        next();
    },
    async (req, res) => {
        try {
            const { title, description, content, contentType, priority, metadata } = req.body;
            
            const result = await db.query(`
                INSERT INTO audit_sessions 
                (organization_id, user_id, workflow_path, agents_engaged, final_decision, status)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [
                req.context.enterpriseId,
                req.user.id,
                JSON.stringify({ contentType, priority }),
                ['compliance_agent'],
                JSON.stringify({ title, description, content, metadata }),
                'active'
            ]);
            
            const submission = result.rows[0];
            
            // Log the action
            await hierarchicalAuth.logAction(
                req.user.id,
                req.context.id,
                'create_compliance_submission',
                'submission',
                submission.session_id,
                {
                    title,
                    contentType,
                    priority
                }
            );
            
            res.json({ 
                success: true, 
                submission,
                message: 'Compliance submission created successfully'
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                message: 'Compliance submission creation failed',
                error: error.message 
            });
        }
    }
);

// ===== USER MANAGEMENT WITH VALIDATION =====

// Invite user with validation
router.post('/enterprises/:enterpriseId/seats/:seatId/invite-user',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('users', 'invite'),
    validationMiddleware.sanitizeInput(),
    validationMiddleware.validateContentType(['application/json']),
    (req, res, next) => {
        const result = inputValidator.validate(validationSchemas.getInviteUserSchema(), req.body);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'User invitation validation failed',
                errors: result.errors
            });
        }
        req.body = result.sanitizedData;
        next();
    },
    async (req, res) => {
        try {
            const { enterpriseId, seatId } = req.params;
            const { email, name, role, permissions, message } = req.body;
            
            // Verify user has permission to invite users to this seat
            if (req.context.agencySeatId !== seatId && 
                req.context.role !== 'enterprise_admin' &&
                req.context.role !== 'platform_super_admin') {
                return res.status(403).json({ 
                    success: false,
                    message: 'Access denied to agency seat' 
                });
            }
            
            const client = await db.connect();
            
            try {
                await client.query('BEGIN');
                
                // Create or get user
                let userResult = await client.query(`
                    SELECT id FROM users WHERE email = $1
                `, [email]);
                
                let userId;
                if (!userResult.rows[0]) {
                    // Create new user
                    const newUserResult = await client.query(`
                        INSERT INTO users (email, name) 
                        VALUES ($1, $2) 
                        RETURNING id
                    `, [email, name]);
                    userId = newUserResult.rows[0].id;
                } else {
                    userId = userResult.rows[0].id;
                }
                
                // Create user context
                await client.query(`
                    INSERT INTO user_contexts 
                    (user_id, enterprise_id, agency_seat_id, role, permissions)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (user_id, enterprise_id, agency_seat_id) 
                    DO UPDATE SET 
                        role = $4,
                        permissions = $5,
                        is_active = true,
                        updated_at = NOW()
                `, [
                    userId,
                    enterpriseId,
                    seatId,
                    role,
                    JSON.stringify(permissions || [])
                ]);
                
                await client.query('COMMIT');
                
                // Log the action
                await hierarchicalAuth.logAction(
                    req.user.id,
                    req.context.id,
                    'invite_user',
                    'user',
                    userId,
                    {
                        invitedEmail: email,
                        seatId,
                        role
                    }
                );
                
                res.json({ 
                    success: true, 
                    message: `User ${email} invited to seat successfully`,
                    userId
                });
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            res.status(400).json({ 
                success: false,
                message: 'User invitation failed',
                error: error.message 
            });
        }
    }
);

// ===== BULK OPERATIONS WITH VALIDATION =====

// Bulk policy assignment with validation
router.post('/enterprises/:enterpriseId/seats/bulk-policy-assignment',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('policies', 'assign'),
    validationMiddleware.sanitizeInput(),
    validationMiddleware.validateContentType(['application/json']),
    validationMiddleware.validatePayloadSize('2mb'),
    (req, res, next) => {
        const result = inputValidator.validate(validationSchemas.getBulkPolicyAssignmentSchema(), req.body);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Bulk policy assignment validation failed',
                errors: result.errors
            });
        }
        req.body = result.sanitizedData;
        next();
    },
    async (req, res) => {
        try {
            const { enterpriseId } = req.params;
            const { seatIds, policyIds, options } = req.body;
            
            // Verify user has permission to assign policies in this enterprise
            if (req.context.enterpriseId !== enterpriseId && 
                req.context.role !== 'platform_super_admin') {
                return res.status(403).json({ 
                    success: false,
                    message: 'Access denied to enterprise' 
                });
            }
            
            const client = await db.connect();
            
            try {
                await client.query('BEGIN');
                
                for (const seatId of seatIds) {
                    for (const policyId of policyIds) {
                        await client.query(`
                            INSERT INTO seat_policy_assignments 
                            (agency_seat_id, policy_id, assignment_type, assigned_by)
                            VALUES ($1, $2, $3, $4)
                            ON CONFLICT (agency_seat_id, policy_id) 
                            DO UPDATE SET 
                                assignment_type = $3,
                                assigned_by = $4,
                                assigned_at = NOW()
                        `, [
                            seatId,
                            policyId,
                            options?.assignmentType || 'direct',
                            req.user.id
                        ]);
                    }
                }
                
                await client.query('COMMIT');
                
                // Log the action
                await hierarchicalAuth.logAction(
                    req.user.id,
                    req.context.id,
                    'bulk_assign_policies',
                    'policy_assignment',
                    null,
                    {
                        seatIds,
                        policyIds,
                        assignmentType: options?.assignmentType
                    }
                );
                
                res.json({ 
                    success: true, 
                    message: `Successfully assigned ${policyIds.length} policies to ${seatIds.length} seats`,
                    summary: {
                        seatsProcessed: seatIds.length,
                        policiesAssigned: policyIds.length,
                        assignmentType: options?.assignmentType || 'direct'
                    }
                });
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            res.status(400).json({ 
                success: false,
                message: 'Bulk policy assignment failed',
                error: error.message 
            });
        }
    }
);

// ===== SEARCH AND FILTER WITH VALIDATION =====

// Search with validation
router.get('/search',
    hierarchicalAuth.requireAuth(),
    validationMiddleware.sanitizeInput(),
    (req, res, next) => {
        const result = inputValidator.validate(validationSchemas.getSearchSchema(), req.query);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Search validation failed',
                errors: result.errors
            });
        }
        req.query = result.sanitizedData;
        next();
    },
    async (req, res) => {
        try {
            const { query, filters, pagination } = req.query;
            
            // Build search query based on validated parameters
            let searchQuery = 'SELECT * FROM policies WHERE 1=1';
            const params = [];
            let paramIndex = 1;
            
            if (query) {
                searchQuery += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
                params.push(`%${query}%`);
                paramIndex++;
            }
            
            if (filters?.type) {
                searchQuery += ` AND policy_type = $${paramIndex}`;
                params.push(filters.type);
                paramIndex++;
            }
            
            if (filters?.status) {
                searchQuery += ` AND status = $${paramIndex}`;
                params.push(filters.status);
                paramIndex++;
            }
            
            // Add pagination
            const page = pagination?.page || 1;
            const limit = pagination?.limit || 20;
            const offset = (page - 1) * limit;
            
            searchQuery += ` ORDER BY ${pagination?.sortBy || 'created_at'} ${pagination?.sortOrder || 'desc'}`;
            searchQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);
            
            const result = await db.query(searchQuery, params);
            
            res.json({ 
                success: true, 
                results: result.rows,
                pagination: {
                    page,
                    limit,
                    total: result.rows.length,
                    hasMore: result.rows.length === limit
                }
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Search failed',
                error: error.message 
            });
        }
    }
);

module.exports = router; 