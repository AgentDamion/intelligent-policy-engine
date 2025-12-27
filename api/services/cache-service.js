// Cache Service Abstraction Layer
// File: api/services/cache-service.js
// Supports both in-memory (Map) and Redis providers

import MemoryProvider from './cache-providers/memory-provider.js';
import RedisProvider from './cache-providers/redis-provider.js';

export class CacheService {
    constructor(provider = null) {
        const providerType = provider || process.env.CACHE_PROVIDER || 'memory';
        
        if (providerType === 'redis') {
            try {
                this.provider = new RedisProvider();
                this.providerType = 'redis';
            } catch (error) {
                console.warn('Redis initialization failed, falling back to memory:', error.message);
                this.provider = new MemoryProvider();
                this.providerType = 'memory';
            }
        } else {
            this.provider = new MemoryProvider();
            this.providerType = 'memory';
        }

        // Cleanup expired entries for memory provider periodically
        if (this.providerType === 'memory') {
            setInterval(() => {
                this.provider.cleanup();
            }, 60000); // Every minute
        }
    }

    async get(key) {
        return await this.provider.get(key);
    }

    async set(key, value, ttlSeconds = 0) {
        return await this.provider.set(key, value, ttlSeconds);
    }

    async del(key) {
        return await this.provider.del(key);
    }

    async exists(key) {
        const result = await this.provider.exists(key);
        return result > 0;
    }

    async incr(key) {
        return await this.provider.incr(key);
    }

    async expire(key, seconds) {
        return await this.provider.expire(key, seconds);
    }

    async flush() {
        return await this.provider.flush();
    }

    // Helper method to generate cache keys
    static key(...parts) {
        return parts.filter(Boolean).join(':');
    }

    // Helper method for context-based cache keys
    static contextKey(contextId, ...parts) {
        return this.key('context', contextId, ...parts);
    }

    // Helper method for enterprise-based cache keys
    static enterpriseKey(enterpriseId, ...parts) {
        return this.key('enterprise', enterpriseId, ...parts);
    }

    // Helper method for user-based cache keys
    static userKey(userId, ...parts) {
        return this.key('user', userId, ...parts);
    }

    getProviderType() {
        return this.providerType;
    }

    async disconnect() {
        if (this.provider && typeof this.provider.disconnect === 'function') {
            await this.provider.disconnect();
        }
    }
}

// Singleton instance
let cacheServiceInstance = null;

export function getCacheService() {
    if (!cacheServiceInstance) {
        cacheServiceInstance = new CacheService();
    }
    return cacheServiceInstance;
}
