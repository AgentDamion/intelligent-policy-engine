// Screen Access Matrix Configuration
// File: api/config/screen-access-matrix.js
// Defines access rules for all 31 screens

const SCREEN_ACCESS_MATRIX = {
    // ===== ENTERPRISE SCREENS (16 screens) =====
    
    'enterprise-admin-panel': {
        roles: ['enterprise_owner', 'enterprise_admin', 'platform_super_admin'],
        contextTypes: ['enterprise'],
        route: '/enterprise/admin',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'brand-workspace': {
        roles: ['enterprise_admin', 'enterprise_owner', 'seat_admin', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/brand/:brandId',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'brand-policy-authoring': {
        roles: ['enterprise_admin', 'enterprise_owner', 'seat_admin', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/policies/author',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'policy-engine-config': {
        roles: ['enterprise_admin', 'enterprise_owner', 'platform_super_admin'],
        contextTypes: ['enterprise'],
        route: '/enterprise/policies/engine-config',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'workflow-builder': {
        roles: ['enterprise_admin', 'enterprise_owner', 'seat_admin', 'project_manager', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/workflows/builder',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'review-queue': {
        roles: ['enterprise_admin', 'enterprise_owner', 'seat_admin', 'compliance_manager', 'legal_counsel', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/review-queue',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'tool-intelligence-analyzer': {
        roles: ['enterprise_admin', 'enterprise_owner', 'seat_admin', 'compliance_manager', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/tools/analyzer',
        requiresFeature: 'metaloop-integration',
        requiresRelationship: false
    },
    
    'agent-override': {
        roles: ['enterprise_admin', 'enterprise_owner', 'compliance_manager', 'legal_counsel', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/agent/override',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'decision-workbench': {
        roles: ['enterprise_admin', 'enterprise_owner', 'seat_admin', 'compliance_manager', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/decisions/workbench',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'gap-scan': {
        roles: ['enterprise_admin', 'enterprise_owner', 'compliance_manager', 'platform_super_admin'],
        contextTypes: ['enterprise'],
        route: '/enterprise/compliance/gap-scan',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'regulatory-bindings': {
        roles: ['enterprise_admin', 'enterprise_owner', 'compliance_manager', 'legal_counsel', 'platform_super_admin'],
        contextTypes: ['enterprise'],
        route: '/enterprise/compliance/regulatory-bindings',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'compliance-dashboard': {
        roles: ['enterprise_admin', 'enterprise_owner', 'compliance_manager', 'seat_admin', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/compliance/dashboard',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'campaign-compliance-dashboard': {
        roles: ['enterprise_admin', 'enterprise_owner', 'marketing_manager', 'compliance_manager', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/compliance/campaigns',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'executive-dashboard': {
        roles: ['enterprise_owner', 'enterprise_admin', 'platform_super_admin'],
        contextTypes: ['enterprise'],
        route: '/enterprise/dashboard/executive',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'scorecards': {
        roles: ['enterprise_admin', 'enterprise_owner', 'compliance_manager', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/scorecards',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'analytics-dashboard': {
        roles: ['enterprise_admin', 'enterprise_owner', 'seat_admin', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat'],
        route: '/enterprise/analytics',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    // ===== PARTNER SCREENS (10 screens) =====
    
    'tool-submission-portal': {
        roles: ['partner_admin', 'partner_user', 'account_manager', 'project_manager', 'platform_super_admin'],
        contextTypes: ['partner', 'enterprise'],
        route: '/partner/tools/submit',
        requiresFeature: null,
        requiresRelationship: true
    },
    
    'tool-request-workflow': {
        roles: ['partner_admin', 'partner_user', 'account_manager', 'marketing_manager', 'platform_super_admin'],
        contextTypes: ['partner', 'enterprise'],
        route: '/partner/tools/request',
        requiresFeature: null,
        requiresRelationship: true
    },
    
    'content-submission-workflow': {
        roles: ['partner_admin', 'partner_user', 'creative_director', 'project_manager', 'platform_super_admin'],
        contextTypes: ['partner'],
        route: '/partner/content/submit',
        requiresFeature: null,
        requiresRelationship: true
    },
    
    'submission-form': {
        roles: ['partner_admin', 'partner_user', 'account_manager', 'project_manager', 'platform_super_admin'],
        contextTypes: ['partner'],
        route: '/partner/submissions/form',
        requiresFeature: null,
        requiresRelationship: true
    },
    
    'partner-dashboard': {
        roles: ['partner_admin', 'partner_user', 'account_manager', 'platform_super_admin'],
        contextTypes: ['partner'],
        route: '/partner/dashboard',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'multi-client-policy-sync': {
        roles: ['partner_admin', 'account_manager', 'platform_super_admin'],
        contextTypes: ['partner'],
        route: '/partner/policies/sync',
        requiresFeature: null,
        requiresRelationship: false,
        requiresMultipleClients: true
    },
    
    'multi-enterprise-dashboard': {
        roles: ['partner_admin', 'account_manager', 'platform_super_admin'],
        contextTypes: ['partner'],
        route: '/partner/clients/dashboard',
        requiresFeature: null,
        requiresRelationship: false,
        requiresMultipleClients: true
    },
    
    'client-communication-portal': {
        roles: ['partner_admin', 'account_manager', 'project_manager', 'platform_super_admin'],
        contextTypes: ['partner'],
        route: '/partner/clients/communication',
        requiresFeature: null,
        requiresRelationship: true
    },
    
    'creative-compliance-dashboard': {
        roles: ['partner_admin', 'creative_director', 'compliance_manager', 'platform_super_admin'],
        contextTypes: ['partner'],
        route: '/partner/compliance/creative',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'compliance-status-reports': {
        roles: ['partner_admin', 'account_manager', 'compliance_manager', 'platform_super_admin'],
        contextTypes: ['partner'],
        route: '/partner/compliance/reports',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'status-tracking': {
        roles: ['partner_admin', 'partner_user', 'account_manager', 'project_manager', 'platform_super_admin'],
        contextTypes: ['partner'],
        route: '/partner/submissions/status',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    // ===== SHARED/UNIVERSAL SCREENS (5 screens) =====
    
    'approved-tools-marketplace': {
        roles: ['*'], // All authenticated users
        contextTypes: ['*'], // All context types
        route: '/marketplace/tools',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'context-switcher': {
        roles: ['*'], // All authenticated users
        contextTypes: ['*'], // All context types
        route: '/context/switch',
        requiresFeature: null,
        requiresRelationship: false,
        requiresMultipleContexts: true
    },
    
    'support-dashboard': {
        roles: ['*'], // All authenticated users
        contextTypes: ['*'], // All context types
        route: '/support',
        requiresFeature: null,
        requiresRelationship: false
    },
    
    'audit-package-export': {
        roles: ['enterprise_admin', 'enterprise_owner', 'compliance_manager', 'partner_admin', 'platform_super_admin'],
        contextTypes: ['enterprise', 'agencySeat', 'partner'],
        route: '/audit/export',
        requiresFeature: null,
        requiresRelationship: false
    }
};

/**
 * Get screen configuration by name
 */
function getScreenConfig(screenName) {
    return SCREEN_ACCESS_MATRIX[screenName] || null;
}

/**
 * Check if role has access to screen
 */
function hasRoleAccess(screenConfig, userRole) {
    if (!screenConfig) return false;
    
    // Wildcard means all roles
    if (screenConfig.roles.includes('*')) {
        return true;
    }
    
    return screenConfig.roles.includes(userRole);
}

/**
 * Check if context type is allowed for screen
 */
function hasContextTypeAccess(screenConfig, contextType) {
    if (!screenConfig) return false;
    
    // Wildcard means all context types
    if (screenConfig.contextTypes.includes('*')) {
        return true;
    }
    
    return screenConfig.contextTypes.includes(contextType);
}

/**
 * Get all screens accessible by role
 */
function getScreensForRole(role) {
    return Object.entries(SCREEN_ACCESS_MATRIX)
        .filter(([_, config]) => hasRoleAccess(config, role))
        .map(([screenName, config]) => ({
            screenName,
            ...config
        }));
}

/**
 * Get all screens accessible by context type
 */
function getScreensForContextType(contextType) {
    return Object.entries(SCREEN_ACCESS_MATRIX)
        .filter(([_, config]) => hasContextTypeAccess(config, contextType))
        .map(([screenName, config]) => ({
            screenName,
            ...config
        }));
}

module.exports = {
    SCREEN_ACCESS_MATRIX,
    getScreenConfig,
    hasRoleAccess,
    hasContextTypeAccess,
    getScreensForRole,
    getScreensForContextType
};

