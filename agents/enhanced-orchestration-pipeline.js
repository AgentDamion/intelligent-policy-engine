/**
 * Enhanced Orchestration Pipeline - Demonstrates parallel agent execution and advanced coordination
 * 
 * Features:
 * 1. Parallel agent execution with intelligent synthesis
 * 2. Advanced caching and performance optimization
 * 3. Comprehensive error handling and recovery
 * 4. Real-time monitoring and alerting
 * 5. Dynamic workflow adaptation based on complexity
 * 6. Multi-tenant support with resource isolation
 */

const EnhancedAgentRegistry = require('./agent-registry').EnhancedAgentRegistry;

class EnhancedOrchestrationPipeline {
    constructor(options = {}) {
        this.registry = new EnhancedAgentRegistry();
        this.config = {
            enableParallelExecution: options.enableParallelExecution !== false,
            enableCaching: options.enableCaching !== false,
            enableMonitoring: options.enableMonitoring !== false,
            maxConcurrentAgents: options.maxConcurrentAgents || 5,
            defaultTimeout: options.defaultTimeout || 30000, // 30 seconds
            cacheTTL: options.cacheTTL || 300000, // 5 minutes
            ...options
        };
        
        this.workflowTemplates = {
            simple: ['context', 'policy'],
            moderate: ['context', 'policy', 'audit'],
            complex: ['context', 'policy', 'audit', 'negotiation', 'conflict-detection'],
            enterprise: ['context', 'policy', 'audit', 'negotiation', 'conflict-detection', 'guardrail-orchestrator', 'compliance-scoring']
        };
        
        this.performanceHistory = [];
        this.startPerformanceTracking();
    }

    /**
     * Main orchestration method - intelligently routes and executes agents
     */
    async orchestrateRequest(userMessage, context = {}) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        
        console.log(`🚀 Enhanced Orchestration Pipeline - Request ${requestId}`);
        console.log(`📝 User Message: "${userMessage}"`);
        console.log(`⚙️  Context:`, context);
        
