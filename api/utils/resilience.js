import { setTimeout as delay } from 'timers/promises';

/**
 * Simple circuit breaker with retry + timeout support.
 * Designed for wrapping external calls (Supabase, OpenAI).
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 60_000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold ?? 3;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('CircuitBreakerOpen');
      }
    }

    try {
      const result = await fn();
      this.successCount += 1;
      if (this.state === 'HALF_OPEN' && this.successCount >= this.halfOpenSuccessThreshold) {
        this._reset();
      }
      if (this.state === 'CLOSED') {
        this.failureCount = 0;
      }
      return result;
    } catch (err) {
      this.failureCount += 1;
      this.successCount = 0;
      if (this.failureCount >= this.failureThreshold) {
        this._trip();
      }
      throw err;
    }
  }

  _trip() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.resetTimeoutMs;
  }

  _reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
  }
}

/**
 * Retry wrapper with exponential backoff + jitter + timeout.
 */
export async function executeWithRetry(fn, options = {}) {
  const {
    retries = 3,
    baseDelayMs = 200,
    timeoutMs = 10_000,
    onRetry = () => {}
  } = options;

  let attempt = 0;
  while (true) {
    attempt += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await fn({ signal: controller.signal });
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      if (attempt > retries) throw err;
      const backoff = baseDelayMs * 2 ** (attempt - 1);
      const jitter = Math.random() * 50;
      await delay(backoff + jitter);
      onRetry(err, attempt);
    }
  }
}

/**
 * Wrap a function with circuit breaker + retry.
 */
export async function withResilience(fn, { breaker, retryOptions = {}, onRetry = () => {} } = {}) {
  const runner = async () => executeWithRetry(fn, { ...retryOptions, onRetry });
  return breaker ? breaker.execute(runner) : runner();
}

