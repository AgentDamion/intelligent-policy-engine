import { monitoring } from './monitoring';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class DashboardCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    
    this.cache.set(key, entry);
    monitoring.debug(`Cache set: ${key}`, { ttl }, 'cache');
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      monitoring.debug(`Cache miss: ${key}`, {}, 'cache');
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      monitoring.debug(`Cache expired: ${key}`, {}, 'cache');
      return null;
    }

    monitoring.debug(`Cache hit: ${key}`, {}, 'cache');
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    monitoring.debug(`Cache invalidated: ${key}`, {}, 'cache');
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    monitoring.info(`Cache invalidated pattern: ${pattern}`, { 
      keysDeleted: keysToDelete.length 
    }, 'cache');
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    monitoring.info(`Cache cleared`, { entriesRemoved: size }, 'cache');
  }

  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    const expired = entries.filter(([_, entry]) => now > entry.expiry).length;
    
    return {
      totalEntries: this.cache.size,
      activeEntries: this.cache.size - expired,
      expiredEntries: expired
    };
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      monitoring.debug(`Cache cleanup`, { 
        expiredEntriesRemoved: expiredKeys.length 
      }, 'cache');
    }
  }
}

// Global cache instance
export const dashboardCache = new DashboardCache();

// Auto-cleanup every 10 minutes
setInterval(() => {
  dashboardCache.cleanup();
}, 10 * 60 * 1000);

export default dashboardCache;