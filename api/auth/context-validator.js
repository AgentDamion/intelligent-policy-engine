// Context Validation Utilities
// File: api/auth/context-validator.js

const db = require('../../database/connection');

class ContextValidator {
    /**
     * Validate that a user has access to a specific context
     */
    async validateContextAccess(userId, contextId) {
        // Check if context exists and user has access
        const contextResult = await db.query(`
            SELECT uc.*, e.type as enterprise_type, e.name as enterprise_name
            FROM user_contexts uc
            JOIN enterprises e ON uc.enterprise_id = e.id
            WHERE uc.id = $1 AND uc.user_id = $2 AND uc.is_active = true
        `, [contextId, userId]);

        if (!contextResult.rows[0]) {
            throw new Error('Context not found or access denied');
        }

        return contextResult.rows[0];
    }

    /**
     * Validate partner relationship for partner-client contexts
     */
    async validatePartnerRelationship(partnerEnterpriseId, clientEnterpriseId) {
        const relationshipResult = await db.query(`
            SELECT * FROM partner_enterprise_relationships
            WHERE partner_enterprise_id = $1 
              AND client_enterprise_id = $2
              AND relationship_status = 'active'
        `, [partnerEnterpriseId, clientEnterpriseId]);

        if (!relationshipResult.rows[0]) {
            throw new Error('No active relationship between partner and client');
        }

        return relationshipResult.rows[0];
    }

    /**
     * Check if user has access to partner-client context
     */
    async validatePartnerClientContext(userId, partnerEnterpriseId, clientEnterpriseId) {
        // First check if user has partner context
        const partnerContextResult = await db.query(`
            SELECT * FROM user_contexts
            WHERE user_id = $1 
              AND enterprise_id = $2
              AND is_active = true
        `, [userId, partnerEnterpriseId]);

        if (!partnerContextResult.rows[0]) {
            throw new Error('User does not have access to partner enterprise');
        }

        // Check if relationship exists
        await this.validatePartnerRelationship(partnerEnterpriseId, clientEnterpriseId);

        // Check if partner-client context exists
        const partnerClientContextResult = await db.query(`
            SELECT * FROM partner_client_contexts
            WHERE user_id = $1
              AND partner_enterprise_id = $2
              AND client_enterprise_id = $3
              AND is_active = true
        `, [userId, partnerEnterpriseId, clientEnterpriseId]);

        return partnerClientContextResult.rows[0] || null;
    }

    /**
     * Audit context switch attempt
     */
    async auditContextSwitch(userId, contextId, targetType, success, errorMessage = null) {
        try {
            await db.query(`
                INSERT INTO context_audit_log 
                (user_id, context_id, action, resource_type, details)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                userId,
                contextId,
                success ? 'context_switch_success' : 'context_switch_failed',
                'context',
                JSON.stringify({
                    targetType,
                    success,
                    errorMessage,
                    timestamp: new Date().toISOString()
                })
            ]);
        } catch (error) {
            console.error('Failed to audit context switch:', error);
        }
    }

    /**
     * Get context type (enterprise, agencySeat, partner)
     */
    getContextType(enterpriseType, agencySeatId, partnerEnterpriseId) {
        if (partnerEnterpriseId) {
            return 'partner';
        }
        if (agencySeatId) {
            return 'agencySeat';
        }
        return 'enterprise';
    }
}

module.exports = new ContextValidator();

