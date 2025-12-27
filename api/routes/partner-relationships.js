// Partner-Enterprise Relationship Routes
// File: api/routes/partner-relationships.js

import express from 'express';
const router = express.Router();
import relationshipService from '../services/relationship-service.js';
import hierarchicalAuth from '../auth/hierarchical-auth.js';

// All routes require authentication
router.use(hierarchicalAuth.requireAuth());

/**
 * POST /api/partner-relationships
 * Create a new partner-enterprise relationship
 * Requires: enterprise_admin or enterprise_owner role
 */
router.post('/', 
    hierarchicalAuth.requireRole(['enterprise_owner', 'enterprise_admin']),
    async (req, res) => {
        try {
            const { partnerEnterpriseId, clientEnterpriseId, ...relationshipData } = req.body;

            if (!partnerEnterpriseId || !clientEnterpriseId) {
                return res.status(400).json({
                    error: 'partnerEnterpriseId and clientEnterpriseId are required'
                });
            }

            // Verify user's enterprise matches client enterprise
            if (req.context.enterpriseId !== clientEnterpriseId) {
                return res.status(403).json({
                    error: 'Can only create relationships for your own enterprise'
                });
            }

            const relationship = await relationshipService.createRelationship(
                partnerEnterpriseId,
                clientEnterpriseId,
                relationshipData,
                req.user.id
            );

            res.status(201).json({
                success: true,
                relationship
            });
        } catch (error) {
            console.error('Error creating relationship:', error);
            res.status(400).json({
                error: error.message
            });
        }
    }
);

/**
 * GET /api/partner-relationships
 * List relationships (filtered by context)
 */
router.get('/', async (req, res) => {
    try {
        const filters = {
            partnerEnterpriseId: req.query.partnerEnterpriseId,
            clientEnterpriseId: req.query.clientEnterpriseId || req.context.enterpriseId,
            relationshipStatus: req.query.status || 'active'
        };

        const relationships = await relationshipService.listRelationships(filters);

        res.json({
            success: true,
            relationships,
            count: relationships.length
        });
    } catch (error) {
        console.error('Error listing relationships:', error);
        res.status(500).json({
            error: 'Failed to list relationships'
        });
    }
});

/**
 * GET /api/partner-relationships/:id
 * Get relationship details
 */
router.get('/:id', async (req, res) => {
    try {
        const relationship = await relationshipService.getRelationship(req.params.id);

        if (!relationship) {
            return res.status(404).json({
                error: 'Relationship not found'
            });
        }

        // Verify user has access to this relationship
        const hasAccess = 
            relationship.partner_enterprise_id === req.context.enterpriseId ||
            relationship.client_enterprise_id === req.context.enterpriseId;

        if (!hasAccess && req.context.role !== 'platform_super_admin') {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        res.json({
            success: true,
            relationship
        });
    } catch (error) {
        console.error('Error getting relationship:', error);
        res.status(500).json({
            error: 'Failed to get relationship'
        });
    }
});

/**
 * PUT /api/partner-relationships/:id
 * Update relationship
 * Requires: enterprise_admin or enterprise_owner role
 */
router.put('/:id',
    hierarchicalAuth.requireRole(['enterprise_owner', 'enterprise_admin', 'partner_admin']),
    async (req, res) => {
        try {
            const relationship = await relationshipService.getRelationship(req.params.id);

            if (!relationship) {
                return res.status(404).json({
                    error: 'Relationship not found'
                });
            }

            // Verify user has access
            const hasAccess = 
                relationship.client_enterprise_id === req.context.enterpriseId ||
                relationship.partner_enterprise_id === req.context.enterpriseId;

            if (!hasAccess && req.context.role !== 'platform_super_admin') {
                return res.status(403).json({
                    error: 'Access denied'
                });
            }

            const updated = await relationshipService.updateRelationship(
                req.params.id,
                req.body,
                req.user.id
            );

            res.json({
                success: true,
                relationship: updated
            });
        } catch (error) {
            console.error('Error updating relationship:', error);
            res.status(400).json({
                error: error.message
            });
        }
    }
);

/**
 * GET /api/partner-relationships/partner/:partnerId/clients
 * Get all clients for a partner
 */
router.get('/partner/:partnerId/clients', async (req, res) => {
    try {
        // Verify user has access to this partner
        if (req.context.enterpriseId !== req.params.partnerId && 
            req.context.role !== 'platform_super_admin') {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const clients = await relationshipService.getPartnerClients(
            req.params.partnerId,
            req.query.status || 'active'
        );

        res.json({
            success: true,
            clients,
            count: clients.length
        });
    } catch (error) {
        console.error('Error getting partner clients:', error);
        res.status(500).json({
            error: 'Failed to get partner clients'
        });
    }
});

/**
 * GET /api/partner-relationships/enterprise/:enterpriseId/partners
 * Get all partners for an enterprise
 */
router.get('/enterprise/:enterpriseId/partners', async (req, res) => {
    try {
        // Verify user has access to this enterprise
        if (req.context.enterpriseId !== req.params.enterpriseId && 
            req.context.role !== 'platform_super_admin') {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const partners = await relationshipService.getEnterprisePartners(
            req.params.enterpriseId,
            req.query.status || 'active'
        );

        res.json({
            success: true,
            partners,
            count: partners.length
        });
    } catch (error) {
        console.error('Error getting enterprise partners:', error);
        res.status(500).json({
            error: 'Failed to get enterprise partners'
        });
    }
});

export default router;

