/**
 * Advanced Cache Service - Redis-based caching with TTL and invalidation
 * 
 * Features:
 * 1. Redis-based distributed caching
 * 2. TTL management with automatic expiration
 * 3. Cache invalidation patterns
 * 4. Memory fallback when Redis unavailable
 * 5. Cache warming and preloading
 * 6. Performance metrics and monitoring
 */

class AdvancedCacheService {
    constructor(options = {}) {
        this.redis = null;
        this.memoryCache = new Map();
        this.config = {
            redis: {
                host: options.redisHost || process.env.REDIS_HOST || 'localhost',
                port: options.redisPort || process.env.REDIS_PORT || 6379,
                password: options.redisPassword || process.env.REDIS_PASSWORD,
                db: options.redisDb || process.env.REDIS_DB || 0,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3
            },
            memory: {
                maxSize: options.maxMemorySize || 1000,
                defaultTTL: options.defaultTTL || 300000, // 5 minutes
                cleanupInterval: options.cleanupInterval || 60000 // 1 minute
            },
            performance: {
                enableMetrics: options.enableMetrics !== false,
                slowQueryThreshold: options.slowQueryThreshold || 100 // ms
            }
        };
        
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            totalOperations: 0,
            averageResponseTime: 0,
            slowQueries: 0
        };
        
