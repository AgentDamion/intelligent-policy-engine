// Partner Context Routes
// File: api/routes/partner-contexts.js

const express = require('express');
const router = express.Router();
const partnerContextService = require('../services/partner-context-service');
const hierarchicalAuth = require('../auth/hierarchical-auth');

// All routes require authentication
router.use(hierarchicalAuth.requireAuth());

/**
 * POST /api/partner-contexts
 * Create partner-client context for user
 * Requires: partner_admin or enterprise_admin role
 */
router.post('/',
    hierarchicalAuth.requireRole(['partner_admin', 'enterprise_admin', 'enterprise_owner']),
    async (req, res) => {
        try {
            const { userId, partnerEnterpriseId, clientEnterpriseId, role } = req.body;

            if (!userId || !partnerEnterpriseId || !clientEnterpriseId || !role) {
                return res.status(400).json({
                    error: 'userId, partnerEnterpriseId, clientEnterpriseId, and role are required'
                });
            }

            // Verify requester has permission
            const isPartnerAdmin = req.context.enterpriseId === partnerEnterpriseId && 
                                   ['partner_admin', 'enterprise_admin', 'enterprise_owner'].includes(req.context.role);
            
            if (!isPartnerAdmin && req.context.role !== 'platform_super_admin') {
                return res.status(403).json({
                    error: 'Insufficient permissions'
                });
            }

            const context = await partnerContextService.createPartnerClientContext(
                userId,
                partnerEnterpriseId,
                clientEnterpriseId,
                role,
                req.user.id
            );

            res.status(201).json({
                success: true,
                context
            });
        } catch (error) {
            console.error('Error creating partner context:', error);
            res.status(400).json({
                error: error.message
            });
        }
    }
);

/**
 * GET /api/partner-contexts
 * List user's partner contexts
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || req.user.id;
        const partnerEnterpriseId = req.query.partnerEnterpriseId || null;

        // Verify user can access this data
        if (userId !== req.user.id && 
            !['enterprise_admin', 'enterprise_owner', 'partner_admin', 'platform_super_admin'].includes(req.context.role)) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const contexts = await partnerContextService.listUserPartnerContexts(userId, partnerEnterpriseId);

        res.json({
            success: true,
            contexts,
            count: contexts.length
        });
    } catch (error) {
        console.error('Error listing partner contexts:', error);
        res.status(500).json({
            error: 'Failed to list partner contexts'
        });
    }
});

/**
 * DELETE /api/partner-contexts/:id
 * Remove partner context
 */
router.delete('/:id', async (req, res) => {
    try {
        await partnerContextService.removePartnerClientContext(
            req.params.id,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Partner context removed'
        });
    } catch (error) {
        console.error('Error removing partner context:', error);
        res.status(400).json({
            error: error.message
        });
    }
});

module.exports = router;

