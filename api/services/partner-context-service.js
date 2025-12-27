// Partner Context Service
// File: api/services/partner-context-service.js

import db from '../../database/connection.js';
import { getCacheService } from './cache-service.js';
import relationshipService from './relationship-service.js';
import contextValidator from '../auth/context-validator.js';

class PartnerContextService {
    constructor() {
        this.cache = getCacheService();
    }

    /**
     * Create partner-client context for a user
     */
    async createPartnerClientContext(userId, partnerEnterpriseId, clientEnterpriseId, role, createdByUserId) {
        // Validate user has access to partner enterprise
        const partnerContextResult = await db.query(`
            SELECT * FROM user_contexts
            WHERE user_id = $1 
              AND enterprise_id = $2
              AND is_active = true
        `, [userId, partnerEnterpriseId]);

        if (!partnerContextResult.rows[0]) {
            throw new Error('User does not have access to partner enterprise');
        }

        // Validate relationship exists and is active
        await relationshipService.validatePartnerRelationship(partnerEnterpriseId, clientEnterpriseId);

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Check if context already exists
            const existing = await client.query(`
                SELECT * FROM partner_client_contexts
                WHERE user_id = $1
                  AND partner_enterprise_id = $2
                  AND client_enterprise_id = $3
            `, [userId, partnerEnterpriseId, clientEnterpriseId]);

            if (existing.rows[0]) {
                throw new Error('Partner-client context already exists');
            }

            // Create context
            const result = await client.query(`
                INSERT INTO partner_client_contexts (
                    user_id,
                    partner_enterprise_id,
                    client_enterprise_id,
                    role,
                    permissions,
                    is_default
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [
                userId,
                partnerEnterpriseId,
                clientEnterpriseId,
                role,
                JSON.stringify(this.getDefaultPermissionsForRole(role)),
                false // Don't set as default automatically
            ]);

            await client.query('COMMIT');

            // Invalidate cache
            await this.invalidateUserContextCache(userId);

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * List user's partner contexts
     */
    async listUserPartnerContexts(userId, partnerEnterpriseId = null) {
        let query = `
            SELECT 
                pcc.*,
                pe.name as partner_enterprise_name,
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
        `;
        const params = [userId];

        if (partnerEnterpriseId) {
            query += ` AND pcc.partner_enterprise_id = $2`;
            params.push(partnerEnterpriseId);
        }

        query += ` ORDER BY pcc.last_accessed DESC`;

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Remove partner-client context
     */
    async removePartnerClientContext(contextId, userId) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Verify context belongs to user
            const contextResult = await client.query(`
                SELECT * FROM partner_client_contexts
                WHERE id = $1 AND user_id = $2
            `, [contextId, userId]);

            if (!contextResult.rows[0]) {
                throw new Error('Context not found or access denied');
            }

            // Soft delete
            await client.query(`
                UPDATE partner_client_contexts
                SET is_active = false, updated_at = NOW()
                WHERE id = $1
            `, [contextId]);

            await client.query('COMMIT');

            // Invalidate cache
            await this.invalidateUserContextCache(userId);

            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get default permissions for a role
     */
    getDefaultPermissionsForRole(role) {
        const rolePermissions = {
            'partner_admin': ['partner:manage', 'client:view', 'submission:create', 'submission:view'],
            'partner_user': ['submission:create', 'submission:view', 'client:view'],
            'account_manager': ['client:manage', 'client:view', 'submission:view', 'compliance:view'],
            'creative_director': ['creative:approve', 'creative:view', 'submission:view'],
            'project_manager': ['project:manage', 'submission:view', 'workflow:manage'],
            'compliance_manager': ['compliance:review', 'compliance:view', 'submission:view']
        };

        return rolePermissions[role] || [];
    }

    /**
     * Invalidate user context cache
     */
    async invalidateUserContextCache(userId) {
        await this.cache.del(this.cache.userKey(userId, 'contexts'));
    }
}

export default new PartnerContextService();