        this.initialized = false;
        this.init();
    }

    /**
     * Initialize Redis connection and fallback to memory cache
     */
    async init() {
        try {
            // Try to import Redis (it might not be installed)
            const Redis = require('redis');
            
            this.redis = Redis.createClient({
                host: this.config.redis.host,
                port: this.config.redis.port,
                password: this.config.redis.password,
                db: this.config.redis.db,
                retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
                maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest
            });
            
            this.redis.on('error', (error) => {
                console.warn('⚠️ Redis connection error, falling back to memory cache:', error.message);
                this.redis = null;
            });
            
            this.redis.on('connect', () => {
                console.log('✅ Redis cache connected');
                this.initialized = true;
            });
            
            await this.redis.connect();
            
        } catch (error) {
            console.warn('⚠️ Redis not available, using memory cache only:', error.message);
            this.redis = null;
            this.initialized = true;
        }
        
        // Start memory cache cleanup
        this.startMemoryCleanup();
    }

    /**
     * Get value from cache (Redis or memory)
     */
    async get(key, options = {}) {
        const startTime = Date.now();
        this.metrics.totalOperations++;
        
        try {
            let value = null;
            
            if (this.redis && this.redis.isOpen) {
                // Try Redis first
                const redisValue = await this.redis.get(key);
                if (redisValue) {
                    value = JSON.parse(redisValue);
                }
            } else {
                // Fallback to memory cache
                const memoryValue = this.memoryCache.get(key);
                if (memoryValue && Date.now() < memoryValue.expires) {
                    value = memoryValue.data;
                } else if (memoryValue) {
                    // Expired, remove from memory
                    this.memoryCache.delete(key);
                }
            }
            
            const responseTime = Date.now() - startTime;
            this.updateMetrics(value ? 'hit' : 'miss', responseTime);
            
            return value;
            
        } catch (error) {
            this.updateMetrics('error', Date.now() - startTime);
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set value in cache (Redis and memory)
     */
    async set(key, value, ttl = null, options = {}) {
        const startTime = Date.now();
        this.metrics.totalOperations++;
        
        try {
            const actualTTL = ttl || this.config.memory.defaultTTL;
            const expires = Date.now() + actualTTL;
            
            // Set in Redis if available
            if (this.redis && this.redis.isOpen) {
                await this.redis.setEx(key, Math.ceil(actualTTL / 1000), JSON.stringify(value));
            }
            
            // Set in memory cache as backup
            if (this.memoryCache.size >= this.config.memory.maxSize) {
                // Remove oldest entry
                const oldestKey = this.memoryCache.keys().next().value;
                this.memoryCache.delete(oldestKey);
            }
            
            this.memoryCache.set(key, {
                data: value,
                expires: expires,
                created: Date.now()
            });
            
            const responseTime = Date.now() - startTime;
            this.updateMetrics('set', responseTime);
            
            return true;
            
        } catch (error) {
            this.updateMetrics('error', Date.now() - startTime);
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    async delete(key, options = {}) {
        const startTime = Date.now();
        this.metrics.totalOperations++;
        
        try {
            let deleted = false;
            
            // Delete from Redis
            if (this.redis && this.redis.isOpen) {
                const result = await this.redis.del(key);
                deleted = result > 0;
            }
            
            // Delete from memory cache
            if (this.memoryCache.has(key)) {
                this.memoryCache.delete(key);
                deleted = true;
            }
            
            const responseTime = Date.now() - startTime;
            this.updateMetrics('delete', responseTime);
            
            return deleted;
            
        } catch (error) {
            this.updateMetrics('error', Date.now() - startTime);
            console.error('Cache delete error:', error);
            return false;
        }
    }

    /**
     * Check if key exists in cache
     */
    async exists(key) {
        try {
            if (this.redis && this.redis.isOpen) {
                const result = await this.redis.exists(key);
                return result === 1;
            } else {
                const memoryValue = this.memoryCache.get(key);
                return memoryValue && Date.now() < memoryValue.expires;
            }
        } catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    }

    /**
     * Get multiple keys at once
     */
    async mget(keys) {
        const startTime = Date.now();
        this.metrics.totalOperations++;
        
        try {
            if (this.redis && this.redis.isOpen) {
                const values = await this.redis.mGet(keys);
                return values.map((value, index) => ({
                    key: keys[index],
                    value: value ? JSON.parse(value) : null,
                    found: value !== null
                }));
            } else {
                // Fallback to memory cache
                return keys.map(key => {
                    const memoryValue = this.memoryCache.get(key);
                    const found = memoryValue && Date.now() < memoryValue.expires;
                    return {
                        key,
                        value: found ? memoryValue.data : null,
                        found
                    };
                });
            }
        } catch (error) {
            this.updateMetrics('error', Date.now() - startTime);
            console.error('Cache mget error:', error);
            return keys.map(key => ({ key, value: null, found: false }));
        }
    }

    /**
     * Set multiple keys at once
     */
    async mset(keyValuePairs, ttl = null) {
        const startTime = Date.now();
        this.metrics.totalOperations++;
        
        try {
            const actualTTL = ttl || this.config.memory.defaultTTL;
            
            if (this.redis && this.redis.isOpen) {
                // Use pipeline for better performance
                const pipeline = this.redis.multi();
                keyValuePairs.forEach(({ key, value }) => {
                    pipeline.setEx(key, Math.ceil(actualTTL / 1000), JSON.stringify(value));
                });
                await pipeline.exec();
            }
            
            // Set in memory cache
            const expires = Date.now() + actualTTL;
            keyValuePairs.forEach(({ key, value }) => {
                if (this.memoryCache.size >= this.config.memory.maxSize) {
                    const oldestKey = this.memoryCache.keys().next().value;
                    this.memoryCache.delete(oldestKey);
                }
                
                this.memoryCache.set(key, {
                    data: value,
                    expires: expires,
                    created: Date.now()
                });
            });
            
            const responseTime = Date.now() - startTime;
            this.updateMetrics('set', responseTime);
            
            return true;
            
        } catch (error) {
            this.updateMetrics('error', Date.now() - startTime);
            console.error('Cache mset error:', error);
            return false;
        }
    }

    /**
     * Invalidate cache by pattern
     */
    async invalidatePattern(pattern) {
        try {
            if (this.redis && this.redis.isOpen) {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.redis.del(keys);
                }
                return keys.length;
            } else {
                // Fallback to memory cache pattern matching
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                let deletedCount = 0;
                
                for (const key of this.memoryCache.keys()) {
                    if (regex.test(key)) {
                        this.memoryCache.delete(key);
                        deletedCount++;
                    }
                }
                
                return deletedCount;
            }
        } catch (error) {
            console.error('Cache invalidate pattern error:', error);
            return 0;
        }
    }

    /**
     * Warm cache with preloaded data
     */
    async warmCache(warmingData) {
        console.log('🔥 Warming cache with preloaded data...');
        
        const startTime = Date.now();
        let warmedCount = 0;
        
        for (const { key, value, ttl } of warmingData) {
            try {
                await this.set(key, value, ttl);
                warmedCount++;
            } catch (error) {
                console.error(`Failed to warm cache for key ${key}:`, error);
            }
        }
        
        const duration = Date.now() - startTime;
        console.log(`✅ Cache warmed: ${warmedCount} items in ${duration}ms`);
        
        return { warmedCount, duration };
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.metrics.totalOperations > 0 
            ? (this.metrics.hits / this.metrics.totalOperations * 100).toFixed(2)
            : 0;
        
        return {
            ...this.metrics,
            hitRate: `${hitRate}%`,
            memoryCacheSize: this.memoryCache.size,
            redisConnected: this.redis && this.redis.isOpen,
            initialized: this.initialized
        };
    }

    /**
     * Clear all cache data
     */
    async clear() {
        try {
            if (this.redis && this.redis.isOpen) {
                await this.redis.flushDb();
            }
            
            this.memoryCache.clear();
            console.log('✅ Cache cleared');
            
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }

    /**
     * Start memory cache cleanup interval
     */
    startMemoryCleanup() {
        setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;
            
            for (const [key, value] of this.memoryCache.entries()) {
                if (now >= value.expires) {
                    this.memoryCache.delete(key);
                    cleanedCount++;
                }
            }
            
            if (cleanedCount > 0) {
                console.log(`🧹 Memory cache cleanup: removed ${cleanedCount} expired entries`);
            }
        }, this.config.memory.cleanupInterval);
    }

    /**
     * Update performance metrics
     */
    updateMetrics(operation, responseTime) {
        this.metrics[operation + 's']++;
        
        // Update average response time
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime * (this.metrics.totalOperations - 1) + responseTime) / this.metrics.totalOperations;
        
        // Track slow queries
        if (responseTime > this.config.performance.slowQueryThreshold) {
            this.metrics.slowQueries++;
        }
    }

    /**
     * Generate cache key with namespace
     */
    generateKey(namespace, ...parts) {
        return `${namespace}:${parts.join(':')}`;
    }

    /**
     * Close Redis connection
     */
    async close() {
        if (this.redis && this.redis.isOpen) {
            await this.redis.quit();
            console.log('✅ Redis connection closed');
        }
    }
}

module.exports = AdvancedCacheService;