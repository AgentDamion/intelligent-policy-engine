// Dashboard Service with Caching
// File: api/services/dashboard-service.js

import db from '../../database/connection.js';
import { getCacheService } from './cache-service.js';

class DashboardService {
    constructor() {
        this.cache = getCacheService();
        this.cacheTTL = 3600; // 1 hour
    }

    /**
     * Get enterprise dashboard data
     */
    async getEnterpriseDashboard(enterpriseId) {
        const cacheKey = this.cache.enterpriseKey(enterpriseId, 'dashboard');
        
        // Check cache
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Query materialized view
        const result = await db.query(`
            SELECT * FROM enterprise_dashboard_cache
            WHERE enterprise_id = $1
        `, [enterpriseId]);

        if (result.rows.length === 0) {
            // Fallback to direct query if view not available
            return await this.getEnterpriseDashboardDirect(enterpriseId);
        }

        const dashboard = result.rows[0];
        
        // Cache the result
        await this.cache.set(cacheKey, dashboard, this.cacheTTL);
        
        return dashboard;
    }

    /**
     * Get enterprise dashboard data directly (fallback)
     */
    async getEnterpriseDashboardDirect(enterpriseId) {
        const result = await db.query(`
            SELECT 
                e.id as enterprise_id,
                e.name as enterprise_name,
                e.type as enterprise_type,
                e.subscription_tier,
                COUNT(DISTINCT uc.user_id) as total_users,
                COUNT(DISTINCT as.id) as total_seats,
                COUNT(DISTINCT p.id) as total_policies
            FROM enterprises e
            LEFT JOIN user_contexts uc ON e.id = uc.enterprise_id AND uc.is_active = true
            LEFT JOIN agency_seats as ON e.id = as.enterprise_id AND as.is_active = true
            LEFT JOIN policies p ON e.id = p.enterprise_id AND p.is_active = true
            WHERE e.id = $1
            GROUP BY e.id, e.name, e.type, e.subscription_tier
        `, [enterpriseId]);

        return result.rows[0] || null;
    }

    /**
     * Get partner dashboard data
     */
    async getPartnerDashboard(partnerEnterpriseId) {
        const cacheKey = this.cache.enterpriseKey(partnerEnterpriseId, 'partner-dashboard');
        
        // Check cache
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Query materialized view
        const result = await db.query(`
            SELECT * FROM partner_dashboard_cache
            WHERE partner_enterprise_id = $1
        `, [partnerEnterpriseId]);

        if (result.rows.length === 0) {
            // Fallback to direct query
            return await this.getPartnerDashboardDirect(partnerEnterpriseId);
        }

        const dashboard = result.rows[0];
        
        // Cache the result
        await this.cache.set(cacheKey, dashboard, this.cacheTTL);
        
        return dashboard;
    }

    /**
     * Get partner dashboard data directly (fallback)
     */
    async getPartnerDashboardDirect(partnerEnterpriseId) {
        const result = await db.query(`
            SELECT 
                pe.id as partner_enterprise_id,
                pe.name as partner_enterprise_name,
                COUNT(DISTINCT per.client_enterprise_id) as total_clients,
                AVG(per.compliance_score) as avg_compliance_score
            FROM enterprises pe
            LEFT JOIN partner_enterprise_relationships per ON pe.id = per.partner_enterprise_id
            WHERE pe.id = $1
            GROUP BY pe.id, pe.name
        `, [partnerEnterpriseId]);

        return result.rows[0] || null;
    }

    /**
     * Get compliance metrics
     */
    async getComplianceMetrics(enterpriseId) {
        const cacheKey = this.cache.enterpriseKey(enterpriseId, 'compliance-metrics');
        
        // Check cache
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Query materialized view
        const result = await db.query(`
            SELECT * FROM compliance_metrics_cache
            WHERE enterprise_id = $1
        `, [enterpriseId]);

        const metrics = result.rows[0] || null;
        
        // Cache the result
        if (metrics) {
            await this.cache.set(cacheKey, metrics, this.cacheTTL);
        }
        
        return metrics;
    }

    /**
     * Invalidate dashboard cache for enterprise
     */
    async invalidateEnterpriseDashboard(enterpriseId) {
        await Promise.all([
            this.cache.del(this.cache.enterpriseKey(enterpriseId, 'dashboard')),
            this.cache.del(this.cache.enterpriseKey(enterpriseId, 'compliance-metrics'))
        ]);
    }

    /**
     * Invalidate dashboard cache for partner
     */
    async invalidatePartnerDashboard(partnerEnterpriseId) {
        await this.cache.del(this.cache.enterpriseKey(partnerEnterpriseId, 'partner-dashboard'));
    }
}

export default new DashboardService();

