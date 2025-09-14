/**
 * Enhanced Policy Agent with Document Processing Integration
 * Combines AI-powered policy analysis with deterministic document processing
 * Addresses the precision issues mentioned in the hackathon article
 */

const AgentBase = require('./agent-base');
const documentProcessingService = require('../api/services/document-processing');

class EnhancedPolicyAgent extends AgentBase {
    constructor() {
        super('EnhancedPolicyAgent');
        this.confidenceThreshold = 0.7; // Require human review below this
        this.deterministicRules = this.loadDeterministicRules();
    }

    /**
     * Process policy with enhanced document processing and validation
     * @param {Object} data - Input data containing policy information
     * @returns {Object} Enhanced policy analysis with confidence scoring
     */
    async process(data) {
        try {
            console.log('🔍 Enhanced Policy Agent processing request');
            
            // Step 1: Extract and validate input
            const validatedInput = await this.validateInput(data);
            
            // Step 2: Process documents if present
            let documentAnalysis = null;
            if (data.document) {
                documentAnalysis = await this.processDocument(data.document);
            }
            
            // Step 3: Run AI-powered analysis
            const aiAnalysis = await this.runAIAnalysis(validatedInput, documentAnalysis);
            
            // Step 4: Apply deterministic validation
            const validatedAnalysis = await this.applyDeterministicValidation(aiAnalysis, documentAnalysis);
            
            // Step 5: Calculate final confidence and determine if human review needed
            const finalResult = await this.calculateFinalResult(validatedAnalysis);
            
            // Step 6: Log decision for audit trail
            await this.logDecision(finalResult, data);
            
            return finalResult;
            
        } catch (error) {
            console.error('Enhanced Policy Agent error:', error);
            
            // Fallback to deterministic rules if AI fails
            return await this.deterministicFallback(data, error);
        }
    }

