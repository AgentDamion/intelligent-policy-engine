/**
 * Minimal TTL cache for EPS / decisions.
 */
export class TtlCache {
  constructor(ttlMs = 300_000, maxEntries = 1000) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.store = new Map();
  }

  _prune() {
    if (this.store.size <= this.maxEntries) return;
    const keys = Array.from(this.store.keys());
    const excess = keys.slice(0, this.store.size - this.maxEntries);
    excess.forEach(k => this.store.delete(k));
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    this._prune();
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

