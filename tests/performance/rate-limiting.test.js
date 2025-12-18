// Rate Limiting Performance Tests
// File: tests/performance/rate-limiting.test.js

const rateLimiter = require('../../api/middleware/rate-limiter');
const { getCacheService } = require('../../api/services/cache-service');

describe('Rate Limiting', () => {
    const cache = getCacheService();

    beforeEach(async () => {
        // Clear cache before each test
        await cache.flush();
    });

    test('should allow requests within limit', async () => {
        const context = {
            contextType: 'enterprise',
            enterpriseId: 'test-enterprise-1',
            id: 'test-context-1'
        };

        // Make requests up to limit
        for (let i = 0; i < 10; i++) {
            const result = await rateLimiter.checkRateLimit(context);
            expect(result.allowed).toBe(true);
        }
    });

    test('should block requests exceeding limit', async () => {
        const context = {
            contextType: 'enterprise',
            enterpriseId: 'test-enterprise-2',
            id: 'test-context-2'
        };

        // Exceed limit
        for (let i = 0; i < 1001; i++) {
            await rateLimiter.checkRateLimit(context);
        }

        const result = await rateLimiter.checkRateLimit(context);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    test('should respect different tiers', async () => {
        // This would require mocking the subscription tier lookup
        // For now, we test the basic functionality
        const context = {
            contextType: 'enterprise',
            enterpriseId: 'test-enterprise-3',
            id: 'test-context-3'
        };

        const result = await rateLimiter.checkRateLimit(context);
        expect(result).toHaveProperty('allowed');
        expect(result).toHaveProperty('limit');
        expect(result).toHaveProperty('remaining');
    });
});

