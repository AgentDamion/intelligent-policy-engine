/**
 * Comprehensive Mock Implementations for Enhanced Testing
 * 
 * This module provides mock implementations for all agents and services
 * to enable comprehensive testing without external dependencies.
 */

class MockAgentBase {
    constructor(name, options = {}) {
        this.name = name;
        this.options = {
            successRate: options.successRate || 0.95,
            averageResponseTime: options.averageResponseTime || 1000,
            failureMode: options.failureMode || 'random', // 'random', 'always', 'never'
            ...options
        };
        
        this.callCount = 0;
        this.successCount = 0;
        this.failureCount = 0;
        this.totalResponseTime = 0;
    }

    async process(input, context) {
        this.callCount++;
        const startTime = Date.now();
        
        // Simulate processing time
        await this.simulateProcessingTime();
        
        const responseTime = Date.now() - startTime;
        this.totalResponseTime += responseTime;
        
        // Determine if this call should succeed
        const shouldSucceed = this.shouldSucceed();
        
        if (shouldSucceed) {
            this.successCount++;
            return this.generateSuccessResponse(input, context, responseTime);
        } else {
            this.failureCount++;
            throw this.generateErrorResponse(input, context);
        }
    }

    shouldSucceed() {
        switch (this.options.failureMode) {
            case 'always':
                return false;
            case 'never':
                return true;
            case 'random':
            default:
                return Math.random() < this.options.successRate;
        }
    }

    async simulateProcessingTime() {
        const baseTime = this.options.averageResponseTime;
        const variance = baseTime * 0.5; // 50% variance
        const actualTime = baseTime + (Math.random() - 0.5) * variance;
        await new Promise(resolve => setTimeout(resolve, Math.max(10, actualTime)));
    }

    generateSuccessResponse(input, context, responseTime) {
        // Override in subclasses
        return {
            status: 'success',
            agent: this.name,
            responseTime,
            timestamp: new Date().toISOString()
        };
    }

    generateErrorResponse(input, context) {
        const error = new Error(`Mock ${this.name} agent failed`);
        error.type = 'mock_error';
        error.agent = this.name;
        return error;
    }

    getInfo() {
        return {
            name: this.name,
            type: 'MockAgent',
            callCount: this.callCount,
            successCount: this.successCount,
            failureCount: this.failureCount,
            averageResponseTime: this.callCount > 0 ? this.totalResponseTime / this.callCount : 0,
            successRate: this.callCount > 0 ? this.successCount / this.callCount : 0
        };
    }

    reset() {
        this.callCount = 0;
        this.successCount = 0;
        this.failureCount = 0;
        this.totalResponseTime = 0;
    }
}

class MockPolicyAgent extends MockAgentBase {
    constructor(options = {}) {
        super('MockPolicyAgent', {
            averageResponseTime: 800,
            successRate: 0.9,
            ...options
        });
    }

    generateSuccessResponse(input, context, responseTime) {
        const riskScore = this.calculateRiskScore(input);
        const decision = this.makeDecision(riskScore);
        
        return {
            request: {
                originalContent: input.message || input.userMessage || 'Mock request',
                user: {
                    role: 'marketing_agency_employee',
                    urgency_level: input.urgency || 0.5,
                    emotional_state: 'neutral'
                },
                request: {
                    tool: input.tool || 'unknown',
                    purpose: input.usage || 'general',
                    presentation_type: 'client_presentation',
                    confidence: 0.8,
                    deadline: 'pending',
                    current_time: new Date().toISOString()
                },
                context: {
                    time_pressure: input.urgency || 0.5,
                    is_weekend: false,
                    is_client_facing: true
                }
            },
            risk: {
                score: riskScore,
                factors: this.getRiskFactors(input),
                level: this.getRiskLevel(riskScore)
            },
            decision: {
                decision: decision,
                type: decision === 'approved' ? 'auto_approval' : 'requires_review',
                reasoning: this.getDecisionReasoning(decision, riskScore),
                requires_escalation: decision === 'rejected'
            },
            conditions: {
                guardrails: this.getGuardrails(riskScore, input)
            },
            monitoring: {
                requirements: this.getMonitoringRequirements(riskScore),
                escalation: riskScore > 0.7
            },
            escalation: riskScore > 0.7,
            next_steps: this.getNextSteps(decision),
            confidence: 0.85,
            agent: this.name,
            responseTime,
            timestamp: new Date().toISOString()
        };
    }

