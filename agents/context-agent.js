/**
 * Context Agent - Handles urgent user requests with intelligent context awareness
 * 
 * Scenario: User says "Need to use ChatGPT for Monday's presentation!!!"
 * 
 * Features:
 * 1. Urgency and emotion recognition (AI-enhanced)
 * 2. Context inference based on user profile and timing (AI-enhanced)
 * 3. Smart clarifying questions (AI-powered)
 * 4. Structured responses with confidence levels
 * 5. Industry-specific risk analysis (AI-powered)
 */

const { analyzeWithAI } = require('./ai-services');

class ContextAgent {
    constructor() {
        this.userContext = {
            role: 'marketing agency employee',
            currentTime: new Date('2024-01-19T16:00:00'), // Friday 4pm
            presentationDate: new Date('2024-01-22T10:00:00'), // Monday 10am
            urgencyLevel: 0,
            inferredContext: null,
            confidence: 0
        };
        
        // AI Enhancement Configuration
        this.aiConfig = {
            enabled: true,
            fallbackToRules: true,
            confidenceBoost: 0.1,
            industrySpecific: true,
            workflowOptimization: true
        };
        
        this.presentationTypes = {
            'client_presentation': {
                keywords: ['client', 'pitch', 'proposal', 'deliverable'],
                confidence: 0.8,
                clarifyingQuestion: "Is this for the Johnson & Co. quarterly review we've been prepping?"
            },
            'internal_review': {
                keywords: ['team', 'internal', 'review', 'update'],
                confidence: 0.6,
                clarifyingQuestion: "Is this for the Monday team sync on Q1 campaigns?"
            },
            'creative_pitch': {
                keywords: ['creative', 'concept', 'idea', 'design'],
                confidence: 0.7,
                clarifyingQuestion: "Are you finalizing the creative concepts for the new product launch?"
            },
            'data_analysis': {
                keywords: ['data', 'analytics', 'metrics', 'report'],
                confidence: 0.5,
                clarifyingQuestion: "Do you need help with the campaign performance data for Monday's review?"
            }
        };

        // Industry-specific risk patterns (enhanced with AI learning)
        this.industryPatterns = {
            pharmaceutical: {
                competitors: ['pfizer', 'novartis', 'roche', 'merck', 'astrazeneca', 'sanofi'],
                riskFactors: ['competitive intelligence', 'regulatory compliance', 'medical accuracy'],
                workflowPreference: 'medical-content-review'
            },
            automotive: {
                competitors: ['toyota', 'honda', 'ford', 'gm', 'volkswagen'],
                riskFactors: ['safety claims', 'emissions standards', 'competitive positioning'],
                workflowPreference: 'standard-review'
            },
            technology: {
                competitors: ['apple', 'google', 'microsoft', 'amazon', 'samsung'],
                riskFactors: ['data privacy', 'intellectual property', 'market disruption'],
                workflowPreference: 'high-risk-review'
            }
        };
    }

    /**
     * Main entry point - processes user input and returns structured response
     */
    processUserInput(userMessage) {
        console.log(`🎯 Context Agent Processing: "${userMessage}"`);
        
        // 1. Analyze urgency and emotion
        const urgencyAnalysis = this.analyzeUrgency(userMessage);
        
        // 2. Infer presentation context
        const contextInference = this.inferContext(userMessage);
        
        // 3. Generate smart clarifying question
        const clarifyingQuestion = this.generateClarifyingQuestion(contextInference);
        
        // 4. Build structured response
        const response = this.buildStructuredResponse(urgencyAnalysis, contextInference, clarifyingQuestion);
        
        return response;
    }

    /**
     * NEW METHOD: Wrapper for routes.js compatibility
     * This is what routes.js expects to call
     */
    analyzeContext(content, contextType) {
        // Use the existing processUserInput method
        const result = this.processUserInput(content);
        
        // Format the response to match what routes.js expects
        return {
            context: result.context,
            relevanceScore: result.context.confidence || 0.7,
            relatedPolicies: this.getRelatedPolicies(result.context.inferredType),
            explanation: `Context analysis completed with ${(result.context.confidence * 100).toFixed(0)}% confidence`,
            // Include the full result for additional data
            fullAnalysis: result
        };
    }

