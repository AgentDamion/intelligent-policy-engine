// Screen Routes - All 31 Screens
// File: api/routes/screen-routes.js

import express from 'express';
const router = express.Router();
import { requireScreenAccess } from '../middleware/screen-access.js';
import hierarchicalAuth from '../auth/hierarchical-auth.js';
import { SCREEN_ACCESS_MATRIX } from '../config/screen-access-matrix.js';

// All routes require authentication
router.use(hierarchicalAuth.requireAuth());

// ===== ENTERPRISE SCREENS (16 routes) =====

router.get('/enterprise/admin', 
    requireScreenAccess('enterprise-admin-panel'),
    (req, res) => {
        res.json({ screen: 'enterprise-admin-panel', data: {} });
    }
);

router.get('/enterprise/brand/:brandId', 
    requireScreenAccess('brand-workspace'),
    (req, res) => {
        res.json({ screen: 'brand-workspace', brandId: req.params.brandId });
    }
);

router.get('/enterprise/policies/author', 
    requireScreenAccess('brand-policy-authoring'),
    (req, res) => {
        res.json({ screen: 'brand-policy-authoring' });
    }
);

router.get('/enterprise/policies/engine-config', 
    requireScreenAccess('policy-engine-config'),
    (req, res) => {
        res.json({ screen: 'policy-engine-config' });
    }
);

router.get('/enterprise/workflows/builder', 
    requireScreenAccess('workflow-builder'),
    (req, res) => {
        res.json({ screen: 'workflow-builder' });
    }
);

router.get('/enterprise/review-queue', 
    requireScreenAccess('review-queue'),
    (req, res) => {
        res.json({ screen: 'review-queue' });
    }
);

router.get('/enterprise/tools/analyzer', 
    requireScreenAccess('tool-intelligence-analyzer'),
    (req, res) => {
        res.json({ screen: 'tool-intelligence-analyzer' });
    }
);

router.get('/enterprise/agent/override', 
    requireScreenAccess('agent-override'),
    (req, res) => {
        res.json({ screen: 'agent-override' });
    }
);

router.get('/enterprise/decisions/workbench', 
    requireScreenAccess('decision-workbench'),
    (req, res) => {
        res.json({ screen: 'decision-workbench' });
    }
);

router.get('/enterprise/compliance/gap-scan', 
    requireScreenAccess('gap-scan'),
    (req, res) => {
        res.json({ screen: 'gap-scan' });
    }
);

router.get('/enterprise/compliance/regulatory-bindings', 
    requireScreenAccess('regulatory-bindings'),
    (req, res) => {
        res.json({ screen: 'regulatory-bindings' });
    }
);

router.get('/enterprise/compliance/dashboard', 
    requireScreenAccess('compliance-dashboard'),
    (req, res) => {
        res.json({ screen: 'compliance-dashboard' });
    }
);

router.get('/enterprise/compliance/campaigns', 
    requireScreenAccess('campaign-compliance-dashboard'),
    (req, res) => {
        res.json({ screen: 'campaign-compliance-dashboard' });
    }
);

router.get('/enterprise/dashboard/executive', 
    requireScreenAccess('executive-dashboard'),
    (req, res) => {
        res.json({ screen: 'executive-dashboard' });
    }
);

router.get('/enterprise/scorecards', 
    requireScreenAccess('scorecards'),
    (req, res) => {
        res.json({ screen: 'scorecards' });
    }
);

router.get('/enterprise/analytics', 
    requireScreenAccess('analytics-dashboard'),
    (req, res) => {
        res.json({ screen: 'analytics-dashboard' });
    }
);

// ===== PARTNER SCREENS (10 routes) =====

router.get('/partner/tools/submit', 
    requireScreenAccess('tool-submission-portal'),
    (req, res) => {
        res.json({ screen: 'tool-submission-portal' });
    }
);

router.get('/partner/tools/request', 
    requireScreenAccess('tool-request-workflow'),
    (req, res) => {
        res.json({ screen: 'tool-request-workflow' });
    }
);

router.get('/partner/content/submit', 
    requireScreenAccess('content-submission-workflow'),
    (req, res) => {
        res.json({ screen: 'content-submission-workflow' });
    }
);

router.get('/partner/submissions/form', 
    requireScreenAccess('submission-form'),
    (req, res) => {
        res.json({ screen: 'submission-form' });
    }
);

router.get('/partner/dashboard', 
    requireScreenAccess('partner-dashboard'),
    (req, res) => {
        res.json({ screen: 'partner-dashboard' });
    }
);

router.get('/partner/policies/sync', 
    requireScreenAccess('multi-client-policy-sync'),
    (req, res) => {
        res.json({ screen: 'multi-client-policy-sync' });
    }
);

router.get('/partner/clients/dashboard', 
    requireScreenAccess('multi-enterprise-dashboard'),
    (req, res) => {
        res.json({ screen: 'multi-enterprise-dashboard' });
    }
);

router.get('/partner/clients/communication', 
    requireScreenAccess('client-communication-portal'),
    (req, res) => {
        res.json({ screen: 'client-communication-portal' });
    }
);

router.get('/partner/compliance/creative', 
    requireScreenAccess('creative-compliance-dashboard'),
    (req, res) => {
        res.json({ screen: 'creative-compliance-dashboard' });
    }
);

router.get('/partner/compliance/reports', 
    requireScreenAccess('compliance-status-reports'),
    (req, res) => {
        res.json({ screen: 'compliance-status-reports' });
    }
);

router.get('/partner/submissions/status', 
    requireScreenAccess('status-tracking'),
    (req, res) => {
        res.json({ screen: 'status-tracking' });
    }
);

// ===== SHARED/UNIVERSAL SCREENS (5 routes) =====

router.get('/marketplace/tools', 
    requireScreenAccess('approved-tools-marketplace'),
    (req, res) => {
        res.json({ screen: 'approved-tools-marketplace' });
    }
);

router.get('/context/switch', 
    requireScreenAccess('context-switcher'),
    (req, res) => {
        res.json({ screen: 'context-switcher' });
    }
);

router.get('/support', 
    requireScreenAccess('support-dashboard'),
    (req, res) => {
        res.json({ screen: 'support-dashboard' });
    }
);

router.get('/audit/export', 
    requireScreenAccess('audit-package-export'),
    (req, res) => {
        res.json({ screen: 'audit-package-export' });
    }
);

/**
 * GET /api/screens/available
 * Get all screens available to current user
 */
router.get('/available', async (req, res) => {
    try {
        const { getScreensForRole, getScreensForContextType } = await import('../config/screen-access-matrix.js');
        const contextType = req.context.contextType || 'enterprise';
        const role = req.context.role;

        const screensByRole = getScreensForRole(role);
        const screensByContext = getScreensForContextType(contextType);

        // Intersection of both
        const availableScreens = screensByRole.filter(screen => 
            screensByContext.some(sc => sc.screenName === screen.screenName)
        );

        res.json({
            success: true,
            screens: availableScreens,
            count: availableScreens.length
        });
    } catch (error) {
        console.error('Error getting available screens:', error);
        res.status(500).json({
            error: 'Failed to get available screens'
        });
    }
});

export default router;

