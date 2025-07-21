/**
 * Context Agent - Handles urgent user requests with intelligent context awareness
 * 
 * Scenario: User says "Need to use ChatGPT for Monday's presentation!!!"
 * 
 * Features:
 * 1. Urgency and emotion recognition
 * 2. Context inference based on user profile and timing
 * 3. Smart clarifying questions
 * 4. Structured responses with confidence levels
 */

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
     * This is what the workflow engine expects to call
     */
    async process(input, context) {
        // Extract the content from the input - ensure it's always a string
        let content;
        if (typeof input === 'string') {
            content = input;
        } else if (input && typeof input === 'object') {
            content = input.content || input.message || input.userMessage || JSON.stringify(input);
        } else {
            content = String(input || '');
        }
        
        // Ensure content is a string
        if (typeof content !== 'string') {
            content = String(content);
        }
        
        console.log('🔍 ContextAgent.process() received content:', content);
        
        // Use the existing analyzeContext method
        const result = this.analyzeContext(content, context);
        
        // Return in the format the WorkflowEngine expects
        return {
            analysis: result.fullAnalysis || result,
            confidence: result.context?.confidence || 0.7,
            workflow: {
                name: 'standard-review', // Default workflow
                reasoning: 'Standard workflow selected based on context analysis'
            },
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