    /**
     * Standard process method for WorkflowEngine compatibility
     * Enhanced with AI analysis for deeper insights
     */
    async process(input, context) {
        // TEMPORARY DEBUG - see what we're actually getting
        console.log('🐛 DEBUG: input type =', typeof input);
        console.log('🐛 DEBUG: input =', JSON.stringify(input, null, 2));
        console.log('🐛 DEBUG: context =', JSON.stringify(context, null, 2));
        
        // Check if this is already a processed ContextAgent result
        if (input && typeof input === 'object' && 
            input.timestamp && input.urgency && input.context && input.recommendations) {
            console.log('✅ DETECTED: Input is already a processed ContextAgent result - returning as-is');
            return {
                analysis: input,
                confidence: input.context?.confidence || 0.7,
                workflow: {
                    name: 'standard-review',
                    reasoning: 'Using pre-processed context analysis'
                },
                enrichedContext: context,
                skipReprocessing: true
            };
        }
        
        // Extract the content from the input - ensure it's always a string
        let content;
        if (typeof input === 'string') {
            content = input;
        } else if (input && typeof input === 'object') {
            // Try to find the original user message in the input object
            content = input.content || 
                     input.message || 
                     input.userMessage || 
                     input.text || 
                     input.query ||
                     input.originalMessage ||
                     input.prompt;
                     
            if (!content) {
                console.log('🚨 WARNING: Could not find user message in input object');
                content = "Unable to extract user message - please check WorkflowEngine input format";
            }
        } else {
            content = String(input || 'Unknown request');
        }
        
        console.log('🔍 ContextAgent.process() extracted content:', content);
        
        // ENHANCED: Add AI analysis for deeper insights
        const aiEnhancedAnalysis = await this.enhanceWithAI(content);
        
        // Call processUserInput directly to avoid circular loop
        const result = this.processUserInput(content);
        
        // Enhance the result with AI insights
        if (aiEnhancedAnalysis) {
            result.aiInsights = aiEnhancedAnalysis;
            result.context.confidence = Math.min(result.context.confidence + 0.1, 1.0); // AI boosts confidence
        }
        
        // Determine workflow path with AI assistance
        const workflowDecision = this.determineWorkflowWithAI(result, aiEnhancedAnalysis);
        
        // Return in the format the WorkflowEngine expects
        return {
            analysis: result,
            confidence: result.context?.confidence || 0.7,
            workflow: workflowDecision,
            aiInsights: aiEnhancedAnalysis,
            enrichedContext: context
        };
    }

    /**
     * Get related policies based on inferred context
     */
    getRelatedPolicies(contextType) {
        const policyMap = {
            'client_presentation': [
                'Client Communication Policy',
                'AI Usage in Client Materials',
                'Brand Guidelines Compliance'
            ],
            'internal_review': [
                'Internal Communication Standards',
                'Team Collaboration Policy'
            ],
            'creative_pitch': [
                'Creative Content Guidelines',
                'AI-Generated Creative Policy',
                'Intellectual Property Guidelines'
            ],
            'data_analysis': [
                'Data Privacy Policy',
                'Analytics Best Practices',
                'Client Data Handling'
            ]
        };
        
        return policyMap[contextType] || ['General AI Usage Policy'];
    }

    /**
     * Analyzes urgency and emotional intensity from user message
     */
    analyzeUrgency(message) {
        const urgencyIndicators = {
            exclamationMarks: (message.match(/!/g) || []).length,
            urgencyWords: ['urgent', 'asap', 'emergency', 'critical', 'deadline'],
            timePressure: this.calculateTimePressure()
        };

        let urgencyScore = 0;
        
        // Exclamation marks (0-3 scale)
        urgencyScore += Math.min(urgencyIndicators.exclamationMarks, 3) * 0.3;
        
        // Urgency words
        const urgencyWordCount = urgencyIndicators.urgencyWords.filter(word => 
            message.toLowerCase().includes(word)
        ).length;
        urgencyScore += urgencyWordCount * 0.2;
        
        // Time pressure (weekend before Monday presentation)
        urgencyScore += urgencyIndicators.timePressure * 0.5;
        
        this.userContext.urgencyLevel = Math.min(urgencyScore, 1);
        
        return {
            level: this.userContext.urgencyLevel,
            indicators: urgencyIndicators,
            emotionalState: this.determineEmotionalState(urgencyScore)
        };
    }

    /**
     * Calculates time pressure based on current time vs presentation deadline
     */
    calculateTimePressure() {
        const now = this.userContext.currentTime;
        const presentation = this.userContext.presentationDate;
        const timeDiff = presentation.getTime() - now.getTime();
        const hoursUntilDeadline = timeDiff / (1000 * 60 * 60);
        
        // High pressure: < 48 hours, Medium: 48-72 hours, Low: > 72 hours
        if (hoursUntilDeadline < 48) return 0.9;
        if (hoursUntilDeadline < 72) return 0.6;
        return 0.3;
    }

