// Context Switching Integration Tests
// File: tests/integration/context-switching.test.js

const hierarchicalAuth = require('../../api/auth/hierarchical-auth');
const dualModeService = require('../../api/services/dual-mode-context-service');
const db = require('../../database/connection');

describe('Context Switching', () => {
    let userId;
    let enterpriseId;
    let contextId;

    beforeAll(async () => {
        // Create test user and enterprise
        const userResult = await db.query(`
            INSERT INTO users (email, name, is_active)
            VALUES ('test@example.com', 'Test User', true)
            RETURNING id
        `);
        userId = userResult.rows[0].id;

        const enterpriseResult = await db.query(`
            INSERT INTO enterprises (name, slug, type, subscription_tier)
            VALUES ('Test Enterprise', 'test-enterprise', 'pharma', 'standard')
            RETURNING id
        `);
        enterpriseId = enterpriseResult.rows[0].id;

        const contextResult = await db.query(`
            INSERT INTO user_contexts (user_id, enterprise_id, role, is_default, is_active)
            VALUES ($1, $2, 'enterprise_admin', true, true)
            RETURNING id
        `, [userId, enterpriseId]);
        contextId = contextResult.rows[0].id;
    });

    afterAll(async () => {
        // Cleanup
        if (contextId) {
            await db.query('DELETE FROM user_contexts WHERE id = $1', [contextId]);
        }
        if (userId) {
            await db.query('DELETE FROM users WHERE id = $1', [userId]);
        }
        if (enterpriseId) {
            await db.query('DELETE FROM enterprises WHERE id = $1', [enterpriseId]);
        }
    });

    test('should get available contexts grouped', async () => {
        const contexts = await dualModeService.getAvailableContexts(userId);
        
        expect(contexts).toBeDefined();
        expect(contexts.enterprise).toBeDefined();
        expect(contexts.partner).toBeDefined();
        expect(contexts.all).toBeDefined();
        expect(contexts.hasMultipleContexts).toBeDefined();
    });

    test('should switch context', async () => {
        const switchResult = await hierarchicalAuth.switchUserContext(userId, contextId);
        
        expect(switchResult).toBeDefined();
        expect(switchResult.context).toBeDefined();
        expect(switchResult.token).toBeDefined();
        expect(switchResult.context.contextId).toBe(contextId);
    });

    test('should validate context access', async () => {
        const context = await dualModeService.validateContextAccess(userId, contextId);
        
        expect(context).toBeDefined();
    });
});