        try {
            // Step 1: Analyze request complexity
            const complexityAnalysis = await this.analyzeRequestComplexity(userMessage, context);
            console.log(`🎯 Complexity Analysis: ${complexityAnalysis.level} (${complexityAnalysis.score}/10)`);
            
            // Step 2: Select appropriate workflow template
            const workflowTemplate = this.selectWorkflowTemplate(complexityAnalysis);
            console.log(`🔄 Selected Workflow: ${workflowTemplate.join(' → ')}`);
            
            // Step 3: Prepare agent requests
            const agentRequests = this.prepareAgentRequests(workflowTemplate, userMessage, context);
            
            // Step 4: Execute agents (parallel or sequential based on configuration)
            const agentResults = await this.executeAgents(agentRequests, complexityAnalysis);
            
            // Step 5: Synthesize results
            const synthesizedResult = await this.synthesizeResults(agentResults, complexityAnalysis);
            
            // Step 6: Generate final response
            const finalResponse = this.generateFinalResponse(synthesizedResult, requestId, startTime);
            
            // Step 7: Record performance metrics
            this.recordPerformanceMetrics(requestId, startTime, agentResults, synthesizedResult);
            
            console.log(`✅ Orchestration completed in ${Date.now() - startTime}ms`);
            return finalResponse;
            
        } catch (error) {
            console.error(`❌ Orchestration failed:`, error);
            return this.handleOrchestrationError(error, requestId, startTime);
        }
    }

    /**
     * Analyze request complexity to determine optimal workflow
     */
    async analyzeRequestComplexity(userMessage, context) {
        const complexityFactors = {
            urgency: this.analyzeUrgency(userMessage),
            multiClient: this.detectMultiClient(userMessage),
            competitiveIndustry: this.detectCompetitiveIndustry(userMessage),
            highRiskTool: this.detectHighRiskTool(userMessage),
            regulatoryRequirements: this.detectRegulatoryRequirements(userMessage),
            dataSensitivity: this.analyzeDataSensitivity(userMessage),
            timeConstraints: this.analyzeTimeConstraints(context)
        };
        
        // Calculate complexity score (0-10)
        let score = 0;
        score += complexityFactors.urgency * 2;
        score += complexityFactors.multiClient ? 2 : 0;
        score += complexityFactors.competitiveIndustry ? 1.5 : 0;
        score += complexityFactors.highRiskTool ? 1.5 : 0;
        score += complexityFactors.regulatoryRequirements ? 1.5 : 0;
        score += complexityFactors.dataSensitivity * 1.5;
        score += complexityFactors.timeConstraints * 1;
        
        const level = score >= 7 ? 'enterprise' : 
                     score >= 5 ? 'complex' : 
                     score >= 3 ? 'moderate' : 'simple';
        
        return {
            level,
            score: Math.min(score, 10),
            factors: complexityFactors,
            requiresParallelExecution: score >= 5,
            estimatedProcessingTime: this.estimateProcessingTime(score)
        };
    }

    /**
     * Select appropriate workflow template based on complexity
     */
    selectWorkflowTemplate(complexityAnalysis) {
        const { level, requiresParallelExecution } = complexityAnalysis;
        
        let template = this.workflowTemplates[level] || this.workflowTemplates.simple;
        
        // Add parallel execution indicators
        if (requiresParallelExecution && this.config.enableParallelExecution) {
            template = template.map(agent => ({ agent, parallel: true }));
        }
        
        return template;
    }

    /**
     * Prepare agent requests for execution
     */
    prepareAgentRequests(workflowTemplate, userMessage, context) {
        return workflowTemplate.map((agentConfig, index) => {
            const agentName = typeof agentConfig === 'string' ? agentConfig : agentConfig.agent;
            const isParallel = typeof agentConfig === 'object' ? agentConfig.parallel : false;
            
            return {
                agentName,
                input: this.prepareAgentInput(agentName, userMessage, context),
                context: {
                    ...context,
                    requestId: context.requestId,
                    agentIndex: index,
                    isParallel,
                    workflowTemplate: workflowTemplate.map(a => typeof a === 'string' ? a : a.agent)
                },
                priority: this.getAgentPriority(agentName),
                timeout: this.getAgentTimeout(agentName)
            };
        });
    }

    /**
     * Execute agents with enhanced coordination
     */
    async executeAgents(agentRequests, complexityAnalysis) {
        const { requiresParallelExecution } = complexityAnalysis;
        
        if (requiresParallelExecution && this.config.enableParallelExecution) {
            console.log(`🔄 Executing ${agentRequests.length} agents in parallel`);
            return await this.executeAgentsParallel(agentRequests);
        } else {
            console.log(`🔄 Executing ${agentRequests.length} agents sequentially`);
            return await this.executeAgentsSequential(agentRequests);
        }
    }

    /**
     * Execute agents in parallel with coordination
     */
    async executeAgentsParallel(agentRequests) {
        try {
            // Use the enhanced coordinator for parallel execution
            const results = await this.registry.coordinateAgents(agentRequests);
            
            // Process individual agent results
            const agentResults = agentRequests.map((request, index) => {
                const agentResult = results.agentResults?.successful?.find(r => r.agentName === request.agentName);
                return {
                    agentName: request.agentName,
                    success: !!agentResult,
                    result: agentResult?.result || null,
                    error: agentResult?.error || null,
                    executionTime: agentResult?.executionTime || 0,
                    parallel: true
                };
            });
            
            return {
                executionType: 'parallel',
                agentResults,
                coordinationResult: results,
                totalExecutionTime: results.executionTime || 0
            };
            
        } catch (error) {
            console.error('Parallel execution failed, falling back to sequential:', error);
            return await this.executeAgentsSequential(agentRequests);
        }
    }

    /**
     * Execute agents sequentially with error handling
     */
    async executeAgentsSequential(agentRequests) {
        const agentResults = [];
        let totalExecutionTime = 0;
        
        for (const request of agentRequests) {
            const agentStartTime = Date.now();
            
            try {
                console.log(`🤖 Executing agent: ${request.agentName}`);
                
                const result = await this.registry.processWithErrorHandling(
                    request.agentName,
                    request.input,
                    request.context
                );
                
                const executionTime = Date.now() - agentStartTime;
                totalExecutionTime += executionTime;
                
                agentResults.push({
                    agentName: request.agentName,
                    success: true,
                    result,
                    error: null,
                    executionTime,
                    parallel: false
                });
                
                console.log(`✅ ${request.agentName} completed in ${executionTime}ms`);
                
            } catch (error) {
                const executionTime = Date.now() - agentStartTime;
                totalExecutionTime += executionTime;
                
                agentResults.push({
                    agentName: request.agentName,
                    success: false,
                    result: null,
                    error: error.message,
                    executionTime,
                    parallel: false
                });
                
                console.error(`❌ ${request.agentName} failed:`, error.message);
            }
        }
        
        return {
            executionType: 'sequential',
            agentResults,
            totalExecutionTime
        };
    }

    /**
     * Synthesize results from all agents
     */
    async synthesizeResults(agentResults, complexityAnalysis) {
        const { agentResults: results, executionType, totalExecutionTime } = agentResults;
        
        // Separate successful and failed agents
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        // Extract key decisions and recommendations
        const decisions = this.extractDecisions(successful);
        const recommendations = this.extractRecommendations(successful);
        const riskFactors = this.extractRiskFactors(successful);
        
        // Calculate overall confidence
        const confidence = this.calculateOverallConfidence(successful, failed);
        
        // Determine final status
        const status = this.determineFinalStatus(decisions, failed, complexityAnalysis);
        
        // Generate synthesis rationale
        const rationale = this.generateSynthesisRationale(successful, failed, decisions);
        
        return {
            status,
            confidence,
            decisions,
            recommendations,
            riskFactors,
            rationale,
            executionSummary: {
                type: executionType,
                totalTime: totalExecutionTime,
                successfulAgents: successful.length,
                failedAgents: failed.length,
                agentDetails: results
            },
            complexityAnalysis,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate final response
     */
    generateFinalResponse(synthesizedResult, requestId, startTime) {
        const totalTime = Date.now() - startTime;
        
        return {
            requestId,
            status: synthesizedResult.status,
            confidence: synthesizedResult.confidence,
            message: this.generateUserMessage(synthesizedResult),
            decisions: synthesizedResult.decisions,
            recommendations: synthesizedResult.recommendations,
            riskFactors: synthesizedResult.riskFactors,
            rationale: synthesizedResult.rationale,
            executionSummary: {
                ...synthesizedResult.executionSummary,
                totalPipelineTime: totalTime
            },
            metadata: {
                timestamp: new Date().toISOString(),
                pipelineVersion: '2.0-enhanced',
                features: {
                    parallelExecution: this.config.enableParallelExecution,
                    caching: this.config.enableCaching,
                    monitoring: this.config.enableMonitoring
                }
            }
        };
    }

    /**
     * Handle orchestration errors
     */
    handleOrchestrationError(error, requestId, startTime) {
        const totalTime = Date.now() - startTime;
        
        return {
            requestId,
            status: 'error',
            confidence: 0,
            message: 'An error occurred during request processing',
            error: {
                type: error.constructor.name,
                message: error.message,
                stack: error.stack
            },
            executionSummary: {
                totalPipelineTime: totalTime,
                successfulAgents: 0,
                failedAgents: 0,
                error: true
            },
            metadata: {
                timestamp: new Date().toISOString(),
                pipelineVersion: '2.0-enhanced',
                errorHandling: 'enhanced'
            }
        };
    }

    // Helper methods for complexity analysis
    analyzeUrgency(message) {
        const urgencyKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately'];
        const urgencyCount = urgencyKeywords.filter(keyword => 
            message.toLowerCase().includes(keyword)
        ).length;
        return Math.min(urgencyCount / 2, 1); // Scale to 0-1
    }

    detectMultiClient(message) {
        const clientKeywords = ['pfizer', 'novartis', 'roche', 'merck', 'astrazeneca', 'sanofi', 'toyota', 'honda', 'ford'];
        const foundClients = clientKeywords.filter(client => 
            message.toLowerCase().includes(client.toLowerCase())
        );
        return foundClients.length >= 2;
    }

    detectCompetitiveIndustry(message) {
        const competitiveKeywords = ['pharmaceutical', 'automotive', 'technology', 'banking', 'healthcare'];
        return competitiveKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
    }

    detectHighRiskTool(message) {
        const highRiskTools = ['midjourney', 'dall-e', 'stable-diffusion', 'runway', 'custom', 'unknown'];
        return highRiskTools.some(tool => 
            message.toLowerCase().includes(tool.toLowerCase())
        );
    }

    detectRegulatoryRequirements(message) {
        const regulatoryKeywords = ['fda', 'gdpr', 'hipaa', 'sox', 'compliance', 'regulatory'];
        return regulatoryKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
    }

    analyzeDataSensitivity(message) {
        const sensitiveKeywords = ['ssn', 'medical', 'phi', 'pii', 'customer data', 'financial'];
        const sensitiveCount = sensitiveKeywords.filter(keyword => 
            message.toLowerCase().includes(keyword)
        ).length;
        return Math.min(sensitiveCount / 3, 1); // Scale to 0-1
    }

    analyzeTimeConstraints(context) {
        if (context.deadline) {
            const deadline = new Date(context.deadline);
            const now = new Date();
            const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
            return hoursUntilDeadline < 24 ? 1 : hoursUntilDeadline < 72 ? 0.5 : 0;
        }
        return 0;
    }

    estimateProcessingTime(complexityScore) {
        return Math.max(1000, complexityScore * 500); // 0.5-5 seconds
    }

    // Helper methods for agent execution
    prepareAgentInput(agentName, userMessage, context) {
        const baseInput = {
            message: userMessage,
            timestamp: new Date().toISOString(),
            ...context
        };
        
        // Customize input based on agent type
        switch (agentName) {
            case 'context':
                return { userMessage, ...context };
            case 'policy':
                return { tool: context.tool, vendor: context.vendor, usage: context.usage, ...baseInput };
            case 'audit':
                return { action: 'audit', ...baseInput };
            default:
                return baseInput;
        }
    }

    getAgentPriority(agentName) {
        const priorities = {
            'context': 1,
            'policy': 2,
            'audit': 3,
            'negotiation': 4,
            'conflict-detection': 5
        };
        return priorities[agentName] || 10;
    }

    getAgentTimeout(agentName) {
        const timeouts = {
            'context': 5000,
            'policy': 10000,
            'audit': 15000,
            'negotiation': 20000,
            'conflict-detection': 10000
        };
        return timeouts[agentName] || this.config.defaultTimeout;
    }

    // Helper methods for result synthesis
    extractDecisions(successfulAgents) {
        const decisions = {};
        successfulAgents.forEach(agent => {
            if (agent.result?.decision) {
                decisions[agent.agentName] = agent.result.decision;
            }
        });
        return decisions;
    }

    extractRecommendations(successfulAgents) {
        const recommendations = [];
        successfulAgents.forEach(agent => {
            if (agent.result?.recommendations) {
                recommendations.push(...agent.result.recommendations);
            }
        });
        return [...new Set(recommendations)]; // Remove duplicates
    }

    extractRiskFactors(successfulAgents) {
        const riskFactors = [];
        successfulAgents.forEach(agent => {
            if (agent.result?.risk?.factors) {
                riskFactors.push(...agent.result.risk.factors);
            }
        });
        return [...new Set(riskFactors)]; // Remove duplicates
    }

    calculateOverallConfidence(successful, failed) {
        if (successful.length === 0) return 0;
        
        const totalConfidence = successful.reduce((sum, agent) => {
            const confidence = agent.result?.confidence || agent.result?.context?.confidence || 0.5;
            return sum + confidence;
        }, 0);
        
        const failurePenalty = failed.length * 0.1;
        return Math.max(0, Math.min(1, (totalConfidence / successful.length) - failurePenalty));
    }

    determineFinalStatus(decisions, failed, complexityAnalysis) {
        if (failed.length > 0) return 'requires_human_review';
        
        const policyDecision = decisions.policy?.decision || decisions.policy?.status;
        if (policyDecision === 'rejected') return 'rejected';
        if (policyDecision === 'conditional') return 'conditional_approval';
        if (policyDecision === 'approved') return 'approved';
        
        return 'requires_human_review';
    }

    generateSynthesisRationale(successful, failed, decisions) {
        const rationale = [];
        
        if (successful.length > 0) {
            rationale.push(`Analysis completed by ${successful.length} agents: ${successful.map(a => a.agentName).join(', ')}`);
        }
        
        if (failed.length > 0) {
            rationale.push(`Agent failures requiring human review: ${failed.map(a => a.agentName).join(', ')}`);
        }
        
        const policyDecision = decisions.policy?.decision || decisions.policy?.status;
        if (policyDecision) {
            rationale.push(`Policy evaluation: ${policyDecision}`);
        }
        
        return rationale.join('; ');
    }

    generateUserMessage(synthesizedResult) {
        const { status, confidence, recommendations } = synthesizedResult;
        
        let message = `Request ${status.replace('_', ' ')}`;
        
        if (confidence > 0.8) {
            message += ' with high confidence';
        } else if (confidence > 0.5) {
            message += ' with moderate confidence';
        } else {
            message += ' - human review recommended';
        }
        
        if (recommendations.length > 0) {
            message += `. Key recommendations: ${recommendations.slice(0, 2).join(', ')}`;
        }
        
        return message;
    }

    // Performance tracking
    startPerformanceTracking() {
        setInterval(() => {
            this.recordSystemMetrics();
        }, 30000); // Every 30 seconds
    }

    recordPerformanceMetrics(requestId, startTime, agentResults, synthesizedResult) {
        const totalTime = Date.now() - startTime;
        
        this.performanceHistory.push({
            requestId,
            totalTime,
            agentCount: agentResults.agentResults?.length || 0,
            successfulAgents: agentResults.agentResults?.filter(r => r.success).length || 0,
            confidence: synthesizedResult.confidence,
            status: synthesizedResult.status,
            timestamp: Date.now()
        });
        
        // Keep only last 1000 records
        if (this.performanceHistory.length > 1000) {
            this.performanceHistory = this.performanceHistory.slice(-1000);
        }
    }

    recordSystemMetrics() {
        const metrics = this.registry.getMetrics();
        console.log('📊 System Metrics:', {
            totalRequests: metrics.monitoring.performance.totalOperations,
            averageResponseTime: metrics.monitoring.performance.averageResponseTime,
            errorRate: metrics.monitoring.performance.errorRate,
            cacheHitRate: metrics.cache.hitRate
        });
    }

    generateRequestId() {
        return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public API methods
    getPerformanceMetrics() {
        return {
            registry: this.registry.getMetrics(),
            pipeline: {
                totalRequests: this.performanceHistory.length,
                averageResponseTime: this.performanceHistory.reduce((sum, r) => sum + r.totalTime, 0) / this.performanceHistory.length,
                successRate: this.performanceHistory.filter(r => r.status !== 'error').length / this.performanceHistory.length,
                recentRequests: this.performanceHistory.slice(-10)
            }
        };
    }

    getAgentHealth() {
        return this.registry.getAgentHealth();
    }

    async clearCache() {
        return await this.registry.clearCache();
    }

    resetCircuitBreakers() {
        this.registry.resetCircuitBreakers();
    }
}

module.exports = EnhancedOrchestrationPipeline;