    /**
     * Determines emotional state based on urgency score
     */
    determineEmotionalState(urgencyScore) {
        if (urgencyScore > 0.8) return 'panicked';
        if (urgencyScore > 0.6) return 'stressed';
        if (urgencyScore > 0.4) return 'concerned';
        return 'calm';
    }

    /**
     * Infers presentation context based on user role, timing, and message content
     */
    inferContext(message) {
        const context = {
            type: null,
            confidence: 0,
            reasoning: []
        };

        // Analyze message content for keywords
        const messageLower = message.toLowerCase();
        
        // Check each presentation type
        for (const [type, config] of Object.entries(this.presentationTypes)) {
            const keywordMatches = config.keywords.filter(keyword => 
                messageLower.includes(keyword)
            ).length;
            
            if (keywordMatches > 0) {
                const score = (keywordMatches / config.keywords.length) * config.confidence;
                if (score > context.confidence) {
                    context.type = type;
                    context.confidence = score;
                    context.reasoning.push(`Matched ${keywordMatches} keywords for ${type}`);
                }
            }
        }

        // Apply role-based context if no strong keyword match
        if (context.confidence < 0.4) {
            context.type = 'client_presentation'; // Default for marketing agency
            context.confidence = 0.6;
            context.reasoning.push('Inferred client presentation based on marketing agency role');
        }

        // Apply timing-based context
        if (this.isWeekendBeforeMonday()) {
            context.confidence += 0.1;
            context.reasoning.push('Weekend before Monday presentation increases confidence');
        }

        this.userContext.inferredContext = context;
        this.userContext.confidence = context.confidence;
        
        return context;
    }

    /**
     * Checks if current time is weekend before Monday presentation
     */
    isWeekendBeforeMonday() {
        const dayOfWeek = this.userContext.currentTime.getDay();
        return dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
    }

    /**
     * Generates a smart clarifying question based on inferred context
     */
    generateClarifyingQuestion(contextInference) {
        if (contextInference.type && this.presentationTypes[contextInference.type]) {
            return this.presentationTypes[contextInference.type].clarifyingQuestion;
        }
        
        // Fallback questions based on confidence level
        if (contextInference.confidence > 0.7) {
            return "Are you finalizing the presentation content or just need help with specific sections?";
        } else if (contextInference.confidence > 0.5) {
            return "Is this for a client meeting or internal review on Monday?";
        } else {
            return "What type of presentation are you working on for Monday?";
        }
    }

    /**
     * Builds the final structured response
     */
    buildStructuredResponse(urgencyAnalysis, contextInference, clarifyingQuestion) {
        const response = {
            timestamp: new Date().toISOString(),
            urgency: {
                level: urgencyAnalysis.level,
                emotionalState: urgencyAnalysis.emotionalState,
                timePressure: this.calculateTimePressure()
            },
            context: {
                inferredType: contextInference.type,
                confidence: contextInference.confidence,
                reasoning: contextInference.reasoning
            },
            clarification: {
                question: clarifyingQuestion,
                purpose: 'refine_context_and_urgency'
            },
            recommendations: this.generateRecommendations(urgencyAnalysis, contextInference),
            nextSteps: this.generateNextSteps(urgencyAnalysis.level)
        };

        return response;
    }

    /**
     * Generates recommendations based on urgency and context
     */
    generateRecommendations(urgencyAnalysis, contextInference) {
        const recommendations = [];
        
        if (urgencyAnalysis.level > 0.8) {
            recommendations.push({
                priority: 'high',
                action: 'Start with ChatGPT immediately for content generation',
                reasoning: 'High urgency detected - immediate action needed'
            });
        }
        
        if (contextInference.type === 'client_presentation') {
            recommendations.push({
                priority: 'medium',
                action: 'Focus on professional tone and client-specific insights',
                reasoning: 'Client presentation requires polished, professional content'
            });
        }
        
        if (this.calculateTimePressure() > 0.7) {
            recommendations.push({
                priority: 'high',
                action: 'Consider working through weekend or delegating tasks',
                reasoning: 'Limited time before Monday deadline'
            });
        }
        
        return recommendations;
    }

