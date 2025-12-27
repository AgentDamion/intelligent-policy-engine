// Enhanced Route Protection Middleware
// File: api/middleware/route-protection.js

import hierarchicalAuth from '../auth/hierarchical-auth.js';
import { requireScreenAccess } from './screen-access.js';

/**
 * Enhanced route protection with screen-level checks
 */
function protectRoute(screenName = null) {
    const middlewares = [
        hierarchicalAuth.requireAuth()
    ];

    // Add screen access check if screen name provided
    if (screenName) {
        middlewares.push(requireScreenAccess(screenName));
    }

    return middlewares;
}

/**
 * Context-aware route filtering
 * Filters routes based on user's current context
 */
function filterRoutesByContext(routes, context) {
    const contextType = context.contextType || 'enterprise';
    const role = context.role;

    return routes.filter(route => {
        // Check if route is accessible by role
        if (route.requiredRoles && !route.requiredRoles.includes('*') && 
            !route.requiredRoles.includes(role)) {
            return false;
        }

        // Check if route is accessible by context type
        if (route.allowedContextTypes && !route.allowedContextTypes.includes('*') &&
            !route.allowedContextTypes.includes(contextType)) {
            return false;
        }

        return true;
    });
}

/**
 * Feature flag checking (placeholder for future implementation)
 */
function checkFeatureFlag(featureName, context) {
    // TODO: Implement actual feature flag service
    // For now, return true for all features
    return true;
}

/**
 * Combine multiple protection middlewares
 */
function combineProtection(...middlewares) {
    return (req, res, next) => {
        let index = 0;
        
        function runMiddleware() {
            if (index >= middlewares.length) {
                return next();
            }
            
            const middleware = middlewares[index++];
            middleware(req, res, (err) => {
                if (err) {
                    return next(err);
                }
                runMiddleware();
            });
        }
        
        runMiddleware();
    };
}

export { protectRoute, filterRoutesByContext, checkFeatureFlag, combineProtection };

