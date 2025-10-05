/**
 * Enhanced Agent Coordinator - Implements parallel execution and advanced coordination
 * 
 * Features:
 * 1. Parallel agent execution with weighted decision synthesis
 * 2. Circuit breaker patterns for error resilience
 * 3. Advanced caching with TTL and invalidation
 * 4. Performance monitoring and metrics collection
 * 5. Intelligent retry logic with exponential backoff
 * 6. Agent health monitoring and failover
 */

const AgentBase = require('./agent-base');

class EnhancedAgentCoordinator extends AgentBase {
    constructor() {
        super('EnhancedAgentCoordinator');
        
        // Agent registry and configuration
        this.agents = new Map();
        this.agentWeights = new Map();
        this.agentHealth = new Map();
        
        // Circuit breaker configuration
        this.circuitBreakers = new Map();
        this.circuitBreakerConfig = {
            failureThreshold: 5,
            recoveryTimeout: 30000, // 30 seconds
            halfOpenMaxCalls: 3
        };
        
        // Caching configuration
        this.cache = new Map();
        this.cacheConfig = {
            defaultTTL: 300000, // 5 minutes
            maxSize: 1000,
            cleanupInterval: 60000 // 1 minute
        };
        
        // Performance monitoring
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            cacheHitRate: 0,
            agentHealth: new Map()
        };
        
