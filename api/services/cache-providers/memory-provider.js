// In-Memory Cache Provider
// File: api/services/cache-providers/memory-provider.js

export default class MemoryProvider {
    constructor() {
        this.cache = new Map();
        this.expiry = new Map();
    }

    async get(key) {
        const expiryTime = this.expiry.get(key);
        if (expiryTime && Date.now() > expiryTime) {
            this.cache.delete(key);
            this.expiry.delete(key);
            return null;
        }
        return this.cache.get(key) || null;
    }

    async set(key, value, ttlSeconds = 0) {
        this.cache.set(key, value);
        if (ttlSeconds > 0) {
            this.expiry.set(key, Date.now() + (ttlSeconds * 1000));
        } else {
            this.expiry.delete(key);
        }
        return true;
    }

    async del(key) {
        const deleted = this.cache.delete(key);
        this.expiry.delete(key);
        return deleted ? 1 : 0;
    }

    async exists(key) {
        const expiryTime = this.expiry.get(key);
        if (expiryTime && Date.now() > expiryTime) {
            this.cache.delete(key);
            this.expiry.delete(key);
            return false;
        }
        return this.cache.has(key) ? 1 : 0;
    }

    async incr(key) {
        const current = await this.get(key);
        const newValue = (current ? parseInt(current) : 0) + 1;
        await this.set(key, newValue);
        return newValue;
    }

    async expire(key, seconds) {
        if (this.cache.has(key)) {
            this.expiry.set(key, Date.now() + (seconds * 1000));
            return 1;
        }
        return 0;
    }

    async flush() {
        this.cache.clear();
        this.expiry.clear();
        return true;
    }

    // Clean up expired entries (call periodically)
    cleanup() {
        const now = Date.now();
        for (const [key, expiryTime] of this.expiry.entries()) {
            if (now > expiryTime) {
                this.cache.delete(key);
                this.expiry.delete(key);
            }
        }
    }
}