    /**
     * AI-ENHANCED: Uses AI to provide deeper context analysis
     * This is the core AI value-add for aicomplyr.io
     */
    async enhanceWithAI(content) {
        const aiPrompt = `Analyze this urgent business request for comprehensive insights:

"${content}"

Provide detailed analysis on:
1. Hidden urgency indicators and stress signals
2. Industry-specific risks and compliance requirements  
3. Client relationship complexities and competitive dynamics
4. Regulatory frameworks that may apply
5. Recommended workflow complexity level (express-lane, standard-review, medical-content-review, high-risk-review)
6. Potential escalation triggers
7. Business impact assessment

Focus on pharmaceutical industry nuances, competitive client relationships, and AI tool governance.`;
        
        try {
            const aiResult = await analyzeWithAI(aiPrompt);
            console.log('🤖 AI Enhancement completed for context analysis');
            return {
                aiAnalysis: aiResult,
                enhancementApplied: true,
                industryInsights: this.extractIndustryInsights(aiResult),
                riskIndicators: this.extractRiskIndicators(aiResult),
                workflowRecommendation: this.extractWorkflowRecommendation(aiResult)
            };
        } catch (error) {
            console.error('🚨 AI enhancement failed, using rule-based analysis:', error.message);
            return {
                aiAnalysis: null,
                enhancementApplied: false,
                fallbackReason: error.message,
                industryInsights: [],
                riskIndicators: [],
                workflowRecommendation: 'standard-review'
            };
        }
    }

    /**
     * AI-ENHANCED: Determines optimal workflow path using AI insights
     */
    determineWorkflowWithAI(ruleBasedResult, aiEnhancedAnalysis) {
        // Start with rule-based workflow decision
        let workflowName = 'standard-review';
        let reasoning = 'Standard workflow selected based on rule-based analysis';
        
        // Enhance with AI insights if available
        if (aiEnhancedAnalysis && aiEnhancedAnalysis.enhancementApplied) {
            const aiWorkflow = aiEnhancedAnalysis.workflowRecommendation;
            
            // AI recommends more complex workflow
            if (aiWorkflow === 'high-risk-review' && ruleBasedResult.urgency.level > 0.7) {
                workflowName = 'high-risk-review';
                reasoning = 'AI detected high-risk scenario requiring comprehensive review';
            } else if (aiWorkflow === 'medical-content-review' && this.detectsMedicalContent(ruleBasedResult)) {
                workflowName = 'medical-content-review';
                reasoning = 'AI identified medical/pharmaceutical content requiring specialized review';
            } else if (aiWorkflow === 'express-lane' && ruleBasedResult.urgency.level < 0.4) {
                workflowName = 'express-lane';
                reasoning = 'AI confirmed low-risk scenario suitable for fast-track processing';
            }
        }
        
        // Override for pharmaceutical competitive scenarios
        if (this.detectsPharmaceuticalCompetitors(ruleBasedResult)) {
            workflowName = 'high-risk-review';
            reasoning = 'Competing pharmaceutical clients detected - requires enhanced oversight';
        }
        
        return {
            name: workflowName,
            reasoning: reasoning,
            aiEnhanced: aiEnhancedAnalysis?.enhancementApplied || false,
            confidenceScore: this.calculateWorkflowConfidence(ruleBasedResult, aiEnhancedAnalysis)
        };
    }

    /**
     * AI-ENHANCED: Extract industry-specific insights from AI analysis
     */
    extractIndustryInsights(aiResult) {
        if (!aiResult) return [];
        
        // Look for pharmaceutical, regulatory, and compliance keywords in AI response
        const insights = [];
        const aiText = aiResult.toLowerCase();
        
        if (aiText.includes('pharmaceutical') || aiText.includes('pharma') || aiText.includes('drug')) {
            insights.push({
                type: 'industry_detection',
                insight: 'Pharmaceutical industry context detected',
                implications: ['FDA compliance required', 'Medical accuracy critical', 'Competitive intelligence risks']
            });
        }
        
        if (aiText.includes('competitor') || aiText.includes('competing') || aiText.includes('rival')) {
            insights.push({
                type: 'competitive_dynamics',
                insight: 'Competitive client relationships identified',
                implications: ['Information segregation required', 'Conflict of interest protocols', 'Enhanced monitoring needed']
            });
        }
        
        if (aiText.includes('regulatory') || aiText.includes('compliance') || aiText.includes('fda')) {
            insights.push({
                type: 'regulatory_framework',
                insight: 'Regulatory compliance requirements detected',
                implications: ['Legal review recommended', 'Audit trail documentation', 'Approval workflows required']
            });
        }
        
        return insights;
    }