    calculateRiskScore(input) {
        let score = 0.1;
        
        // Tool risk
        const tool = (input.tool || '').toLowerCase();
        if (tool.includes('unknown') || tool.includes('custom')) {
            score += 0.3;
        } else if (tool.includes('chatgpt') || tool.includes('google')) {
            score += 0.1;
        } else {
            score += 0.2;
        }
        
        // Data handling risk
        const dataHandling = (input.dataHandling || '').toLowerCase();
        if (dataHandling.includes('ssn') || dataHandling.includes('medical')) {
            score += 0.4;
        } else if (dataHandling.includes('pii')) {
            score += 0.2;
        }
        
        // Multi-client risk
        if (input.clients && Array.isArray(input.clients) && input.clients.length > 1) {
            score += 0.2;
        }
        
        // Industry risk
        if (input.industry === 'pharmaceutical') {
            score += 0.1;
        }
        
        return Math.min(score, 1.0);
    }

    makeDecision(riskScore) {
        if (riskScore > 0.7) return 'rejected';
        if (riskScore > 0.3) return 'conditional';
        return 'approved';
    }

    getRiskLevel(score) {
        if (score > 0.7) return 'critical';
        if (score > 0.5) return 'high';
        if (score > 0.3) return 'medium';
        return 'low';
    }

    getRiskFactors(input) {
        const factors = [];
        
        if (input.tool && input.tool.includes('unknown')) {
            factors.push('Unknown tool poses security risk');
        }
        
        if (input.dataHandling && input.dataHandling.includes('pii')) {
            factors.push('PII processing requires enhanced controls');
        }
        
        if (input.clients && input.clients.length > 1) {
            factors.push('Multiple clients require conflict assessment');
        }
        
        return factors.length > 0 ? factors : ['Standard business request'];
    }

    getDecisionReasoning(decision, riskScore) {
        switch (decision) {
            case 'rejected':
                return 'High risk factors exceed acceptable thresholds';
            case 'conditional':
                return 'Medium risk requires additional controls and monitoring';
            case 'approved':
                return 'Low risk request meets auto-approval criteria';
            default:
                return 'Request requires review';
        }
    }

    getGuardrails(riskScore, input) {
        const guardrails = ['content_review'];
        
        if (riskScore > 0.5) {
            guardrails.push('enhanced_monitoring');
        }
        
        if (input.dataHandling && input.dataHandling.includes('pii')) {
            guardrails.push('data_protection_review');
        }
        
        return guardrails;
    }

    getMonitoringRequirements(riskScore) {
        const requirements = ['usage_tracking'];
        
        if (riskScore > 0.5) {
            requirements.push('enhanced_logging', 'periodic_audits');
        }
        
        return requirements;
    }

    getNextSteps(decision) {
        switch (decision) {
            case 'approved':
                return ['Proceed with request'];
            case 'conditional':
                return ['Implement additional controls', 'Schedule review'];
            case 'rejected':
                return ['Request denied', 'Consider alternatives'];
            default:
                return ['Review required'];
        }
    }
}

class MockContextAgent extends MockAgentBase {
    constructor(options = {}) {
        super('MockContextAgent', {
            averageResponseTime: 500,
            successRate: 0.95,
            ...options
        });
    }