    /**
     * Validate input data structure and content
     */
    async validateInput(data) {
        const requiredFields = ['tool', 'usage', 'dataHandling'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate data types and formats
        const validatedData = {
            tool: this.validateTool(data.tool),
            usage: this.validateUsage(data.usage),
            dataHandling: this.validateDataHandling(data.dataHandling),
            urgencyLevel: data.contextOutput?.urgency?.level || 0.5,
            enterpriseId: data.enterpriseId,
            workspaceId: data.workspaceId,
            metadata: data.metadata || {}
        };

        return validatedData;
    }

    /**
     * Process policy documents using document AI
     */
    async processDocument(documentData) {
        try {
            console.log('📄 Processing policy document with Document AI');
            
            const result = await documentProcessingService.processDocument(
                documentData.buffer,
                documentData.mimeType,
                {
                    includeAIAnalysis: true,
                    analysisType: 'policy',
                    metadata: {
                        enterpriseId: documentData.enterpriseId,
                        workspaceId: documentData.workspaceId
                    }
                }
            );

            return {
                extractedText: result.text,
                entities: result.entities,
                confidence: result.confidence,
                processingMethod: result.processingMethod,
                aiAnalysis: result.aiAnalysis,
                metadata: result.metadata
            };
            
        } catch (error) {
            console.warn('Document processing failed:', error.message);
            return null;
        }
    }

    /**
     * Run AI-powered policy analysis
     */
    async runAIAnalysis(validatedInput, documentAnalysis) {
        console.log('🤖 Running AI-powered policy analysis');
        
        // Combine input data with document analysis
        const analysisInput = {
            ...validatedInput,
            documentContent: documentAnalysis?.extractedText,
            documentEntities: documentAnalysis?.entities,
            documentConfidence: documentAnalysis?.confidence
        };

        // Calculate risk factors
        const riskFactors = await this.calculateRiskFactors(analysisInput);
        
        // Determine compliance requirements
        const complianceRequirements = await this.determineComplianceRequirements(analysisInput);
        
        // Generate decision reasoning
        const decisionReasoning = await this.generateDecisionReasoning(analysisInput, riskFactors);
        
        // Calculate AI confidence
        const aiConfidence = await this.calculateAIConfidence(analysisInput, riskFactors);

        return {
            riskFactors,
            complianceRequirements,
            decisionReasoning,
            aiConfidence,
            analysisInput,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Apply deterministic validation to AI analysis
     */
    async applyDeterministicValidation(aiAnalysis, documentAnalysis) {
        console.log('✅ Applying deterministic validation');
        
        const validation = {
            riskScore: this.calculateDeterministicRiskScore(aiAnalysis),
            complianceCheck: this.performDeterministicComplianceCheck(aiAnalysis),
            consistencyCheck: this.performConsistencyCheck(aiAnalysis, documentAnalysis),
            ruleViolations: this.checkRuleViolations(aiAnalysis)
        };

        // Adjust confidence based on validation results
        const validationConfidence = this.calculateValidationConfidence(validation);
        const adjustedConfidence = Math.min(aiAnalysis.aiConfidence, validationConfidence);

        return {
            ...aiAnalysis,
            validation,
            adjustedConfidence,
            validationPassed: validation.ruleViolations.length === 0
        };
    }

    /**
     * Calculate final result with confidence scoring
     */
    async calculateFinalResult(validatedAnalysis) {
        const confidence = validatedAnalysis.adjustedConfidence;
        const requiresHumanReview = confidence < this.confidenceThreshold || !validatedAnalysis.validationPassed;
        
        // Generate final decision
        const decision = this.generateFinalDecision(validatedAnalysis);
        
        // Create audit trail
        const auditTrail = this.createAuditTrail(validatedAnalysis);
        
        return {
            decision,
            confidence,
            requiresHumanReview,
            riskLevel: this.getRiskLevel(validatedAnalysis.riskFactors),
            complianceStatus: this.getComplianceStatus(validatedAnalysis.complianceRequirements),
            reasoning: validatedAnalysis.decisionReasoning,
            validation: validatedAnalysis.validation,
            auditTrail,
            timestamp: new Date().toISOString(),
            agentVersion: '2.0.0'
        };
    }

    /**
     * Deterministic fallback when AI fails
     */
    async deterministicFallback(data, error) {
        console.log('🛡️ Using deterministic fallback due to AI failure');
        
        const fallbackResult = {
            decision: 'REVIEW_REQUIRED',
            confidence: 0.5,
            requiresHumanReview: true,
            riskLevel: 'HIGH',
            complianceStatus: 'UNKNOWN',
            reasoning: 'AI analysis failed, human review required',
            fallbackReason: error.message,
            deterministicAnalysis: this.performDeterministicAnalysis(data),
            timestamp: new Date().toISOString(),
            agentVersion: '2.0.0-fallback'
        };

        await this.logDecision(fallbackResult, data);
        return fallbackResult;
    }

    // Helper methods for deterministic analysis
    calculateDeterministicRiskScore(aiAnalysis) {
        // Implement deterministic risk scoring based on known patterns
        let score = 0;
        
        if (aiAnalysis.riskFactors.includes('high_risk_tool')) score += 30;
        if (aiAnalysis.riskFactors.includes('sensitive_data')) score += 25;
        if (aiAnalysis.riskFactors.includes('external_sharing')) score += 20;
        if (aiAnalysis.riskFactors.includes('regulatory_concern')) score += 15;
        
        return Math.min(score, 100);
    }

    performDeterministicComplianceCheck(aiAnalysis) {
        const checks = {
            gdpr: this.checkGDPRCompliance(aiAnalysis),
            hipaa: this.checkHIPAACompliance(aiAnalysis),
            sox: this.checkSOXCompliance(aiAnalysis),
            industry: this.checkIndustryCompliance(aiAnalysis)
        };
        
        return {
            checks,
            overallCompliance: Object.values(checks).every(check => check.compliant),
            violations: Object.entries(checks)
                .filter(([_, check]) => !check.compliant)
                .map(([type, check]) => ({ type, issues: check.issues }))
        };
    }

    performConsistencyCheck(aiAnalysis, documentAnalysis) {
        // Check consistency between AI analysis and document analysis
        const inconsistencies = [];
        
        if (documentAnalysis && Math.abs(aiAnalysis.aiConfidence - documentAnalysis.confidence) > 0.3) {
            inconsistencies.push('Confidence score inconsistency');
        }
        
        return {
            consistent: inconsistencies.length === 0,
            inconsistencies
        };
    }

    checkRuleViolations(aiAnalysis) {
        const violations = [];
        
        // Check for known rule violations
        if (aiAnalysis.riskFactors.includes('prohibited_tool')) {
            violations.push('Use of prohibited tool detected');
        }
        
        if (aiAnalysis.complianceRequirements.includes('missing_approval')) {
            violations.push('Required approval missing');
        }
        
        return violations;
    }

    calculateValidationConfidence(validation) {
        let confidence = 1.0;
        
        // Reduce confidence for rule violations
        confidence -= validation.ruleViolations.length * 0.2;
        
        // Reduce confidence for consistency issues
        if (!validation.consistencyCheck.consistent) {
            confidence -= 0.3;
        }
        
        return Math.max(confidence, 0.1);
    }

    generateFinalDecision(validatedAnalysis) {
        if (!validatedAnalysis.validationPassed) {
            return 'REJECTED';
        }
        
        if (validatedAnalysis.adjustedConfidence >= 0.9) {
            return 'APPROVED';
        }
        
        if (validatedAnalysis.adjustedConfidence >= 0.7) {
            return 'CONDITIONAL_APPROVAL';
        }
        
        return 'REVIEW_REQUIRED';
    }

    getRiskLevel(riskFactors) {
        const highRiskFactors = ['prohibited_tool', 'sensitive_data', 'external_sharing'];
        const mediumRiskFactors = ['regulatory_concern', 'new_tool'];
        
        if (highRiskFactors.some(factor => riskFactors.includes(factor))) {
            return 'HIGH';
        }
        
        if (mediumRiskFactors.some(factor => riskFactors.includes(factor))) {
            return 'MEDIUM';
        }
        
        return 'LOW';
    }

    getComplianceStatus(complianceRequirements) {
        if (complianceRequirements.includes('missing_approval')) {
            return 'NON_COMPLIANT';
        }
        
        if (complianceRequirements.includes('conditional_approval')) {
            return 'CONDITIONAL';
        }
        
        return 'COMPLIANT';
    }

    createAuditTrail(validatedAnalysis) {
        return {
            aiConfidence: validatedAnalysis.aiConfidence,
            validationConfidence: validatedAnalysis.validation.validationConfidence,
            finalConfidence: validatedAnalysis.adjustedConfidence,
            riskFactors: validatedAnalysis.riskFactors,
            complianceRequirements: validatedAnalysis.complianceRequirements,
            validationResults: validatedAnalysis.validation,
            processingSteps: [
                'input_validation',
                'document_processing',
                'ai_analysis',
                'deterministic_validation',
                'confidence_calculation'
            ]
        };
    }

    // Placeholder methods for specific analysis functions
    async calculateRiskFactors(input) {
        // Implement AI-powered risk factor calculation
        return ['sensitive_data', 'new_tool'];
    }

    async determineComplianceRequirements(input) {
        // Implement AI-powered compliance requirement determination
        return ['gdpr_compliance', 'approval_required'];
    }

    async generateDecisionReasoning(input, riskFactors) {
        // Implement AI-powered decision reasoning generation
        return 'Based on analysis of tool usage and data handling practices...';
    }

    async calculateAIConfidence(input, riskFactors) {
        // Implement AI confidence calculation
        return 0.85;
    }

    // Deterministic rule methods
    loadDeterministicRules() {
        return {
            prohibitedTools: ['tool1', 'tool2'],
            sensitiveDataTypes: ['pii', 'phi', 'financial'],
            approvalThresholds: {
                high_risk: 0.9,
                medium_risk: 0.7,
                low_risk: 0.5
            }
        };
    }

    performDeterministicAnalysis(data) {
        return {
            riskScore: this.calculateDeterministicRiskScore({ riskFactors: [] }),
            complianceCheck: this.performDeterministicComplianceCheck({ riskFactors: [], complianceRequirements: [] }),
            ruleViolations: this.checkRuleViolations({ riskFactors: [], complianceRequirements: [] })
        };
    }

    // Validation helper methods
    validateTool(tool) {
        if (!tool || typeof tool !== 'string') {
            throw new Error('Invalid tool specification');
        }
        return tool.toLowerCase();
    }

    validateUsage(usage) {
        if (!usage || typeof usage !== 'string') {
            throw new Error('Invalid usage specification');
        }
        return usage;
    }

    validateDataHandling(dataHandling) {
        if (!dataHandling || typeof dataHandling !== 'string') {
            throw new Error('Invalid data handling specification');
        }
        return dataHandling;
    }

    // Compliance check methods
    checkGDPRCompliance(analysis) {
        return { compliant: true, issues: [] };
    }

    checkHIPAACompliance(analysis) {
        return { compliant: true, issues: [] };
    }

    checkSOXCompliance(analysis) {
        return { compliant: true, issues: [] };
    }

    checkIndustryCompliance(analysis) {
        return { compliant: true, issues: [] };
    }

    // Logging method
    async logDecision(result, input) {
        // Log decision to audit system
        console.log('📝 Logging policy decision:', {
            decision: result.decision,
            confidence: result.confidence,
            requiresHumanReview: result.requiresHumanReview,
            timestamp: result.timestamp
        });
    }
}

module.exports = EnhancedPolicyAgent;