    /**
     * AI-ENHANCED: Extract risk indicators from AI analysis
     */
    extractRiskIndicators(aiResult) {
        if (!aiResult) return [];
        
        const indicators = [];
        const aiText = aiResult.toLowerCase();
        
        // High-risk indicators
        if (aiText.includes('high risk') || aiText.includes('critical') || aiText.includes('urgent escalation')) {
            indicators.push({
                level: 'high',
                indicator: 'Critical business risk detected by AI',
                action: 'Immediate escalation recommended'
            });
        }
        
        // Medium-risk indicators  
        if (aiText.includes('medium risk') || aiText.includes('moderate') || aiText.includes('caution')) {
            indicators.push({
                level: 'medium', 
                indicator: 'Moderate risk factors identified',
                action: 'Enhanced monitoring and approval required'
            });
        }
        
        // Competitive risks
        if (aiText.includes('competitive') && aiText.includes('conflict')) {
            indicators.push({
                level: 'high',
                indicator: 'Competitive conflict risk',
                action: 'Implement strict information segregation'
            });
        }
        
        return indicators;
    }

    /**
     * AI-ENHANCED: Extract workflow recommendation from AI analysis
     */
    extractWorkflowRecommendation(aiResult) {
        if (!aiResult) return 'standard-review';
        
        const aiText = aiResult.toLowerCase();
        
        if (aiText.includes('high-risk-review') || aiText.includes('comprehensive review')) {
            return 'high-risk-review';
        }
        if (aiText.includes('medical-content-review') || aiText.includes('medical review')) {
            return 'medical-content-review';
        }
        if (aiText.includes('express-lane') || aiText.includes('fast-track')) {
            return 'express-lane';
        }
        
        return 'standard-review';
    }

    /**
     * Helper: Detect medical/pharmaceutical content
     */
    detectsMedicalContent(result) {
        const content = result.recommendations?.map(r => r.action).join(' ') || '';
        return content.toLowerCase().includes('medical') || 
               content.toLowerCase().includes('pharmaceutical') ||
               content.toLowerCase().includes('drug');
    }

    /**
     * Helper: Detect pharmaceutical competitors in the analysis
     */
    detectsPharmaceuticalCompetitors(result) {
        const content = JSON.stringify(result).toLowerCase();
        const pharmaCompanies = ['pfizer', 'novartis', 'roche', 'merck', 'astrazeneca', 'sanofi'];
        let companiesFound = 0;
        
        pharmaCompanies.forEach(company => {
            if (content.includes(company)) companiesFound++;
        });
        
        return companiesFound >= 2; // Multiple pharma companies = competitive scenario
    }

    /**
     * Helper: Calculate confidence score for workflow decision
     */
    calculateWorkflowConfidence(ruleBasedResult, aiEnhancedAnalysis) {
        let confidence = ruleBasedResult.context.confidence || 0.7;
        
        if (aiEnhancedAnalysis && aiEnhancedAnalysis.enhancementApplied) {
            confidence = Math.min(confidence + 0.15, 1.0); // AI adds confidence
        }
        
        if (aiEnhancedAnalysis && aiEnhancedAnalysis.riskIndicators.length > 0) {
            confidence = Math.min(confidence + 0.1, 1.0); // Risk detection adds confidence
        }
        
        return Math.round(confidence * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Generates next steps based on urgency level
     */
    generateNextSteps(urgencyLevel) {
        if (urgencyLevel > 0.8) {
            return [
                'Immediately open ChatGPT',
                'Start with presentation outline',
                'Set aside 2-3 hours for focused work'
            ];
        } else if (urgencyLevel > 0.6) {
            return [
                'Plan ChatGPT session for today',
                'Gather presentation requirements',
                'Allocate 1-2 hours for content creation'
            ];
        } else {
            return [
                'Schedule ChatGPT session for this weekend',
                'Review presentation requirements',
                'Plan content structure'
            ];
        }
    }
}

// Wrapper function for backend API
function processContext(userMessage) {
    const agent = new ContextAgent();
    return agent.processUserInput(userMessage);
}

// Test the Context Agent
function testContextAgent() {
    const agent = new ContextAgent();
    
    console.log('🧪 Testing Context Agent...\n');
    
    const testMessage = "Need to use ChatGPT for Monday's presentation!!!";
    const response = agent.processUserInput(testMessage);
    
    console.log('📊 STRUCTURED RESPONSE:');
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n🎯 KEY INSIGHTS:');
    console.log(`Urgency Level: ${response.urgency.level.toFixed(2)} (${response.urgency.emotionalState})`);
    console.log(`Inferred Context: ${response.context.inferredType} (${(response.context.confidence * 100).toFixed(0)}% confidence)`);
    console.log(`Clarifying Question: "${response.clarification.question}"`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    response.recommendations.forEach(rec => {
        console.log(`- ${rec.action} (${rec.priority} priority)`);
    });
    
    console.log('\n📋 NEXT STEPS:');
    response.nextSteps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContextAgent;
}

// Run test if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
    testContextAgent();
}