    generateSuccessResponse(input, context, responseTime) {
        const urgency = this.analyzeUrgency(input);
        const contextAnalysis = this.analyzeContext(input);
        
        return {
            originalContent: input.message || input.userMessage || 'Mock message',
            rawContent: input.message || input.userMessage || 'Mock message',
            urgency: {
                level: urgency.level,
                emotionalState: urgency.emotionalState,
                timePressure: urgency.timePressure
            },
            context: {
                inferredType: contextAnalysis.type,
                confidence: contextAnalysis.confidence,
                reasoning: contextAnalysis.reasoning
            },
            clarification: {
                question: this.generateClarifyingQuestion(contextAnalysis),
                purpose: 'refine_context_and_urgency'
            },
            recommendations: this.generateRecommendations(urgency, contextAnalysis),
            nextSteps: this.generateNextSteps(urgency.level),
            agent: this.name,
            responseTime,
            timestamp: new Date().toISOString()
        };
    }

    analyzeUrgency(input) {
        const message = (input.message || input.userMessage || '').toLowerCase();
        let level = 0.1;
        
        // Exclamation marks
        const exclamationCount = (message.match(/!/g) || []).length;
        level += Math.min(exclamationCount, 3) * 0.2;
        
        // Urgency keywords
        const urgencyWords = ['urgent', 'asap', 'emergency', 'critical', 'deadline'];
        const urgencyWordCount = urgencyWords.filter(word => message.includes(word)).length;
        level += urgencyWordCount * 0.2;
        
        // Time pressure from context
        if (input.urgency) {
            level += input.urgency * 0.3;
        }
        
        level = Math.min(level, 1.0);
        
        return {
            level,
            emotionalState: this.getEmotionalState(level),
            timePressure: level * 0.8
        };
    }

    getEmotionalState(urgencyLevel) {
        if (urgencyLevel > 0.8) return 'panicked';
        if (urgencyLevel > 0.6) return 'stressed';
        if (urgencyLevel > 0.4) return 'concerned';
        return 'calm';
    }

    analyzeContext(input) {
        const message = (input.message || input.userMessage || '').toLowerCase();
        
        const contextTypes = {
            'client_presentation': {
                keywords: ['client', 'presentation', 'pitch', 'proposal'],
                confidence: 0.8
            },
            'internal_review': {
                keywords: ['team', 'internal', 'review', 'update'],
                confidence: 0.6
            },
            'creative_pitch': {
                keywords: ['creative', 'concept', 'idea', 'design'],
                confidence: 0.7
            },
            'data_analysis': {
                keywords: ['data', 'analytics', 'metrics', 'report'],
                confidence: 0.5
            }
        };
        
        let bestMatch = { type: 'client_presentation', confidence: 0.6, reasoning: ['Default context inference'] };
        
        for (const [type, config] of Object.entries(contextTypes)) {
            const keywordMatches = config.keywords.filter(keyword => message.includes(keyword)).length;
            if (keywordMatches > 0) {
                const score = (keywordMatches / config.keywords.length) * config.confidence;
                if (score > bestMatch.confidence) {
                    bestMatch = {
                        type,
                        confidence: score,
                        reasoning: [`Matched ${keywordMatches} keywords for ${type}`]
                    };
                }
            }
        }
        
        return bestMatch;
    }

    generateClarifyingQuestion(contextAnalysis) {
        const questions = {
            'client_presentation': "Is this for the Johnson & Co. quarterly review we've been prepping?",
            'internal_review': "Is this for the Monday team sync on Q1 campaigns?",
            'creative_pitch': "Are you finalizing the creative concepts for the new product launch?",
            'data_analysis': "Do you need help with the campaign performance data for Monday's review?"
        };
        
        return questions[contextAnalysis.type] || "What type of presentation are you working on?";
    }

    generateRecommendations(urgency, contextAnalysis) {
        const recommendations = [];
        
        if (urgency.level > 0.8) {
            recommendations.push({
                priority: 'high',
                action: 'Start with AI tool immediately for content generation',
                reasoning: 'High urgency detected - immediate action needed'
            });
        }
        
        if (contextAnalysis.type === 'client_presentation') {
            recommendations.push({
                priority: 'medium',
                action: 'Focus on professional tone and client-specific insights',
                reasoning: 'Client presentation requires polished, professional content'
            });
        }
        
        return recommendations;
    }

