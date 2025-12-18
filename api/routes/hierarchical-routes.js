// File: api/routes/hierarchical-routes.js

const express = require('express');
const router = express.Router();
const hierarchicalAuth = require('../auth/hierarchical-auth');
const db = require('../../database/connection');

// ===== AUTHENTICATION ROUTES =====

// Login with context awareness
router.post('/auth/login', async (req, res) => {
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
        res.status(401).json({ error: error.message });
    }
});

// Switch user context (enhanced with dual-mode support)
router.post('/auth/context/switch', 
    hierarchicalAuth.requireAuth(),
    async (req, res) => {
        try {
            const { contextId, targetType } = req.body;
            const userId = req.user.id;
            
            const switchResult = await hierarchicalAuth.switchUserContext(userId, contextId, targetType);
            
            res.json({
                success: true,
                context: switchResult.context,
                token: switchResult.token
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Get user contexts (all contexts)
router.get('/auth/contexts', 
    hierarchicalAuth.requireAuth(),
    async (req, res) => {
        try {
            const contexts = await hierarchicalAuth.getUserContexts(req.user.id);
            res.json({ contexts });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get available contexts grouped by type (dual-mode)
router.get('/auth/contexts/available',
    hierarchicalAuth.requireAuth(),
    async (req, res) => {
        try {
            const dualModeService = require('../services/dual-mode-context-service');
            const contexts = await dualModeService.getAvailableContexts(req.user.id);
            res.json({ success: true, ...contexts });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get partner contexts only
router.get('/auth/contexts/partner',
    hierarchicalAuth.requireAuth(),
    async (req, res) => {
        try {
            const dualModeService = require('../services/dual-mode-context-service');
            const partnerEnterpriseId = req.query.partnerEnterpriseId || null;
            const contexts = await dualModeService.getPartnerContexts(req.user.id, partnerEnterpriseId);
            res.json({ success: true, contexts, count: contexts.length });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get enterprise contexts only
router.get('/auth/contexts/enterprise',
    hierarchicalAuth.requireAuth(),
    async (req, res) => {
        try {
            const dualModeService = require('../services/dual-mode-context-service');
            const contexts = await dualModeService.getEnterpriseContexts(req.user.id);
            res.json({ success: true, contexts, count: contexts.length });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get context analytics
router.get('/auth/contexts/analytics',
    hierarchicalAuth.requireAuth(),
    async (req, res) => {
        try {
            const dualModeService = require('../services/dual-mode-context-service');
            const days = parseInt(req.query.days) || 30;
            const analytics = await dualModeService.getContextAnalytics(req.user.id, days);
            res.json({ success: true, analytics });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ===== ENTERPRISE MANAGEMENT ROUTES =====

// Create enterprise (platform super admin only)
router.post('/enterprises',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requireRole(['platform_super_admin']),
    async (req, res) => {
        try {
            const enterprise = await hierarchicalAuth.createEnterprise(
                req.body,
                req.user.id
            );
            
            res.json({ success: true, enterprise });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Get enterprise details
router.get('/enterprises/:enterpriseId',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('enterprises', 'read'),
    async (req, res) => {
        try {
            const { enterpriseId } = req.params;
            
            // Verify user has access to this enterprise
            if (req.context.enterpriseId !== enterpriseId && 
                req.context.role !== 'platform_super_admin') {
                return res.status(403).json({ error: 'Access denied to enterprise' });
            }
            
            const result = await db.query(`
                SELECT e.*, 
                       COUNT(DISTINCT as.id) as seat_count,
                       COUNT(DISTINCT uc.user_id) as user_count
                FROM enterprises e
                LEFT JOIN agency_seats as ON e.id = as.enterprise_id AND as.is_active = true
                LEFT JOIN user_contexts uc ON e.id = uc.enterprise_id AND uc.is_active = true
                WHERE e.id = $1
                GROUP BY e.id, e.name, e.type
            `, [enterpriseId]);
            
            if (!result.rows[0]) {
                return res.status(404).json({ error: 'Enterprise not found' });
            }
            
            res.json({ enterprise: result.rows[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ===== AGENCY SEAT MANAGEMENT ROUTES =====

// Create agency seat
router.post('/enterprises/:enterpriseId/seats',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('agency_seats', 'create'),
    async (req, res) => {
        try {
            const { enterpriseId } = req.params;
            
            // Verify user has permission to create seats in this enterprise
            if (req.context.enterpriseId !== enterpriseId && 
                req.context.role !== 'platform_super_admin') {
                return res.status(403).json({ error: 'Access denied to enterprise' });
            }
            
            const seat = await hierarchicalAuth.createAgencySeat(
                enterpriseId,
                req.body,
                req.user.id
            );
            
            res.json({ success: true, seat });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Get enterprise seats
router.get('/enterprises/:enterpriseId/seats',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('agency_seats', 'read'),
    async (req, res) => {
        try {
            const { enterpriseId } = req.params;
            
            // Verify user has access to this enterprise
            if (req.context.enterpriseId !== enterpriseId && 
                req.context.role !== 'platform_super_admin') {
                return res.status(403).json({ error: 'Access denied to enterprise' });
            }
            
            const result = await db.query(`
                SELECT as.*, 
                       COUNT(DISTINCT uc.user_id) as user_count,
                       COUNT(DISTINCT spa.policy_id) as policy_count
                FROM agency_seats as
                LEFT JOIN user_contexts uc ON as.id = uc.agency_seat_id AND uc.is_active = true
                LEFT JOIN seat_policy_assignments spa ON as.id = spa.agency_seat_id AND spa.is_active = true
                WHERE as.enterprise_id = $1 AND as.is_active = true
                GROUP BY as.id
                ORDER BY as.created_at DESC
            `, [enterpriseId]);
            
            res.json({ seats: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ===== POLICY MANAGEMENT ROUTES =====

// Create policy
router.post('/policies',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('policies', 'create'),
    async (req, res) => {
        try {
            const { enterpriseId, agencySeatId, ...policyData } = req.body;
            
            // Verify user has permission to create policies
            if (agencySeatId) {
                // Creating seat-specific policy
                if (req.context.agencySeatId !== agencySeatId && 
                    req.context.role !== 'enterprise_admin' &&
                    req.context.role !== 'platform_super_admin') {
                    return res.status(403).json({ error: 'Access denied to agency seat' });
                }
            } else {
                // Creating enterprise policy
                if (req.context.enterpriseId !== enterpriseId && 
                    req.context.role !== 'platform_super_admin') {
                    return res.status(403).json({ error: 'Access denied to enterprise' });
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
            
            res.json({ success: true, policy });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Assign policies to seats
router.post('/enterprises/:enterpriseId/seats/bulk-policy-assignment',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('policies', 'assign'),
    async (req, res) => {
        try {
            const { enterpriseId } = req.params;
            const { seatIds, policyIds, options } = req.body;
            
            // Verify user has permission to assign policies in this enterprise
            if (req.context.enterpriseId !== enterpriseId && 
                req.context.role !== 'platform_super_admin') {
                return res.status(403).json({ error: 'Access denied to enterprise' });
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
                            options.assignmentType || 'direct',
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
                        assignmentType: options.assignmentType
                    }
                );
                
                res.json({ 
                    success: true, 
                    message: `Assigned ${policyIds.length} policies to ${seatIds.length} seats` 
                });
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// ===== USER MANAGEMENT ROUTES =====

// Invite user to seat
router.post('/enterprises/:enterpriseId/seats/:seatId/invite-user',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('users', 'invite'),
    async (req, res) => {
        try {
            const { enterpriseId, seatId } = req.params;
            const { email, role, permissions } = req.body;
            
            // Verify user has permission to invite users to this seat
            if (req.context.agencySeatId !== seatId && 
                req.context.role !== 'enterprise_admin' &&
                req.context.role !== 'platform_super_admin') {
                return res.status(403).json({ error: 'Access denied to agency seat' });
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
                    `, [email, req.body.name || email.split('@')[0]]);
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
                    role || 'seat_user',
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
                        role: role || 'seat_user'
                    }
                );
                
                res.json({ 
                    success: true, 
                    message: `User ${email} invited to seat` 
                });
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// ===== DASHBOARD ROUTES =====

// Get enterprise dashboard data
router.get('/dashboard/enterprise/:enterpriseId',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('dashboard', 'read'),
    async (req, res) => {
        try {
            const { enterpriseId } = req.params;
            
            // Verify user has access to this enterprise
            if (req.context.enterpriseId !== enterpriseId && 
                req.context.role !== 'platform_super_admin') {
                return res.status(403).json({ error: 'Access denied to enterprise' });
            }
            
            // Get enterprise metrics
            const metricsResult = await db.query(`
                SELECT 
                    e.name as enterprise_name,
                    e.type as enterprise_type,
                    COUNT(DISTINCT as.id) as active_seats,
                    COUNT(DISTINCT uc.user_id) as total_users,
                    COUNT(DISTINCT p.id) as total_policies,
                    AVG(CAST(ae.avg_confidence AS DECIMAL)) as avg_confidence,
                    AVG(CAST(ae.avg_compliance_score AS DECIMAL)) as avg_compliance_score
                FROM enterprises e
                LEFT JOIN agency_seats as ON e.id = as.enterprise_id AND as.is_active = true
                LEFT JOIN user_contexts uc ON e.id = uc.enterprise_id AND uc.is_active = true
                LEFT JOIN policies p ON e.id = p.enterprise_id AND p.is_active = true
                LEFT JOIN audit_sessions ae ON e.id = ae.organization_id
                WHERE e.id = $1
                GROUP BY e.id, e.name, e.type
            `, [enterpriseId]);
            
            const enterprise = metricsResult.rows[0];
            
            // Get recent activity
            const activityResult = await db.query(`
                SELECT 
                    cal.action,
                    cal.resource_type,
                    cal.details,
                    cal.created_at,
                    u.name as user_name
                FROM context_audit_log cal
                JOIN users u ON cal.user_id = u.id
                JOIN user_contexts uc ON cal.context_id = uc.id
                WHERE uc.enterprise_id = $1
                ORDER BY cal.created_at DESC
                LIMIT 10
            `, [enterpriseId]);
            
            res.json({
                enterprise,
                recentActivity: activityResult.rows
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get agency seat dashboard data
router.get('/dashboard/agency-seat/:seatId',
    hierarchicalAuth.requireAuth(),
    hierarchicalAuth.requirePermission('dashboard', 'read'),
    async (req, res) => {
        try {
            const { seatId } = req.params;
            
            // Verify user has access to this seat
            if (req.context.agencySeatId !== seatId && 
                req.context.role !== 'enterprise_admin' &&
                req.context.role !== 'platform_super_admin') {
                return res.status(403).json({ error: 'Access denied to agency seat' });
            }
            
            // Get seat metrics
            const metricsResult = await db.query(`
                SELECT 
                    as.name as seat_name,
                    as.description,
                    COUNT(DISTINCT uc.user_id) as total_users,
                    COUNT(DISTINCT spa.policy_id) as assigned_policies,
                    AVG(CAST(ae.avg_confidence AS DECIMAL)) as avg_confidence,
                    AVG(CAST(ae.avg_compliance_score AS DECIMAL)) as avg_compliance_score
                FROM agency_seats as
                LEFT JOIN user_contexts uc ON as.id = uc.agency_seat_id AND uc.is_active = true
                LEFT JOIN seat_policy_assignments spa ON as.id = spa.agency_seat_id AND spa.is_active = true
                LEFT JOIN audit_sessions ae ON as.enterprise_id = ae.organization_id
                WHERE as.id = $1
                GROUP BY as.id, as.name, as.description
            `, [seatId]);
            
            const seat = metricsResult.rows[0];
            
            // Get seat-specific policies
            const policiesResult = await db.query(`
                SELECT p.*, spa.assignment_type
                FROM policies p
                JOIN seat_policy_assignments spa ON p.id = spa.policy_id
                WHERE spa.agency_seat_id = $1 AND spa.is_active = true
                ORDER BY spa.priority DESC, p.created_at DESC
            `, [seatId]);
            
            res.json({
                seat,
                policies: policiesResult.rows
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

module.exports = router; 