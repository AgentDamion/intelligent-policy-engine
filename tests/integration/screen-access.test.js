// Screen Access Integration Tests
// File: tests/integration/screen-access.test.js

const { getScreenConfig, hasRoleAccess, hasContextTypeAccess } = require('../../api/config/screen-access-matrix');

describe('Screen Access Control', () => {
    test('should get screen configuration', () => {
        const config = getScreenConfig('enterprise-admin-panel');
        
        expect(config).toBeDefined();
        expect(config.roles).toContain('enterprise_admin');
        expect(config.contextTypes).toContain('enterprise');
    });

    test('should check role access', () => {
        const config = getScreenConfig('enterprise-admin-panel');
        
        expect(hasRoleAccess(config, 'enterprise_admin')).toBe(true);
        expect(hasRoleAccess(config, 'enterprise_owner')).toBe(true);
        expect(hasRoleAccess(config, 'partner_user')).toBe(false);
    });

    test('should check context type access', () => {
        const config = getScreenConfig('enterprise-admin-panel');
        
        expect(hasContextTypeAccess(config, 'enterprise')).toBe(true);
        expect(hasContextTypeAccess(config, 'partner')).toBe(false);
    });

    test('should allow wildcard roles', () => {
        const config = getScreenConfig('approved-tools-marketplace');
        
        expect(hasRoleAccess(config, 'enterprise_admin')).toBe(true);
        expect(hasRoleAccess(config, 'partner_user')).toBe(true);
        expect(hasRoleAccess(config, 'any_role')).toBe(true);
    });

    test('should require relationship for partner screens', () => {
        const config = getScreenConfig('tool-submission-portal');
        
        expect(config.requiresRelationship).toBe(true);
        expect(config.contextTypes).toContain('partner');
    });
});