    generateNextSteps(urgencyLevel) {
        if (urgencyLevel > 0.8) {
            return [
                'Immediately open AI tool',
                'Start with presentation outline',
                'Set aside 2-3 hours for focused work'
            ];
        } else if (urgencyLevel > 0.6) {
            return [
                'Plan AI tool session for today',
                'Gather presentation requirements',
                'Allocate 1-2 hours for content creation'
            ];
        } else {
            return [
                'Schedule AI tool session for this weekend',
                'Review presentation requirements',
                'Plan content structure'
            ];
        }
    }
}

class MockAuditAgent extends MockAgentBase {
    constructor(options = {}) {
        super('MockAuditAgent', {
            averageResponseTime: 1200,
            successRate: 0.9,
            ...options
        });
    }

    generateSuccessResponse(input, context, responseTime) {
        return {
            status: 'success',
            auditTrail: this.generateAuditTrail(input, context),
            complianceScore: this.calculateComplianceScore(input),
            recommendations: this.generateRecommendations(input),
            riskAssessment: this.assessRisk(input),
            agent: this.name,
            responseTime,
            timestamp: new Date().toISOString()
        };
    }

    generateAuditTrail(input, context) {
        return [
            {
                action: 'request_received',
                timestamp: new Date().toISOString(),
                details: 'Request received for audit processing'
            },
            {
                action: 'context_analyzed',
                timestamp: new Date().toISOString(),
                details: 'Context analysis completed'
            },
            {
                action: 'compliance_checked',
                timestamp: new Date().toISOString(),
                details: 'Compliance requirements verified'
            }
        ];
    }

    calculateComplianceScore(input) {
        let score = 0.8; // Base score
        
        // Adjust based on tool
        if (input.tool && input.tool.includes('chatgpt')) {
            score += 0.1;
        }
        
        // Adjust based on data handling
        if (input.dataHandling && input.dataHandling.includes('pii')) {
            score -= 0.2;
        }
        
        return Math.max(0, Math.min(1, score));
    }

    generateRecommendations(input) {
        const recommendations = ['Implement full audit logging'];
        
        if (input.tool && input.tool.includes('unknown')) {
            recommendations.push('Verify tool security and compliance');
        }
        
        if (input.clients && input.clients.length > 1) {
            recommendations.push('Ensure client data segregation');
        }
        
        return recommendations;
    }

    assessRisk(input) {
        const riskFactors = [];
        
        if (input.tool && input.tool.includes('unknown')) {
            riskFactors.push('Unknown tool security risk');
        }
        
        if (input.dataHandling && input.dataHandling.includes('pii')) {
            riskFactors.push('PII processing risk');
        }
        
        return {
            level: riskFactors.length > 0 ? 'medium' : 'low',
            factors: riskFactors
        };
    }
}

class MockNegotiationAgent extends MockAgentBase {
    constructor(options = {}) {
        super('MockNegotiationAgent', {
            averageResponseTime: 2000,
            successRate: 0.85,
            ...options
        });
    }

    generateSuccessResponse(input, context, responseTime) {
        const clients = this.extractClients(input);
        const conflicts = this.detectConflicts(input, clients);
        const solution = this.generateSolution(conflicts);
        
        return {
            clients: {
                count: clients.length,
                names: clients,
                industry: this.detectIndustry(input),
                tool: {
                    name: input.tool || 'unknown',
                    type: this.categorizeTool(input.tool)
                }
            },
            relationships: {
                competitors: this.findCompetitors(clients),
                risk_level: this.assessRelationshipRisk(clients),
                conflicts_detected: conflicts.length > 0
            },
            conflicts: {
                total: conflicts.length,
                competitive_intelligence: conflicts.filter(c => c.type === 'competitive'),
                regulatory: conflicts.filter(c => c.type === 'regulatory'),
                brand: conflicts.filter(c => c.type === 'brand')
            },
            solution: {
                approach: solution.approach,
                feasibility: solution.feasibility,
                escalation: solution.escalation,
                timeline: solution.timeline
            },
            decision: {
                status: solution.status,
                reasoning: solution.reasoning,
                next_steps: solution.nextSteps
            },
            client_requirements: this.generateClientRequirements(clients),
            agent: this.name,
            responseTime,
            timestamp: new Date().toISOString()
        };
    }

