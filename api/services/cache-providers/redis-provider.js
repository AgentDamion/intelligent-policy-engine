// Redis Cache Provider
// File: api/services/cache-providers/redis-provider.js

let Redis;
let redisClient = null;

export default class RedisProvider {
    constructor() {
        this.client = null;
        this.connected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
    }

    async connect() {
        if (this.connected && this.client) {
            return this.client;
        }

        try {
            // Lazy load ioredis to avoid requiring it if not using Redis
            if (!Redis) {
                const mod = await import('ioredis');
                Redis = mod.default || mod;
            }

            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.client = new Redis(redisUrl, {
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: false
            });

            this.client.on('error', (err) => {
                console.error('Redis connection error:', err);
                this.connected = false;
            });

            this.client.on('connect', () => {
                console.log('Redis connected');
                this.connected = true;
            });

            this.client.on('ready', () => {
                console.log('Redis ready');
                this.connected = true;
            });

            await this.client.connect();
            this.connected = true;
            return this.client;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.connected = false;
            throw error;
        }
    }

    async get(key) {
        try {
            if (!this.connected) {
                await this.connect();
            }
            const value = await this.client.get(key);
            if (value === null) return null;
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    async set(key, value, ttlSeconds = 0) {
        try {
            if (!this.connected) {
                await this.connect();
            }
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            if (ttlSeconds > 0) {
                await this.client.setex(key, ttlSeconds, serialized);
            } else {
                await this.client.set(key, serialized);
            }
            return true;
        } catch (error) {
            console.error('Redis set error:', error);
            return false;
        }
    }

    async del(key) {
        try {
            if (!this.connected) {
                await this.connect();
            }
            return await this.client.del(key);
        } catch (error) {
            console.error('Redis del error:', error);
            return 0;
        }
    }

    async exists(key) {
        try {
            if (!this.connected) {
                await this.connect();
            }
            return await this.client.exists(key);
        } catch (error) {
            console.error('Redis exists error:', error);
            return 0;
        }
    }

    async incr(key) {
        try {
            if (!this.connected) {
                await this.connect();
            }
            return await this.client.incr(key);
        } catch (error) {
            console.error('Redis incr error:', error);
            return 0;
        }
    }

    async expire(key, seconds) {
        try {
            if (!this.connected) {
                await this.connect();
            }
            return await this.client.expire(key, seconds);
        } catch (error) {
            console.error('Redis expire error:', error);
            return 0;
        }
    }

    async flush() {
        try {
            if (!this.connected) {
                await this.connect();
            }
            return await this.client.flushdb();
        } catch (error) {
            console.error('Redis flush error:', error);
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.connected = false;
        }
    }
}
