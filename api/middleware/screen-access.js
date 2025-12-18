// Screen Access Middleware
// File: api/middleware/screen-access.js

const { getScreenConfig, hasRoleAccess, hasContextTypeAccess } = require('../config/screen-access-matrix');
const relationshipService = require('../services/relationship-service');
const hierarchicalAuth = require('../auth/hierarchical-auth');

/**
 * Middleware factory to require screen access
 */
function requireScreenAccess(screenName) {
    return async (req, res, next) => {
        try {
            const screenConfig = getScreenConfig(screenName);
            
            if (!screenConfig) {
                return res.status(404).json({
                    error: `Screen '${screenName}' not found`
                });
            }

            // Check role access
            if (!hasRoleAccess(screenConfig, req.context.role)) {
                return res.status(403).json({
                    error: `Insufficient permissions for screen '${screenName}'`,
                    requiredRoles: screenConfig.roles,
                    currentRole: req.context.role
                });
            }

            // Check context type access
            const contextType = req.context.contextType || 'enterprise';
            if (!hasContextTypeAccess(screenConfig, contextType)) {
                return res.status(403).json({
                    error: `Invalid context type for screen '${screenName}'`,
                    requiredContextTypes: screenConfig.contextTypes,
                    currentContextType: contextType
                });
            }

            // Check feature requirements
            if (screenConfig.requiresFeature) {
                // TODO: Implement feature flag checking
                // For now, we'll allow access if feature requirement exists
                // In production, check against feature flags service
            }

            // Check relationship requirements (for Partner screens)
            if (screenConfig.requiresRelationship) {
                // For partner contexts, verify relationship exists
                if (contextType === 'partner') {
                    const partnerEnterpriseId = req.context.partnerEnterpriseId || req.context.enterpriseId;
                    const clientEnterpriseId = req.context.clientEnterpriseId || req.params.clientId;
                    
                    if (!clientEnterpriseId) {
                        return res.status(400).json({
                            error: 'Client enterprise ID required for this screen'
                        });
                    }

                    try {
                        await relationshipService.validatePartnerRelationship(
                            partnerEnterpriseId,
                            clientEnterpriseId
                        );
                    } catch (error) {
                        return res.status(403).json({
                            error: 'No active relationship with client enterprise',
                            details: error.message
                        });
                    }
                }
            }

            // Check multiple clients requirement
            if (screenConfig.requiresMultipleClients) {
                if (contextType === 'partner') {
                    const partnerEnterpriseId = req.context.partnerEnterpriseId || req.context.enterpriseId;
                    const clients = await relationshipService.getPartnerClients(partnerEnterpriseId, 'active');
                    
                    if (clients.length < 2) {
                        return res.status(403).json({
                            error: 'This screen requires multiple client relationships',
                            currentClients: clients.length
                        });
                    }
                }
            }

            // Check multiple contexts requirement
            if (screenConfig.requiresMultipleContexts) {
                const contexts = await hierarchicalAuth.getUserContextsGrouped(req.user.id);
                const totalContexts = contexts.all.length;
                
                if (totalContexts < 2) {
                    return res.status(403).json({
                        error: 'This screen requires multiple contexts',
                        currentContexts: totalContexts
                    });
                }
            }

            // All checks passed - attach screen config to request
            req.screenConfig = screenConfig;
            
            // Log access attempt
            await hierarchicalAuth.logAction(
                req.user.id,
                req.context.id || req.context.contextId,
                'screen_access',
                'screen',
                screenName,
                {
                    screenName,
                    contextType,
                    role: req.context.role
                }
            );

            next();
        } catch (error) {
            console.error('Screen access check failed:', error);
            res.status(500).json({
                error: 'Failed to verify screen access',
                details: error.message
            });
        }
    };
}

/**
 * Middleware to check if user can access any screen
 */
async function checkScreenAccess(userId, contextId, screenName) {
    try {
        // This would typically be called from a service, not middleware
        // For now, we'll use a simplified check
        const screenConfig = getScreenConfig(screenName);
        if (!screenConfig) {
            return { allowed: false, reason: 'Screen not found' };
        }

        // Get user context (simplified - in production, get from token or session)
        // This is a placeholder - actual implementation would verify full context
        
        return { allowed: true };
    } catch (error) {
        return { allowed: false, reason: error.message };
    }
}

module.exports = {
    requireScreenAccess,
    checkScreenAccess
};

