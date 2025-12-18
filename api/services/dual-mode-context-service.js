// Dual-Mode Context Switching Service
// File: api/services/dual-mode-context-service.js

const hierarchicalAuth = require('../auth/hierarchical-auth');
const contextValidator = require('../auth/context-validator');
const { getCacheService } = require('./cache-service');

class DualModeContextService {
    constructor() {
        this.cache = getCacheService();
    }

    /**
     * Get all available contexts grouped by type (enterprise vs partner)
     */
    async getAvailableContexts(userId) {
        // Check cache first (5-minute TTL)
        const cacheKey = this.cache.userKey(userId, 'available-contexts');
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Get grouped contexts from auth system
        const grouped = await hierarchicalAuth.getUserContextsGrouped(userId);

        // Format for dual-mode display
        const result = {
            enterprise: grouped.enterprise.map(ctx => ({
                id: ctx.contextId,
                name: ctx.agencySeatName || ctx.enterpriseName,
                type: ctx.contextType,
                enterpriseId: ctx.enterpriseId,
                enterpriseName: ctx.enterpriseName,
                agencySeatId: ctx.agencySeatId,
                agencySeatName: ctx.agencySeatName,
                role: ctx.role,
                isDefault: ctx.isDefault,
                lastAccessed: ctx.lastAccessed
            })),
            partner: grouped.partner.map(ctx => ({
                id: ctx.contextId,
                name: `${ctx.partnerEnterpriseName} → ${ctx.clientEnterpriseName}`,
                type: 'partner',
                partnerEnterpriseId: ctx.partnerEnterpriseId,
                partnerEnterpriseName: ctx.partnerEnterpriseName,
                clientEnterpriseId: ctx.clientEnterpriseId,
                clientEnterpriseName: ctx.clientEnterpriseName,
                role: ctx.role,
                isDefault: ctx.isDefault,
                lastAccessed: ctx.lastAccessed,
                relationshipStatus: ctx.relationshipStatus,
                complianceScore: ctx.complianceScore
            })),
            all: [...grouped.enterprise, ...grouped.partner],
            hasMultipleContexts: grouped.all.length > 1,
            hasEnterpriseContexts: grouped.enterprise.length > 0,
            hasPartnerContexts: grouped.partner.length > 0
        };

        // Cache for 5 minutes
        await this.cache.set(cacheKey, result, 300);
        return result;
    }

    /**
     * Switch context with enhanced validation
     */
    async switchContext(userId, contextId, targetType = null) {
        try {
            // Validate context access
            let context;
            let isPartnerContext = false;

            // Try enterprise context first
            try {
                context = await contextValidator.validateContextAccess(userId, contextId);
            } catch (error) {
                // Try partner context
                isPartnerContext = true;
                // For partner contexts, we need partner and client IDs
                // This would need to be passed or looked up
                // For now, we'll use the hierarchical auth switch method
            }

            // Use hierarchical auth to switch
            const switchResult = await hierarchicalAuth.switchUserContext(userId, contextId, targetType);

            // Invalidate context cache
            await this.cache.del(this.cache.userKey(userId, 'available-contexts'));
            await this.cache.del(this.cache.userKey(userId, 'contexts'));

            return switchResult;
        } catch (error) {
            // Audit failed switch
            await contextValidator.auditContextSwitch(
                userId,
                contextId,
                targetType,
                false,
                error.message
            );
            throw error;
        }
    }

    /**
     * Validate context access with relationship checks
     */
    async validateContextAccess(userId, contextId) {
        // Try enterprise context
        try {
            return await contextValidator.validateContextAccess(userId, contextId);
        } catch (error) {
            // Try partner context - would need partner/client IDs
            // For now, delegate to hierarchical auth
            const contexts = await hierarchicalAuth.getUserContexts(userId);
            const context = contexts.find(c => c.contextId === contextId);
            
            if (!context) {
                throw new Error('Context not found or access denied');
            }

            return context;
        }
    }

    /**
     * Get context analytics (switch frequency, most used contexts, etc.)
     */
    async getContextAnalytics(userId, days = 30) {
        const db = require('../../database/connection');
        
        const result = await db.query(`
            SELECT 
                context_id,
                action,
                COUNT(*) as switch_count,
                MAX(created_at) as last_switch
            FROM context_audit_log
            WHERE user_id = $1
              AND action IN ('context_switch_success', 'context_switch_failed')
              AND created_at > NOW() - INTERVAL '${days} days'
            GROUP BY context_id, action
            ORDER BY switch_count DESC
        `, [userId]);

        return {
            totalSwitches: result.rows.reduce((sum, row) => sum + parseInt(row.switch_count), 0),
            successfulSwitches: result.rows
                .filter(r => r.action === 'context_switch_success')
                .reduce((sum, row) => sum + parseInt(row.switch_count), 0),
            failedSwitches: result.rows
                .filter(r => r.action === 'context_switch_failed')
                .reduce((sum, row) => sum + parseInt(row.switch_count), 0),
            contextUsage: result.rows.map(row => ({
                contextId: row.context_id,
                action: row.action,
                count: parseInt(row.switch_count),
                lastSwitch: row.last_switch
            }))
        };
    }

    /**
     * Get partner contexts only
     */
    async getPartnerContexts(userId, partnerEnterpriseId = null) {
        const allContexts = await this.getAvailableContexts(userId);
        
        if (partnerEnterpriseId) {
            return allContexts.partner.filter(
                ctx => ctx.partnerEnterpriseId === partnerEnterpriseId
            );
        }

        return allContexts.partner;
    }

    /**
     * Get enterprise contexts only
     */
    async getEnterpriseContexts(userId) {
        const allContexts = await this.getAvailableContexts(userId);
        return allContexts.enterprise;
    }
}

module.exports = new DualModeContextService();