    extractClients(input) {
        const clientKeywords = ['pfizer', 'novartis', 'roche', 'merck', 'astrazeneca', 'sanofi', 'toyota', 'honda', 'ford'];
        const message = (input.message || input.userMessage || '').toLowerCase();
        
        return clientKeywords.filter(client => message.includes(client));
    }

    detectIndustry(input) {
        const message = (input.message || input.userMessage || '').toLowerCase();
        
        if (message.includes('pharmaceutical') || message.includes('drug')) {
            return 'pharmaceutical';
        }
        if (message.includes('automotive') || message.includes('car')) {
            return 'automotive';
        }
        if (message.includes('technology') || message.includes('tech')) {
            return 'technology';
        }
        
        return 'general';
    }

    categorizeTool(tool) {
        if (!tool) return 'unknown';
        
        const toolLower = tool.toLowerCase();
        if (toolLower.includes('chatgpt')) return 'text_generation';
        if (toolLower.includes('dall-e') || toolLower.includes('midjourney')) return 'image_generation';
        if (toolLower.includes('runway')) return 'video_generation';
        
        return 'general';
    }

    detectConflicts(input, clients) {
        const conflicts = [];
        
        if (clients.length > 1) {
            // Check for competitive conflicts
            const pharmaceuticalClients = clients.filter(c => 
                ['pfizer', 'novartis', 'roche', 'merck', 'astrazeneca', 'sanofi'].includes(c)
            );
            
            if (pharmaceuticalClients.length > 1) {
                conflicts.push({
                    type: 'competitive',
                    description: 'Multiple pharmaceutical clients detected',
                    severity: 'high',
                    clients: pharmaceuticalClients
                });
            }
        }
        
        return conflicts;
    }

    findCompetitors(clients) {
        const competitors = [];
        
        for (let i = 0; i < clients.length; i++) {
            for (let j = i + 1; j < clients.length; j++) {
                competitors.push({
                    client1: clients[i],
                    client2: clients[j],
                    industry: this.detectIndustry({ message: clients.join(' ') })
                });
            }
        }
        
        return competitors;
    }

    assessRelationshipRisk(clients) {
        if (clients.length <= 1) return 'low';
        if (clients.length === 2) return 'medium';
        return 'high';
    }

    generateSolution(conflicts) {
        if (conflicts.length === 0) {
            return {
                approach: 'direct_approval',
                feasibility: 'high',
                escalation: false,
                timeline: 'immediate',
                status: 'approved',
                reasoning: 'No conflicts detected, safe to proceed',
                nextSteps: ['Proceed with request']
            };
        }
        
        return {
            approach: 'conflict_resolution',
            feasibility: 'medium',
            escalation: true,
            timeline: '1-2 days',
            status: 'conditional',
            reasoning: 'Conflicts detected, requires resolution',
            nextSteps: ['Implement information segregation', 'Schedule conflict resolution meeting']
        };
    }

    generateClientRequirements(clients) {
        return clients.map(client => ({
            client,
            requirements: ['Data segregation', 'Confidentiality agreement', 'Regular monitoring'],
            priority: 'high'
        }));
    }
}

