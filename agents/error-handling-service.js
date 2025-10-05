/**
 * Error Handling Service - Circuit breakers, retry logic, and resilience patterns
 * 
 * Features:
 * 1. Circuit breaker pattern implementation
 * 2. Exponential backoff retry logic
 * 3. Bulkhead pattern for resource isolation
 * 4. Timeout and rate limiting
 * 5. Error classification and handling strategies
 * 6. Health monitoring and recovery
 */

class ErrorHandlingService {
    constructor(options = {}) {
        this.config = {
            circuitBreaker: {
                failureThreshold: options.failureThreshold || 5,
                recoveryTimeout: options.recoveryTimeout || 30000, // 30 seconds
                halfOpenMaxCalls: options.halfOpenMaxCalls || 3,
                resetTimeout: options.resetTimeout || 60000 // 1 minute
            },
            retry: {
                maxAttempts: options.maxRetries || 3,
                baseDelay: options.baseDelay || 1000, // 1 second
                maxDelay: options.maxDelay || 10000, // 10 seconds
                backoffMultiplier: options.backoffMultiplier || 2,
                jitter: options.jitter !== false // Add randomness to prevent thundering herd
            },
            timeout: {
                default: options.defaultTimeout || 10000, // 10 seconds
                perOperation: options.operationTimeouts || {}
            },
            rateLimit: {
                windowMs: options.rateLimitWindow || 60000, // 1 minute
                maxRequests: options.maxRequests || 100,
                perService: options.serviceRateLimits || {}
            }
        };
        
        this.circuitBreakers = new Map();
        this.retryCounters = new Map();
        this.rateLimiters = new Map();
        this.bulkheads = new Map();
        
        this.metrics = {
            circuitBreakerTrips: 0,
            retryAttempts: 0,
            timeouts: 0,
            rateLimitHits: 0,
            totalErrors: 0,
            recoveredErrors: 0
        };
        
        this.errorTypes = {
            TIMEOUT: 'timeout',
            NETWORK: 'network',
            RATE_LIMIT: 'rate_limit',
            CIRCUIT_BREAKER: 'circuit_breaker',
            VALIDATION: 'validation',
            AUTHENTICATION: 'authentication',
            AUTHORIZATION: 'authorization',
            NOT_FOUND: 'not_found',
            SERVER_ERROR: 'server_error',
            UNKNOWN: 'unknown'
        };
    }

    /**
     * Execute function with comprehensive error handling
     */
    async executeWithErrorHandling(operation, context = {}) {
        const {
            serviceName = 'unknown',
            operationName = 'operation',
            timeout = this.config.timeout.default,
            retryable = true,
            circuitBreaker = true,
            rateLimit = true
        } = context;
        
        // Check rate limiting
        if (rateLimit && !this.checkRateLimit(serviceName)) {
            throw this.createError(this.errorTypes.RATE_LIMIT, 'Rate limit exceeded', { serviceName });
        }
        
        // Check circuit breaker
        if (circuitBreaker && !this.checkCircuitBreaker(serviceName)) {
            throw this.createError(this.errorTypes.CIRCUIT_BREAKER, 'Circuit breaker open', { serviceName });
        }
        
        // Execute with timeout and retry logic
        return await this.executeWithRetry(
            () => this.executeWithTimeout(operation, timeout),
            {
                serviceName,
                operationName,
                retryable,
                circuitBreaker
            }
        );
    }

