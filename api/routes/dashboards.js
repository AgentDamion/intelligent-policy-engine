// Dashboard Routes with Caching
// File: api/routes/dashboards.js

import express from 'express';
const router = express.Router();
import dashboardService from '../services/dashboard-service.js';
import hierarchicalAuth from '../auth/hierarchical-auth.js';

// All routes require authentication
router.use(hierarchicalAuth.requireAuth());

/**
 * GET /api/dashboards/enterprise/:enterpriseId
 * Get enterprise dashboard data
 */
router.get('/enterprise/:enterpriseId', async (req, res) => {
    try {
        const { enterpriseId } = req.params;

        // Verify user has access
        if (req.context.enterpriseId !== enterpriseId && 
            req.context.role !== 'platform_super_admin') {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const dashboard = await dashboardService.getEnterpriseDashboard(enterpriseId);

        res.json({
            success: true,
            dashboard
        });
    } catch (error) {
        console.error('Error getting enterprise dashboard:', error);
        res.status(500).json({
            error: 'Failed to get enterprise dashboard'
        });
    }
});

/**
 * GET /api/dashboards/partner/:partnerEnterpriseId
 * Get partner dashboard data
 */
router.get('/partner/:partnerEnterpriseId', async (req, res) => {
    try {
        const { partnerEnterpriseId } = req.params;

        // Verify user has access
        if (req.context.enterpriseId !== partnerEnterpriseId && 
            req.context.partnerEnterpriseId !== partnerEnterpriseId &&
            req.context.role !== 'platform_super_admin') {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const dashboard = await dashboardService.getPartnerDashboard(partnerEnterpriseId);

        res.json({
            success: true,
            dashboard
        });
    } catch (error) {
        console.error('Error getting partner dashboard:', error);
        res.status(500).json({
            error: 'Failed to get partner dashboard'
        });
    }
});

/**
 * GET /api/dashboards/compliance/:enterpriseId
 * Get compliance metrics
 */
router.get('/compliance/:enterpriseId', async (req, res) => {
    try {
        const { enterpriseId } = req.params;

        // Verify user has access
        if (req.context.enterpriseId !== enterpriseId && 
            req.context.role !== 'platform_super_admin') {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const metrics = await dashboardService.getComplianceMetrics(enterpriseId);

        res.json({
            success: true,
            metrics
        });
    } catch (error) {
        console.error('Error getting compliance metrics:', error);
        res.status(500).json({
            error: 'Failed to get compliance metrics'
        });
    }
});

export default router;

