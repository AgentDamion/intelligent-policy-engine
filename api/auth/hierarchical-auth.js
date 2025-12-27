// File: api/auth/hierarchical-auth.js

import jwt from 'jsonwebtoken';
// Use pure-JS bcrypt implementation to avoid native build issues in dev environments.
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import db from '../../database/connection.js';
import { getCacheService } from '../services/cache-service.js';
import contextValidator from './context-validator.js';

class HierarchicalAuthSystem {
    constructor() {
        this.permissionCache = new Map();
        this.contextCache = new Map();
        this.cache = getCacheService();
    }

    // ===== AUTHENTICATION =====

    async authenticateUser(email, password) {
        try {
            // Get user with all contexts
            const userResult = await db.query(`
                SELECT u.*, 
                       array_agg(uc.id) as context_ids,
                       array_agg(uc.role) as roles,
                       array_agg(uc.enterprise_id) as enterprise_ids
                FROM users u
                LEFT JOIN user_contexts uc ON u.id = uc.user_id AND uc.is_active = true
                WHERE u.email = $1 AND u.is_active = true
                GROUP BY u.id
            `, [email]);

            if (!userResult.rows[0]) {
                throw new Error('Invalid credentials');
            }

            const user = userResult.rows[0];
            
            // Verify password (implement your password verification logic)
            // const isValidPassword = await bcrypt.compare(password, user.password_hash);
            // if (!isValidPassword) {
            //     throw new Error('Invalid credentials');
            // }

            // Get user's default context
            const defaultContext = await this.getUserDefaultContext(user.id);
            
            // Generate JWT with context information
            const token = this.generateContextAwareToken(user, defaultContext);
            
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    contexts: await this.getUserContexts(user.id)
                },
                token,
                defaultContext
            };
        } catch (error) {
            console.error('Authentication failed:', error);
            throw error;
        }
    }

    // ===== CONTEXT MANAGEMENT =====

    async getUserContexts(userId) {
        // Check cache first (5-minute TTL)
        const cacheKey = this.cache.userKey(userId, 'contexts');
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const result = await db.query(`
            SELECT 
                uc.id as context_id,
                uc.role,
                uc.permissions,
                uc.is_default,
                uc.last_accessed,
                e.id as enterprise_id,
                e.name as enterprise_name,
                e.type as enterprise_type,
                as.id as agency_seat_id,
                as.name as agency_seat_name,
                as.slug as agency_seat_slug
            FROM user_contexts uc
            JOIN enterprises e ON uc.enterprise_id = e.id
            LEFT JOIN agency_seats as ON uc.agency_seat_id = as.id
            WHERE uc.user_id = $1 AND uc.is_active = true
            ORDER BY uc.is_default DESC, uc.last_accessed DESC
        `, [userId]);

        const contexts = result.rows.map(row => ({
            contextId: row.context_id,
            contextType: row.agency_seat_id ? 'agencySeat' : 'enterprise',
            enterpriseId: row.enterprise_id,
            enterpriseName: row.enterprise_name,
            enterpriseType: row.enterprise_type,
            agencySeatId: row.agency_seat_id,
            agencySeatName: row.agency_seat_name,
            agencySeatSlug: row.agency_seat_slug,
            role: row.role,
            permissions: row.permissions || [],
            isDefault: row.is_default,
            lastAccessed: row.last_accessed
        }));

        // Cache for 5 minutes
        await this.cache.set(cacheKey, contexts, 300);
        return contexts;
    }

    /**
     * Get user contexts grouped by type (enterprise vs partner)
     */
    async getUserContextsGrouped(userId) {
        const allContexts = await this.getUserContexts(userId);
        
        // Get partner-client contexts
        const partnerContextsResult = await db.query(`
            SELECT 
                pcc.id as context_id,
                pcc.role,
                pcc.permissions,
                pcc.is_default,
                pcc.last_accessed,
                pe.id as partner_enterprise_id,
                pe.name as partner_enterprise_name,
                ce.id as client_enterprise_id,
                ce.name as client_enterprise_name,
                per.relationship_status,
                per.compliance_score
            FROM partner_client_contexts pcc
            JOIN enterprises pe ON pcc.partner_enterprise_id = pe.id
            JOIN enterprises ce ON pcc.client_enterprise_id = ce.id
            LEFT JOIN partner_enterprise_relationships per 
                ON pcc.partner_enterprise_id = per.partner_enterprise_id
                AND pcc.client_enterprise_id = per.client_enterprise_id
            WHERE pcc.user_id = $1 AND pcc.is_active = true
            ORDER BY pcc.is_default DESC, pcc.last_accessed DESC
        `, [userId]);

        const partnerContexts = partnerContextsResult.rows.map(row => ({
            contextId: row.context_id,
            contextType: 'partner',
            partnerEnterpriseId: row.partner_enterprise_id,
            partnerEnterpriseName: row.partner_enterprise_name,
            clientEnterpriseId: row.client_enterprise_id,
            clientEnterpriseName: row.client_enterprise_name,
            role: row.role,
            permissions: row.permissions || [],
            isDefault: row.is_default,
            lastAccessed: row.last_accessed,
            relationshipStatus: row.relationship_status,
            complianceScore: row.compliance_score
        }));

        return {
            enterprise: allContexts.filter(c => c.contextType !== 'partner'),
            partner: partnerContexts,
            all: [...allContexts, ...partnerContexts]
        };
    }

    /**
     * Get partner-client contexts for a specific partner enterprise
     */
    async getPartnerClientContexts(userId, partnerEnterpriseId) {
        const result = await db.query(`
            SELECT 
                pcc.*,
                ce.id as client_enterprise_id,
                ce.name as client_enterprise_name,
                ce.type as client_enterprise_type,
                per.relationship_status,
                per.compliance_score
            FROM partner_client_contexts pcc
            JOIN enterprises ce ON pcc.client_enterprise_id = ce.id
            LEFT JOIN partner_enterprise_relationships per 
                ON pcc.partner_enterprise_id = per.partner_enterprise_id
                AND pcc.client_enterprise_id = per.client_enterprise_id
            WHERE pcc.user_id = $1 
              AND pcc.partner_enterprise_id = $2
              AND pcc.is_active = true
            ORDER BY pcc.last_accessed DESC
        `, [userId, partnerEnterpriseId]);

        return result.rows.map(row => ({
            contextId: row.id,
            partnerEnterpriseId: row.partner_enterprise_id,
            clientEnterpriseId: row.client_enterprise_id,
            clientEnterpriseName: row.client_enterprise_name,
            clientEnterpriseType: row.client_enterprise_type,
            role: row.role,
            permissions: row.permissions || [],
            relationshipStatus: row.relationship_status,
            complianceScore: row.compliance_score,
            lastAccessed: row.last_accessed
        }));
    }

    /**
     * Validate partner relationship
     */
    async validatePartnerRelationship(partnerId, clientId) {
        return await contextValidator.validatePartnerRelationship(partnerId, clientId);
    }

    async getUserDefaultContext(userId) {
        const result = await db.query(`
            SELECT 
                uc.id as context_id,
                uc.role,
                uc.permissions,
                e.id as enterprise_id,
                e.name as enterprise_name,
                e.type as enterprise_type,
                as.id as agency_seat_id,
                as.name as agency_seat_name
            FROM user_contexts uc
            JOIN enterprises e ON uc.enterprise_id = e.id
            LEFT JOIN agency_seats as ON uc.agency_seat_id = as.id
            WHERE uc.user_id = $1 AND uc.is_default = true AND uc.is_active = true
            LIMIT 1
        `, [userId]);

        if (!result.rows[0]) {
            throw new Error('No default context found for user');
        }

        const context = result.rows[0];
        return {
            contextId: context.context_id,
            contextType: context.agency_seat_id ? 'agencySeat' : 'enterprise',
            enterpriseId: context.enterprise_id,
            enterpriseName: context.enterprise_name,
            enterpriseType: context.enterprise_type,
            agencySeatId: context.agency_seat_id,
            agencySeatName: context.agency_seat_name,
            role: context.role,
            permissions: context.permissions || []
        };
    }

    async switchUserContext(userId, contextId, targetType = null) {
        let context;
        let isPartnerContext = false;

        // Try to find in user_contexts first
        const contextResult = await db.query(`
            SELECT uc.*, e.name as enterprise_name, e.type as enterprise_type, 
                   as.name as agency_seat_name
            FROM user_contexts uc
            JOIN enterprises e ON uc.enterprise_id = e.id
            LEFT JOIN agency_seats as ON uc.agency_seat_id = as.id
            WHERE uc.id = $1 AND uc.user_id = $2 AND uc.is_active = true
        `, [contextId, userId]);

        if (contextResult.rows[0]) {
            context = contextResult.rows[0];
            isPartnerContext = false;
        } else {
            // Try partner_client_contexts
            const partnerContextResult = await db.query(`
                SELECT pcc.*, 
                       pe.name as partner_enterprise_name,
                       ce.name as client_enterprise_name,
                       ce.id as client_enterprise_id,
                       pe.id as partner_enterprise_id
                FROM partner_client_contexts pcc
                JOIN enterprises pe ON pcc.partner_enterprise_id = pe.id
                JOIN enterprises ce ON pcc.client_enterprise_id = ce.id
                WHERE pcc.id = $1 AND pcc.user_id = $2 AND pcc.is_active = true
            `, [contextId, userId]);

            if (!partnerContextResult.rows[0]) {
                throw new Error('Context not found or access denied');
            }

            context = partnerContextResult.rows[0];
            isPartnerContext = true;

            // Validate relationship is active
            await this.validatePartnerRelationship(
                context.partner_enterprise_id,
                context.client_enterprise_id
            );
        }

        // Update last accessed
        if (isPartnerContext) {
            await db.query(`
                UPDATE partner_client_contexts 
                SET last_accessed = NOW() 
                WHERE id = $1
            `, [contextId]);
        } else {
            await db.query(`
                UPDATE user_contexts 
                SET last_accessed = NOW() 
                WHERE id = $1
            `, [contextId]);
        }

        // Invalidate context cache
        await this.cache.del(this.cache.userKey(userId, 'contexts'));

        // Generate new token with updated context
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];
        
        let updatedContext;
        if (isPartnerContext) {
            updatedContext = {
                contextId: context.id,
                contextType: 'partner',
                partnerEnterpriseId: context.partner_enterprise_id,
                partnerEnterpriseName: context.partner_enterprise_name,
                clientEnterpriseId: context.client_enterprise_id,
                clientEnterpriseName: context.client_enterprise_name,
                enterpriseId: context.client_enterprise_id, // For compatibility
                role: context.role,
                permissions: context.permissions || []
            };
        } else {
            updatedContext = {
                contextId: context.id,
                contextType: context.agency_seat_id ? 'agencySeat' : 'enterprise',
                enterpriseId: context.enterprise_id,
                enterpriseName: context.enterprise_name,
                agencySeatId: context.agency_seat_id,
                agencySeatName: context.agency_seat_name,
                role: context.role,
                permissions: context.permissions || []
            };
        }

        const token = this.generateContextAwareToken(user, updatedContext);

        // Audit context switch
        await contextValidator.auditContextSwitch(
            userId,
            contextId,
            targetType || updatedContext.contextType,
            true
        );

        return {
            context: updatedContext,
            token
        };
    }

    // ===== JWT TOKEN MANAGEMENT =====

    generateContextAwareToken(user, context) {
        const payload = {
            userId: user.id,
            email: user.email,
            name: user.name,
            contextId: context.contextId,
            contextType: context.contextType,
            enterpriseId: context.enterpriseId,
            agencySeatId: context.agencySeatId,
            role: context.role,
            permissions: context.permissions,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        };

        return jwt.sign(payload, process.env.JWT_SECRET || 'your-jwt-secret');
    }

    verifyContextAwareToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    // ===== AUTHORIZATION =====

    async checkPermission(token, resource, action, resourceId = null) {
        const decoded = this.verifyContextAwareToken(token);
        
        // Platform super admin has all permissions
        if (decoded.role === 'platform_super_admin') {
            return true;
        }

        // Check explicit permissions in token
        if (decoded.permissions && Array.isArray(decoded.permissions)) {
            const hasPermission = decoded.permissions.some(permission => 
                permission.resource === resource && 
                permission.action === action &&
                (!permission.resourceId || permission.resourceId === resourceId)
            );
            
            if (hasPermission) {
                return true;
            }
        }

        // Check role-based permissions
        const rolePermissions = await this.getRolePermissions(decoded.role);
        const hasRolePermission = rolePermissions.some(permission => 
            permission.resource === resource && 
            permission.action === action
        );

        return hasRolePermission;
    }

    async getRolePermissions(role) {
        // Cache role permissions for performance
        if (this.permissionCache.has(role)) {
            return this.permissionCache.get(role);
        }

        const result = await db.query(`
            SELECT p.*
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role = $1 AND rp.is_granted = true
        `, [role]);

        const permissions = result.rows;
        this.permissionCache.set(role, permissions);
        
        return permissions;
    }

    // ===== CONTEXT-AWARE MIDDLEWARE =====

    requireAuth() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({ error: 'Authorization header required' });
                }

                const token = authHeader.substring(7);
                const decoded = this.verifyContextAwareToken(token);

                // Add user and context info to request
                req.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    name: decoded.name
                };

                req.context = {
                    id: decoded.contextId,
                    type: decoded.contextType,
                    enterpriseId: decoded.enterpriseId,
                    agencySeatId: decoded.agencySeatId,
                    role: decoded.role,
                    permissions: decoded.permissions || []
                };

                next();
            } catch (error) {
                return res.status(401).json({ error: 'Authentication failed' });
            }
        };
    }

    requirePermission(resource, action) {
        return async (req, res, next) => {
            try {
                const token = req.headers.authorization?.substring(7);
                if (!token) {
                    return res.status(401).json({ error: 'Token required' });
                }

                const hasPermission = await this.checkPermission(token, resource, action, req.params.id);
                
                if (!hasPermission) {
                    return res.status(403).json({ 
                        error: `Insufficient permissions for ${action} on ${resource}` 
                    });
                }

                next();
            } catch (error) {
                return res.status(500).json({ error: 'Authorization check failed' });
            }
        };
    }

    requireRole(roles) {
        return (req, res, next) => {
            const userRole = req.context?.role;
            
            if (!userRole || !roles.includes(userRole)) {
                return res.status(403).json({ 
                    error: `Required roles: ${roles.join(', ')}. Current role: ${userRole}` 
                });
            }

            next();
        };
    }

    // ===== AUDIT LOGGING =====

    async logAction(userId, contextId, action, resourceType, resourceId, details = {}) {
        try {
            await db.query(`
                INSERT INTO context_audit_log 
                (user_id, context_id, action, resource_type, resource_id, details, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                userId,
                contextId,
                action,
                resourceType,
                resourceId,
                JSON.stringify(details),
                details.ipAddress || null,
                details.userAgent || null
            ]);
        } catch (error) {
            console.error('Failed to log audit action:', error);
        }
    }

    // ===== ENTERPRISE & SEAT MANAGEMENT =====

    async createEnterprise(enterpriseData, createdByUserId) {
        const client = await db.connect();
        
        try {
            await client.query('BEGIN');

            // Create enterprise
            const enterpriseResult = await client.query(`
                INSERT INTO enterprises (name, slug, type, subscription_tier, settings)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [
                enterpriseData.name,
                enterpriseData.slug,
                enterpriseData.type,
                enterpriseData.subscriptionTier || 'standard',
                JSON.stringify(enterpriseData.settings || {})
            ]);

            const enterprise = enterpriseResult.rows[0];

            // Create enterprise owner context for creator
            await client.query(`
                INSERT INTO user_contexts 
                (user_id, enterprise_id, role, permissions, is_default)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                createdByUserId,
                enterprise.id,
                'enterprise_owner',
                JSON.stringify(['*']), // Full permissions
                true
            ]);

            await client.query('COMMIT');

            // Log the action
            await this.logAction(createdByUserId, enterprise.id, 'create_enterprise', 'enterprise', enterprise.id, {
                enterpriseName: enterprise.name,
                enterpriseType: enterprise.type
            });

            return enterprise;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async createAgencySeat(enterpriseId, seatData, createdByUserId) {
        // Verify creator has permission to create seats in this enterprise
        const hasPermission = await this.checkPermission(
            req.headers.authorization?.substring(7),
            'agency_seats',
            'create',
            enterpriseId
        );

        if (!hasPermission) {
            throw new Error('Insufficient permissions to create agency seat');
        }

        const client = await db.connect();
        
        try {
            await client.query('BEGIN');

            // Create agency seat
            const seatResult = await client.query(`
                INSERT INTO agency_seats 
                (enterprise_id, name, slug, description, seat_type, settings)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [
                enterpriseId,
                seatData.name,
                seatData.slug,
                seatData.description,
                seatData.seatType || 'standard',
                JSON.stringify(seatData.settings || {})
            ]);

            const seat = seatResult.rows[0];

            // Create seat admin context for creator
            await client.query(`
                INSERT INTO user_contexts 
                (user_id, enterprise_id, agency_seat_id, role, permissions)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                createdByUserId,
                enterpriseId,
                seat.id,
                'seat_admin',
                JSON.stringify(['seat_manage', 'policy_assign', 'user_invite'])
            ]);

            await client.query('COMMIT');

            // Log the action
            await this.logAction(createdByUserId, seat.id, 'create_agency_seat', 'agency_seat', seat.id, {
                seatName: seat.name,
                enterpriseId: enterpriseId
            });

            return seat;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

export default new HierarchicalAuthSystem(); 