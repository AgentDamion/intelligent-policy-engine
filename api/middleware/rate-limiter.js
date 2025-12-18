// Context-Aware Rate Limiter Middleware
// File: api/middleware/rate-limiter.js

const { getCacheService } = require('../services/cache-service');
const { getRateLimitConfig, getRateLimitKey, getUserRateLimitKey } = require('../config/rate-limits');
const db = require('../../database/connection');

class RateLimiter {
    constructor() {
        this.cache = getCacheService();
        this.enabled = process.env.RATE_LIMIT_ENABLED !== 'false';
    }

    /**
     * Get subscription tier for enterprise
     */
    async getSubscriptionTier(enterpriseId) {
        if (!enterpriseId) return 'standard';

        const cacheKey = `enterprise:${enterpriseId}:tier`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const result = await db.query(
                'SELECT subscription_tier FROM enterprises WHERE id = $1',
                [enterpriseId]
            );

            const tier = result.rows[0]?.subscription_tier || 'standard';
            await this.cache.set(cacheKey, tier, 3600); // Cache for 1 hour
            return tier;
        } catch (error) {
            console.error('Error getting subscription tier:', error);
            return 'standard';
        }
    }

    /**
     * Check rate limit for context
     */
    async checkRateLimit(context, userId = null) {
        if (!this.enabled) {
            return { allowed: true, remaining: Infinity };
        }

        const contextType = context.contextType || 'enterprise';
        const enterpriseId = context.enterpriseId || context.partnerEnterpriseId;

        // Get subscription tier
        const subscriptionTier = await this.getSubscriptionTier(enterpriseId);
        const limitConfig = getRateLimitConfig(contextType, subscriptionTier);

        // Check enterprise-level rate limit
        const enterpriseKey = getRateLimitKey(context);
        const enterpriseCount = await this.cache.incr(enterpriseKey);
        
        if (enterpriseCount === 1) {
            await this.cache.expire(enterpriseKey, limitConfig.window);
        }

        // Check user-level rate limit if userId provided
        let userCount = 0;
        if (userId) {
            const userKey = getUserRateLimitKey(userId);
            userCount = await this.cache.incr(userKey);
            
            if (userCount === 1) {
                await this.cache.expire(userKey, limitConfig.window);
            }
        }

        // Check if limit exceeded
        const exceeded = enterpriseCount > limitConfig.requests || 
                        (userId && userCount > limitConfig.requests);

        return {
            allowed: !exceeded,
            remaining: exceeded ? 0 : Math.max(0, limitConfig.requests - enterpriseCount),
            limit: limitConfig.requests,
            resetIn: limitConfig.window,
            enterpriseCount,
            userCount: userId ? userCount : undefined
        };
    }

    /**
     * Middleware factory for rate limiting
     */
    middleware(options = {}) {
        return async (req, res, next) => {
            if (!this.enabled) {
                return next();
            }

            try {
                const context = req.context || {};
                const userId = req.user?.id;

                const rateLimitResult = await this.checkRateLimit(context, userId);

                // Set rate limit headers
                res.set({
                    'X-RateLimit-Limit': rateLimitResult.limit,
                    'X-RateLimit-Remaining': rateLimitResult.remaining,
                    'X-RateLimit-Reset': new Date(Date.now() + rateLimitResult.resetIn * 1000).toISOString()
                });

                if (!rateLimitResult.allowed) {
                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        message: 'Too many requests. Please try again later.',
                        retryAfter: rateLimitResult.resetIn
                    });
                }

                next();
            } catch (error) {
                console.error('Rate limit check failed:', error);
                // On error, allow request (fail open)
                next();
            }
        };
    }

    /**
     * Rate limiter for specific endpoint groups
     */
    forEndpointGroup(groupName) {
        // Could have different limits for different endpoint groups
        // For now, use default middleware
        return this.middleware();
    }
}

// Singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;