    /**
     * Execute function with timeout
     */
    async executeWithTimeout(operation, timeoutMs) {
        return Promise.race([
            operation(),
            new Promise((_, reject) => {
                setTimeout(() => {
                    this.metrics.timeouts++;
                    reject(this.createError(this.errorTypes.TIMEOUT, `Operation timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            })
        ]);
    }

    /**
     * Execute function with retry logic
     */
    async executeWithRetry(operation, context) {
        const { serviceName, operationName, retryable, circuitBreaker } = context;
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.retry.maxAttempts; attempt++) {
            try {
                const result = await operation();
                
                // Success - reset circuit breaker and retry counter
                if (circuitBreaker) {
                    this.resetCircuitBreaker(serviceName);
                }
                this.resetRetryCounter(serviceName);
                
                return result;
                
            } catch (error) {
                lastError = error;
                this.metrics.totalErrors++;
                
                // Classify error
                const errorType = this.classifyError(error);
                
                // Update circuit breaker on failure
                if (circuitBreaker) {
                    this.recordCircuitBreakerFailure(serviceName, errorType);
                }
                
                // Check if error is retryable
                if (!retryable || !this.isRetryableError(errorType)) {
                    throw error;
                }
                
                // Check if we should retry
                if (attempt >= this.config.retry.maxAttempts) {
                    break;
                }
                
                // Calculate delay with exponential backoff
                const delay = this.calculateRetryDelay(attempt, serviceName);
                this.metrics.retryAttempts++;
                
                console.log(`🔄 Retrying ${operationName} (attempt ${attempt}/${this.config.retry.maxAttempts}) in ${delay}ms`);
                
                await this.sleep(delay);
            }
        }
        
        // All retries failed
        throw lastError;
    }

    /**
     * Check circuit breaker state
     */
    checkCircuitBreaker(serviceName) {
        const circuitBreaker = this.getOrCreateCircuitBreaker(serviceName);
        
        switch (circuitBreaker.state) {
            case 'closed':
                return true;
                
            case 'open':
                if (Date.now() >= circuitBreaker.nextAttempt) {
                    circuitBreaker.state = 'half-open';
                    circuitBreaker.halfOpenCalls = 0;
                    return true;
                }
                return false;
                
            case 'half-open':
                if (circuitBreaker.halfOpenCalls >= this.config.circuitBreaker.halfOpenMaxCalls) {
                    return false;
                }
                circuitBreaker.halfOpenCalls++;
                return true;
                
            default:
                return true;
        }
    }

    /**
     * Record circuit breaker failure
     */
    recordCircuitBreakerFailure(serviceName, errorType) {
        const circuitBreaker = this.getOrCreateCircuitBreaker(serviceName);
        
        circuitBreaker.failureCount++;
        circuitBreaker.lastFailureTime = Date.now();
        
        if (circuitBreaker.failureCount >= this.config.circuitBreaker.failureThreshold) {
            circuitBreaker.state = 'open';
            circuitBreaker.nextAttempt = Date.now() + this.config.circuitBreaker.recoveryTimeout;
            this.metrics.circuitBreakerTrips++;
            
            console.log(`🔴 Circuit breaker opened for service: ${serviceName}`);
        }
    }

    /**
     * Reset circuit breaker
     */
    resetCircuitBreaker(serviceName) {
        const circuitBreaker = this.getOrCreateCircuitBreaker(serviceName);
        circuitBreaker.state = 'closed';
        circuitBreaker.failureCount = 0;
        circuitBreaker.lastFailureTime = null;
        circuitBreaker.nextAttempt = null;
        circuitBreaker.halfOpenCalls = 0;
        
        this.metrics.recoveredErrors++;
    }

    /**
     * Check rate limit
     */
    checkRateLimit(serviceName) {
        const rateLimiter = this.getOrCreateRateLimiter(serviceName);
        const now = Date.now();
        
        // Clean old entries
        rateLimiter.requests = rateLimiter.requests.filter(time => now - time < this.config.rateLimit.windowMs);
        
        // Check if under limit
        if (rateLimiter.requests.length < this.getRateLimit(serviceName)) {
            rateLimiter.requests.push(now);
            return true;
        }
        
        this.metrics.rateLimitHits++;
        return false;
    }

    /**
     * Calculate retry delay with exponential backoff
     */
    calculateRetryDelay(attempt, serviceName) {
        const baseDelay = this.config.retry.baseDelay;
        const multiplier = this.config.retry.backoffMultiplier;
        const maxDelay = this.config.retry.maxDelay;
        
        let delay = baseDelay * Math.pow(multiplier, attempt - 1);
        delay = Math.min(delay, maxDelay);
        
        // Add jitter to prevent thundering herd
        if (this.config.retry.jitter) {
            const jitter = Math.random() * 0.1 * delay; // 10% jitter
            delay += jitter;
        }
        
        return Math.floor(delay);
    }

    /**
     * Classify error type
     */
    classifyError(error) {
        if (error.type) {
            return error.type;
        }
        
        const message = error.message.toLowerCase();
        
        if (message.includes('timeout')) {
            return this.errorTypes.TIMEOUT;
        }
        if (message.includes('network') || message.includes('connection')) {
            return this.errorTypes.NETWORK;
        }
        if (message.includes('rate limit') || message.includes('too many requests')) {
            return this.errorTypes.RATE_LIMIT;
        }
        if (message.includes('circuit breaker')) {
            return this.errorTypes.CIRCUIT_BREAKER;
        }
        if (message.includes('validation') || message.includes('invalid')) {
            return this.errorTypes.VALIDATION;
        }
        if (message.includes('unauthorized') || message.includes('authentication')) {
            return this.errorTypes.AUTHENTICATION;
        }
        if (message.includes('forbidden') || message.includes('authorization')) {
            return this.errorTypes.AUTHORIZATION;
        }
        if (message.includes('not found') || message.includes('404')) {
            return this.errorTypes.NOT_FOUND;
        }
        if (message.includes('server error') || message.includes('500')) {
            return this.errorTypes.SERVER_ERROR;
        }
        
        return this.errorTypes.UNKNOWN;
    }

    /**
     * Check if error is retryable
     */
    isRetryableError(errorType) {
        const retryableTypes = [
            this.errorTypes.TIMEOUT,
            this.errorTypes.NETWORK,
            this.errorTypes.RATE_LIMIT,
            this.errorTypes.SERVER_ERROR
        ];
        
        return retryableTypes.includes(errorType);
    }

    /**
     * Create standardized error
     */
    createError(type, message, context = {}) {
        const error = new Error(message);
        error.type = type;
        error.context = context;
        error.timestamp = new Date().toISOString();
        error.retryable = this.isRetryableError(type);
        
        return error;
    }

    /**
     * Get or create circuit breaker for service
     */
    getOrCreateCircuitBreaker(serviceName) {
        if (!this.circuitBreakers.has(serviceName)) {
            this.circuitBreakers.set(serviceName, {
                state: 'closed',
                failureCount: 0,
                lastFailureTime: null,
                nextAttempt: null,
                halfOpenCalls: 0
            });
        }
        return this.circuitBreakers.get(serviceName);
    }

    /**
     * Get or create rate limiter for service
     */
    getOrCreateRateLimiter(serviceName) {
        if (!this.rateLimiters.has(serviceName)) {
            this.rateLimiters.set(serviceName, {
                requests: []
            });
        }
        return this.rateLimiters.get(serviceName);
    }

    /**
     * Get rate limit for service
     */
    getRateLimit(serviceName) {
        return this.config.rateLimit.perService[serviceName] || this.config.rateLimit.maxRequests;
    }

    /**
     * Reset retry counter
     */
    resetRetryCounter(serviceName) {
        this.retryCounters.delete(serviceName);
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get error handling metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            circuitBreakerStates: Object.fromEntries(
                Array.from(this.circuitBreakers.entries()).map(([name, cb]) => [name, cb.state])
            ),
            activeRateLimiters: this.rateLimiters.size,
            recoveryRate: this.metrics.totalErrors > 0 
                ? (this.metrics.recoveredErrors / this.metrics.totalErrors * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Health check for all services
     */
    getHealthStatus() {
        const health = {};
        
        for (const [serviceName, circuitBreaker] of this.circuitBreakers.entries()) {
            health[serviceName] = {
                circuitBreakerState: circuitBreaker.state,
                failureCount: circuitBreaker.failureCount,
                lastFailure: circuitBreaker.lastFailureTime,
                healthy: circuitBreaker.state === 'closed' || circuitBreaker.state === 'half-open'
            };
        }
        
        return health;
    }

    /**
     * Reset all circuit breakers
     */
    resetAllCircuitBreakers() {
        for (const serviceName of this.circuitBreakers.keys()) {
            this.resetCircuitBreaker(serviceName);
        }
        console.log('✅ All circuit breakers reset');
    }

    /**
     * Clear all rate limiters
     */
    clearAllRateLimiters() {
        this.rateLimiters.clear();
        console.log('✅ All rate limiters cleared');
    }
}

module.exports = ErrorHandlingService;