        // Initialize cleanup interval
        this.startCacheCleanup();
    }

    /**
     * Register an agent with the coordinator
     */
    registerAgent(name, agent, weight = 1.0, dependencies = []) {
        this.agents.set(name, {
            instance: agent,
            weight: weight,
            dependencies: dependencies,
            health: 'healthy',
            lastUsed: null,
            successCount: 0,
            failureCount: 0
        });
        
        this.agentWeights.set(name, weight);
        this.agentHealth.set(name, 'healthy');
        
        // Initialize circuit breaker for this agent
        this.circuitBreakers.set(name, {
            state: 'closed', // closed, open, half-open
            failureCount: 0,
            lastFailureTime: null,
            nextAttempt: null
        });
        
        console.log(`✅ Registered agent: ${name} (weight: ${weight})`);
    }

    /**
     * Main coordination method - executes agents in parallel with intelligent synthesis
     */
    async coordinateAgents(requests) {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        
        try {
            // Validate requests
            const validatedRequests = this.validateRequests(requests);
            
            // Check cache first
            const cacheKey = this.generateCacheKey(validatedRequests);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2;
                return cachedResult;
            }
            
            // Execute agents in parallel
            const agentPromises = validatedRequests.map(request => 
                this.executeAgentWithCircuitBreaker(request)
            );
            
            const agentResults = await Promise.allSettled(agentPromises);
            
            // Process results and handle failures
            const processedResults = this.processAgentResults(agentResults, validatedRequests);
            
            // Synthesize final decision
            const finalDecision = this.synthesizeDecision(processedResults);
            
            // Update metrics
            this.updateMetrics(startTime, true);
            
            // Cache result
            this.setCache(cacheKey, finalDecision);
            
            return finalDecision;
            
        } catch (error) {
            console.error('❌ Agent coordination failed:', error);
            this.updateMetrics(startTime, false);
            throw error;
        }
    }

    /**
     * Execute a single agent with circuit breaker protection
     */
    async executeAgentWithCircuitBreaker(request) {
        const { agentName, input, context } = request;
        const circuitBreaker = this.circuitBreakers.get(agentName);
        
        // Check circuit breaker state
        if (circuitBreaker.state === 'open') {
            if (Date.now() < circuitBreaker.nextAttempt) {
                throw new Error(`Circuit breaker open for agent ${agentName}`);
            } else {
                circuitBreaker.state = 'half-open';
                circuitBreaker.halfOpenCalls = 0;
            }
        }
        
        if (circuitBreaker.state === 'half-open') {
            if (circuitBreaker.halfOpenCalls >= this.circuitBreakerConfig.halfOpenMaxCalls) {
                throw new Error(`Circuit breaker half-open limit reached for agent ${agentName}`);
            }
            circuitBreaker.halfOpenCalls++;
        }
        
        try {
            const agent = this.agents.get(agentName);
            if (!agent) {
                throw new Error(`Agent ${agentName} not found`);
            }
            
            // Execute agent with timeout
            const result = await this.executeWithTimeout(
                agent.instance.process(input, context),
                10000 // 10 second timeout
            );
            
            // Update success metrics
            agent.successCount++;
            agent.lastUsed = Date.now();
            agent.health = 'healthy';
            
            // Reset circuit breaker on success
            if (circuitBreaker.state === 'half-open') {
                circuitBreaker.state = 'closed';
                circuitBreaker.failureCount = 0;
            }
            
            return {
                agentName,
                result,
                success: true,
                executionTime: Date.now() - Date.now()
            };
            
        } catch (error) {
            // Update failure metrics
            const agent = this.agents.get(agentName);
            if (agent) {
                agent.failureCount++;
                agent.health = 'degraded';
            }
            
            // Update circuit breaker
            circuitBreaker.failureCount++;
            circuitBreaker.lastFailureTime = Date.now();
            
            if (circuitBreaker.failureCount >= this.circuitBreakerConfig.failureThreshold) {
                circuitBreaker.state = 'open';
                circuitBreaker.nextAttempt = Date.now() + this.circuitBreakerConfig.recoveryTimeout;
            }
            
            return {
                agentName,
                error: error.message,
                success: false,
                executionTime: 0
            };
        }
    }

    /**
     * Process agent results and handle failures
     */
    processAgentResults(agentResults, requests) {
        const processedResults = {
            successful: [],
            failed: [],
            totalExecutionTime: 0
        };
        
        agentResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                processedResults.successful.push(result.value);
                processedResults.totalExecutionTime += result.value.executionTime;
            } else {
                processedResults.failed.push({
                    agentName: requests[index].agentName,
                    error: result.status === 'rejected' ? result.reason.message : result.value.error,
                    request: requests[index]
                });
            }
        });
        
        return processedResults;
    }

    /**
     * Synthesize final decision from multiple agent results
     */
    synthesizeDecision(processedResults) {
        const { successful, failed } = processedResults;
        
        if (successful.length === 0) {
            return {
                status: 'failed',
                reason: 'All agents failed',
                failedAgents: failed.map(f => f.agentName),
                timestamp: new Date().toISOString()
            };
        }
        
        // Calculate weighted votes
        const approvalVotes = [];
        const rejectionVotes = [];
        const conditionalVotes = [];
        
        successful.forEach(agentResult => {
            const agentName = agentResult.agentName;
            const result = agentResult.result;
            const weight = this.agentWeights.get(agentName) || 1.0;
            
            // Extract decision from agent result
            const decision = this.extractDecision(result);
            const confidence = this.extractConfidence(result);
            const riskLevel = this.extractRiskLevel(result);
            
            const weightedVote = {
                agentName,
                decision,
                confidence,
                riskLevel,
                weight,
                weightedScore: confidence * weight
            };
            
            switch (decision) {
                case 'approved':
                    approvalVotes.push(weightedVote);
                    break;
                case 'rejected':
                    rejectionVotes.push(weightedVote);
                    break;
                case 'conditional':
                    conditionalVotes.push(weightedVote);
                    break;
            }
        });
        
        // Calculate weighted scores
        const approvalWeight = approvalVotes.reduce((sum, vote) => sum + vote.weightedScore, 0);
        const rejectionWeight = rejectionVotes.reduce((sum, vote) => sum + vote.weightedScore, 0);
        const conditionalWeight = conditionalVotes.reduce((sum, vote) => sum + vote.weightedScore, 0);
        
        // Calculate human loop weight (escalation scenarios)
        const humanLoopWeight = failed.length > 0 ? failed.length * 0.2 : 0;
        
        // Determine final decision
        let finalDecision = 'approved';
        let confidence = 0.8;
        let reasoning = '';
        
        if (humanLoopWeight > 0 || failed.length > 0) {
            finalDecision = 'HUMAN_IN_LOOP';
            confidence = 0.6;
            reasoning = 'Agent failures detected, human review required';
        } else if (rejectionWeight > approvalWeight) {
            finalDecision = 'REJECTED';
            confidence = Math.min(rejectionWeight / (approvalWeight + rejectionWeight), 1.0);
            reasoning = 'Weighted rejection votes exceed approval votes';
        } else if (conditionalWeight > approvalWeight * 0.5) {
            finalDecision = 'CONDITIONAL';
            confidence = Math.min(conditionalWeight / (approvalWeight + conditionalWeight), 1.0);
            reasoning = 'Significant conditional requirements detected';
        } else {
            finalDecision = 'APPROVED';
            confidence = Math.min(approvalWeight / (approvalWeight + rejectionWeight + conditionalWeight), 1.0);
            reasoning = 'Weighted approval votes exceed other options';
        }
        
        // Generate synthesized rationale
        const synthesizedRationale = this.generateSynthesizedRationale(
            approvalVotes, rejectionVotes, conditionalVotes, failed
        );
        
        // Generate recommended actions
        const recommendedActions = this.generateRecommendedActions(
            finalDecision, approvalVotes, rejectionVotes, conditionalVotes
        );
        
        return {
            status: 'completed',
            finalDecision,
            confidence: Math.round(confidence * 100) / 100,
            reasoning,
            synthesizedRationale,
            recommendedActions,
            agentResults: {
                successful: successful.length,
                failed: failed.length,
                total: successful.length + failed.length
            },
            executionTime: processedResults.totalExecutionTime,
            timestamp: new Date().toISOString(),
            metadata: {
                approvalWeight,
                rejectionWeight,
                conditionalWeight,
                humanLoopWeight,
                failedAgents: failed.map(f => f.agentName)
            }
        };
    }

    /**
     * Generate synthesized rationale from all agent inputs
     */
    generateSynthesizedRationale(approvalVotes, rejectionVotes, conditionalVotes, failed) {
        const rationale = [];
        
        if (approvalVotes.length > 0) {
            rationale.push(`Approval consensus from ${approvalVotes.length} agents: ${approvalVotes.map(v => v.agentName).join(', ')}`);
        }
        
        if (rejectionVotes.length > 0) {
            rationale.push(`Rejection concerns from ${rejectionVotes.length} agents: ${rejectionVotes.map(v => v.agentName).join(', ')}`);
        }
        
        if (conditionalVotes.length > 0) {
            rationale.push(`Conditional requirements from ${conditionalVotes.length} agents: ${conditionalVotes.map(v => v.agentName).join(', ')}`);
        }
        
        if (failed.length > 0) {
            rationale.push(`Agent failures requiring human review: ${failed.map(f => f.agentName).join(', ')}`);
        }
        
        return rationale.join('; ');
    }

    /**
     * Generate recommended actions based on decision
     */
    generateRecommendedActions(finalDecision, approvalVotes, rejectionVotes, conditionalVotes) {
        const actions = [];
        
        switch (finalDecision) {
            case 'APPROVED':
                actions.push('Proceed with request');
                actions.push('Monitor implementation');
                break;
                
            case 'REJECTED':
                actions.push('Request denied');
                actions.push('Provide alternative solutions');
                actions.push('Review rejection reasons with stakeholders');
                break;
                
            case 'CONDITIONAL':
                actions.push('Implement required conditions');
                actions.push('Schedule follow-up review');
                actions.push('Monitor compliance with conditions');
                break;
                
            case 'HUMAN_IN_LOOP':
                actions.push('Escalate to human reviewer');
                actions.push('Gather additional context');
                actions.push('Resolve agent failures');
                break;
        }
        
        return actions;
    }

    /**
     * Extract decision from agent result
     */
    extractDecision(result) {
        if (result.decision?.decision) return result.decision.decision;
        if (result.decision?.status) return result.decision.status;
        if (result.status) return result.status;
        return 'unknown';
    }

    /**
     * Extract confidence from agent result
     */
    extractConfidence(result) {
        if (result.decision?.confidence) return result.decision.confidence;
        if (result.confidence) return result.confidence;
        if (result.context?.confidence) return result.context.confidence;
        return 0.5; // Default confidence
    }

    /**
     * Extract risk level from agent result
     */
    extractRiskLevel(result) {
        if (result.risk?.level) return result.risk.level;
        if (result.decision?.riskLevel) return result.decision.riskLevel;
        return 'medium';
    }

    /**
     * Execute function with timeout
     */
    async executeWithTimeout(promise, timeoutMs) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
            )
        ]);
    }

    /**
     * Validate agent requests
     */
    validateRequests(requests) {
        if (!Array.isArray(requests)) {
            throw new Error('Requests must be an array');
        }
        
        return requests.map(request => {
            if (!request.agentName || !this.agents.has(request.agentName)) {
                throw new Error(`Invalid agent name: ${request.agentName}`);
            }
            return request;
        });
    }

    /**
     * Generate cache key for requests
     */
    generateCacheKey(requests) {
        const keyData = requests.map(r => ({
            agent: r.agentName,
            input: r.input,
            context: r.context
        }));
        return `coord_${JSON.stringify(keyData).replace(/[^a-zA-Z0-9]/g, '')}`;
    }

    /**
     * Get result from cache
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() < cached.expires) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    /**
     * Set result in cache
     */
    setCache(key, data, ttl = null) {
        if (this.cache.size >= this.cacheConfig.maxSize) {
            // Remove oldest entry
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            data,
            expires: Date.now() + (ttl || this.cacheConfig.defaultTTL)
        });
    }

    /**
     * Start cache cleanup interval
     */
    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (now >= value.expires) {
                    this.cache.delete(key);
                }
            }
        }, this.cacheConfig.cleanupInterval);
    }

    /**
     * Update performance metrics
     */
    updateMetrics(startTime, success) {
        const executionTime = Date.now() - startTime;
        
        if (success) {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }
        
        // Update average response time
        const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime * (totalRequests - 1) + executionTime) / totalRequests;
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            registeredAgents: this.agents.size,
            circuitBreakerStates: Object.fromEntries(
                Array.from(this.circuitBreakers.entries()).map(([name, cb]) => [name, cb.state])
            )
        };
    }

    /**
     * Health check for all agents
     */
    async healthCheck() {
        const healthStatus = {};
        
        for (const [name, agent] of this.agents.entries()) {
            try {
                // Simple health check - try to get agent info
                const info = agent.instance.getInfo ? agent.instance.getInfo() : { name };
                healthStatus[name] = {
                    status: 'healthy',
                    info,
                    lastUsed: agent.lastUsed,
                    successCount: agent.successCount,
                    failureCount: agent.failureCount
                };
            } catch (error) {
                healthStatus[name] = {
                    status: 'unhealthy',
                    error: error.message
                };
            }
        }
        
        return healthStatus;
    }

    /**
     * Reset circuit breaker for an agent
     */
    resetCircuitBreaker(agentName) {
        const circuitBreaker = this.circuitBreakers.get(agentName);
        if (circuitBreaker) {
            circuitBreaker.state = 'closed';
            circuitBreaker.failureCount = 0;
            circuitBreaker.lastFailureTime = null;
            circuitBreaker.nextAttempt = null;
            console.log(`✅ Circuit breaker reset for agent: ${agentName}`);
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('✅ Cache cleared');
    }
}

module.exports = EnhancedAgentCoordinator;