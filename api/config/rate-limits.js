// Rate Limit Configuration
// File: api/config/rate-limits.js

const RATE_LIMITS = {
    enterprise: {
        standard: {
            requests: parseInt(process.env.RATE_LIMIT_STANDARD) || 1000,
            window: 3600, // 1 hour in seconds
            burst: 100 // Allow burst of 100 requests
        },
        premium: {
            requests: parseInt(process.env.RATE_LIMIT_PREMIUM) || 5000,
            window: 3600,
            burst: 500
        },
        enterprise: {
            requests: parseInt(process.env.RATE_LIMIT_ENTERPRISE) || 10000,
            window: 3600,
            burst: 1000
        }
    },
    partner: {
        standard: {
            requests: 500,
            window: 3600,
            burst: 50
        },
        premium: {
            requests: 2000,
            window: 3600,
            burst: 200
        }
    },
    default: {
        requests: 100,
        window: 3600,
        burst: 10
    }
};

/**
 * Get rate limit configuration for a context
 */
function getRateLimitConfig(contextType, subscriptionTier = 'standard') {
    const tierConfig = RATE_LIMITS[contextType];
    if (!tierConfig) {
        return RATE_LIMITS.default;
    }

    return tierConfig[subscriptionTier] || tierConfig.standard || RATE_LIMITS.default;
}

/**
 * Get rate limit key for a context
 */
function getRateLimitKey(context) {
    const enterpriseId = context.enterpriseId || context.partnerEnterpriseId || 'unknown';
    const contextId = context.id || context.contextId || 'unknown';
    return `ratelimit:${enterpriseId}:${contextId}`;
}

/**
 * Get rate limit key for user
 */
function getUserRateLimitKey(userId) {
    return `ratelimit:user:${userId}`;
}

module.exports = {
    RATE_LIMITS,
    getRateLimitConfig,
    getRateLimitKey,
    getUserRateLimitKey
};