class MockCacheService {
    constructor(options = {}) {
        this.cache = new Map();
        this.config = {
            defaultTTL: options.defaultTTL || 300000,
            maxSize: options.maxSize || 1000,
            ...options
        };
        
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };
    }

    async get(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() < cached.expires) {
            this.metrics.hits++;
            return cached.data;
        }
        
        if (cached) {
            this.cache.delete(key);
        }
        
        this.metrics.misses++;
        return null;
    }

    async set(key, value, ttl = null) {
        if (this.cache.size >= this.config.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            data: value,
            expires: Date.now() + (ttl || this.config.defaultTTL)
        });
        
        this.metrics.sets++;
        return true;
    }

    async delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.metrics.deletes++;
        }
        return deleted;
    }

    async mget(keys) {
        return keys.map(key => {
            const cached = this.cache.get(key);
            const found = cached && Date.now() < cached.expires;
            return {
                key,
                value: found ? cached.data : null,
                found
            };
        });
    }

    async mset(keyValuePairs, ttl = null) {
        for (const { key, value } of keyValuePairs) {
            await this.set(key, value, ttl);
        }
        return true;
    }

    getStats() {
        const total = this.metrics.hits + this.metrics.misses;
        return {
            ...this.metrics,
            hitRate: total > 0 ? `${(this.metrics.hits / total * 100).toFixed(2)}%` : '0%',
            memoryCacheSize: this.cache.size
        };
    }

    async clear() {
        this.cache.clear();
        return true;
    }

    async close() {
        // Mock implementation - no actual connection to close
        return true;
    }
}

class MockErrorHandlingService {
    constructor(options = {}) {
        this.config = {
            failureThreshold: options.failureThreshold || 5,
            recoveryTimeout: options.recoveryTimeout || 30000,
            maxRetries: options.maxRetries || 3,
            ...options
        };
        
        this.metrics = {
            totalErrors: 0,
            recoveredErrors: 0,
            circuitBreakerTrips: 0,
            retryAttempts: 0
        };
        
        this.circuitBreakers = new Map();
    }

    async executeWithErrorHandling(operation, context = {}) {
        const { serviceName = 'unknown' } = context;
        
        try {
            const result = await operation();
            this.metrics.recoveredErrors++;
            return result;
        } catch (error) {
            this.metrics.totalErrors++;
            this.metrics.retryAttempts++;
            throw error;
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }

    resetAllCircuitBreakers() {
        this.circuitBreakers.clear();
        return true;
    }

    clearAllRateLimiters() {
        return true;
    }
}

class MockPerformanceMonitoringService {
    constructor(options = {}) {
        this.metrics = {
            counters: new Map(),
            gauges: new Map(),
            histograms: new Map()
        };
        
        this.config = {
            enableMetrics: options.enableMetrics !== false,
            ...options
        };
    }

    incrementCounter(name, value = 1, labels = {}) {
        const key = this.createKey(name, labels);
        const current = this.metrics.counters.get(key) || 0;
        this.metrics.counters.set(key, current + value);
    }

    setGauge(name, value, labels = {}) {
        const key = this.createKey(name, labels);
        this.metrics.gauges.set(key, { value, timestamp: Date.now(), labels });
    }

    recordHistogram(name, value, labels = {}) {
        const key = this.createKey(name, labels);
        if (!this.metrics.histograms.has(key)) {
            this.metrics.histograms.set(key, []);
        }
        this.metrics.histograms.get(key).push({ value, timestamp: Date.now(), labels });
    }

    startTimer(name, labels = {}) {
        const key = this.createKey(name, labels);
        return { startTime: Date.now(), labels, name };
    }

    endTimer(timer) {
        return Date.now() - timer.startTime;
    }

    createKey(name, labels) {
        const labelString = Object.entries(labels)
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
        return labelString ? `${name}|${labelString}` : name;
    }

    getMetricsSummary() {
        return {
            performance: {
                totalOperations: Array.from(this.metrics.counters.values()).reduce((sum, val) => sum + val, 0),
                averageResponseTime: 1000,
                errorRate: 0.05
            },
            counters: Object.fromEntries(this.metrics.counters),
            gauges: Object.fromEntries(
                Array.from(this.metrics.gauges.entries()).map(([key, value]) => [key, value.value])
            )
        };
    }

    checkAlerts() {
        return []; // Mock implementation - no alerts
    }
}

// Export all mock implementations
module.exports = {
    MockAgentBase,
    MockPolicyAgent,
    MockContextAgent,
    MockAuditAgent,
    MockNegotiationAgent,
    MockCacheService,
    MockErrorHandlingService,
    MockPerformanceMonitoringService
};