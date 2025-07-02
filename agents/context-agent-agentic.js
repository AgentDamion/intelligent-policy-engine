/**
 * Agentic Context Agent - Real AI-powered context analysis
 * 
 * Replaces rule-based logic with gpt-3.5-turbo reasoning while maintaining
 * enterprise-grade structure and output format
 */

const OpenAI = require('openai');
require('dotenv').config();

class AgenticContextAgent {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        
        // Enterprise safety settings
        this.maxRetries = 3;
        this.timeout = 30000; // 30 seconds
        this.temperature = 0.2; // Low for consistent compliance decisions
        
        // Audit trail storage
        this.decisions = [];
    }

    /**
     * Main entry point - processes user input with real AI reasoning
     */
    async processContext(userMessage) {
        console.log(`🤖 Agentic Context Agent Processing: "${userMessage}"`);
        
        try {
            // 1. Build enterprise-grade prompt
            const prompt = this.buildCompliancePrompt(userMessage);
            
            // 2. Call gpt-3.5-turbo with safety controls
            const aiResponse = await this.callLLMWithSafety(prompt);
            
            // 3. Validate and structure response
            const structuredResponse = this.validateAndStructureResponse(aiResponse, userMessage);
            
            // 4. Add audit trail
            this.logDecision(userMessage, structuredResponse);
            
            console.log('🎯 Agentic Analysis Complete');
            return structuredResponse;
            
        } catch (error) {
            console.error('❌ Agentic processing failed:', error);
            // Fallback to rule-based analysis for reliability
            return this.fallbackAnalysis(userMessage);
        }
    }

    /**
     * Builds enterprise-grade prompt with context and constraints
     */
    buildCompliancePrompt(userMessage) {
        const currentTime = new Date();
        const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
        const timeOfDay = currentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        return `You are an AI governance expert analyzing urgent user requests for a pharmaceutical marketing agency.

CONTEXT:
- Current Time: ${dayOfWeek} ${timeOfDay}
- User Role: Marketing agency employee
- Industry: Pharmaceutical (high compliance requirements)
- Typical Deadline: Monday presentations

USER REQUEST: "${userMessage}"

ANALYSIS REQUIREMENTS:
Analyze this request and provide insights on:
1. URGENCY: Assess emotional indicators, time pressure, and business impact (0.0-1.0 scale)
2. CONTEXT TYPE: Infer what type of work this is (client_presentation, internal_review, creative_campaign, data_analysis, regulatory_submission)
3. CONFIDENCE: How certain are you about the context inference (0.0-1.0)
4. CLARIFICATION: What specific question would help refine understanding?
5. RECOMMENDATIONS: Actionable next steps with priority levels
6. COMPLIANCE CONSIDERATIONS: Pharma-specific risks and requirements

RESPONSE FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "timestamp": "ISO_DATE_STRING",
  "urgency": {
    "level": NUMBER_0_TO_1,
    "emotionalState": "calm|concerned|stressed|panicked",
    "timePressure": NUMBER_0_TO_1,
    "businessImpact": "low|medium|high|critical"
  },
  "context": {
    "inferredType": "CONTEXT_TYPE",
    "confidence": NUMBER_0_TO_1,
    "reasoning": ["reason1", "reason2", "reason3"],
    "industryFactors": ["pharma_factor1", "pharma_factor2"]
  },
  "clarification": {
    "question": "SPECIFIC_CLARIFYING_QUESTION",
    "purpose": "refine_context_and_urgency"
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "SPECIFIC_ACTION",
      "reasoning": "WHY_THIS_ACTION",
      "complianceNote": "PHARMA_COMPLIANCE_CONSIDERATION"
    }
  ],
  "nextSteps": ["step1", "step2", "step3"],
  "aiReasoning": {
    "primaryFactors": ["factor1", "factor2"],
    "confidence": NUMBER_0_TO_1,
    "alternativeInterpretations": ["alt1", "alt2"]
  }
}

CRITICAL: Response must be valid JSON. No additional text or formatting.`;
    }

    /**
     * Calls LLM with enterprise safety controls
     */
    async callLLMWithSafety(prompt) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`🔄 LLM Call Attempt ${attempt}/${this.maxRetries}`);
                
                const response = await Promise.race([
                    this.openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: "You are an expert AI governance analyst for pharmaceutical marketing compliance. Always respond with valid JSON only."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        temperature: this.temperature,
                        max_tokens: 1500,
                        top_p: 0.9
                    }),
                    // Timeout promise
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('LLM request timeout')), this.timeout)
                    )
                ]);

                const content = response.choices[0].message.content.trim();
                console.log('✅ LLM Response Received');
                
                return content;
                
            } catch (error) {
                console.warn(`⚠️ LLM Attempt ${attempt} failed:`, error.message);
                lastError = error;
                
                // Wait before retry (exponential backoff)
                if (attempt < this.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        throw new Error(`LLM failed after ${this.maxRetries} attempts: ${lastError.message}`);
    }

    /**
     * Validates AI response and ensures proper structure
     */
    validateAndStructureResponse(aiResponse, originalMessage) {
        try {
            // Parse JSON response
            const parsed = JSON.parse(aiResponse);
            
            // Validate required fields
            this.validateResponseStructure(parsed);
            
            // Add timestamp if missing
            if (!parsed.timestamp) {
                parsed.timestamp = new Date().toISOString();
            }
            
            // Add metadata
            parsed.processingMetadata = {
                agentType: 'agentic',
                modelUsed: 'gpt-3.5-turbo',
                processingTime: new Date().toISOString(),
                originalMessage: originalMessage,
                validation: 'passed'
            };
            
            return parsed;
            
        } catch (error) {
            console.error('❌ Response validation failed:', error);
            throw new Error(`Invalid AI response format: ${error.message}`);
        }
    }

    /**
     * Validates response has required enterprise fields
     */
    validateResponseStructure(response) {
        const required = [
            'urgency.level',
            'urgency.emotionalState', 
            'context.inferredType',
            'context.confidence',
            'clarification.question',
            'recommendations',
            'nextSteps'
        ];

        for (const field of required) {
            if (!this.getNestedField(response, field)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate ranges
        if (response.urgency.level < 0 || response.urgency.level > 1) {
            throw new Error('Urgency level must be 0-1');
        }
        
        if (response.context.confidence < 0 || response.context.confidence > 1) {
            throw new Error('Confidence must be 0-1');
        }
    }

    /**
     * Gets nested field from object (e.g., 'urgency.level')
     */
    getNestedField(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Fallback rule-based analysis for reliability
     */
    fallbackAnalysis(userMessage) {
        console.log('🔄 Using fallback rule-based analysis');
        
        // Extract urgency indicators
        const exclamationCount = ((userMessage || "").match(/!/g) || []).length;
        const urgencyWords = ['urgent', 'asap', 'emergency', 'critical', 'deadline'];
        const hasUrgencyWords = urgencyWords.some(word => 
            userMessage.toLowerCase().includes(word)
        );
        
        // Calculate urgency
        let urgencyLevel = 0.3; // Base level
        urgencyLevel += Math.min(exclamationCount, 3) * 0.2;
        if (hasUrgencyWords) urgencyLevel += 0.3;
        urgencyLevel = Math.min(urgencyLevel, 1.0);
        
        // Determine emotional state
        let emotionalState = 'calm';
        if (urgencyLevel > 0.8) emotionalState = 'panicked';
        else if (urgencyLevel > 0.6) emotionalState = 'stressed';
        else if (urgencyLevel > 0.4) emotionalState = 'concerned';
        
        return {
            timestamp: new Date().toISOString(),
            urgency: {
                level: urgencyLevel,
                emotionalState: emotionalState,
                timePressure: 0.6,
                businessImpact: urgencyLevel > 0.7 ? 'high' : 'medium'
            },
            context: {
                inferredType: 'client_presentation',
                confidence: 0.6,
                reasoning: ['Fallback analysis due to AI unavailability'],
                industryFactors: ['pharmaceutical_compliance_required']
            },
            clarification: {
                question: "Could you provide more details about the specific requirements?",
                purpose: "refine_context_and_urgency"
            },
            recommendations: [
                {
                    priority: 'high',
                    action: 'Proceed with caution due to AI system limitations',
                    reasoning: 'Using rule-based fallback analysis',
                    complianceNote: 'Manual review recommended'
                }
            ],
            nextSteps: [
                'Manual compliance review',
                'Proceed with standard protocols',
                'Document decision rationale'
            ],
            processingMetadata: {
                agentType: 'fallback',
                modelUsed: 'rule-based',
                processingTime: new Date().toISOString(),
                originalMessage: userMessage,
                validation: 'fallback_mode'
            }
        };
    }

    /**
     * Logs decision for audit trail
     */
    logDecision(input, output) {
        const decision = {
            timestamp: new Date().toISOString(),
            input: input,
            output: output,
            agent: 'agentic-context',
            confidence: output.context?.confidence || 0,
            processingType: output.processingMetadata?.agentType || 'unknown'
        };
        
        this.decisions.push(decision);
        
        // Keep only last 100 decisions in memory
        if (this.decisions.length > 100) {
            this.decisions = this.decisions.slice(-100);
        }
        
        console.log('📝 Decision logged for audit trail');
    }

    /**
     * Gets recent decisions for audit purposes
     */
    getRecentDecisions(limit = 10) {
        return this.decisions.slice(-limit);
    }
}

// Singleton instance for the API
let agenticContextAgent = null;

function getAgenticContextAgent() {
    if (!agenticContextAgent) {
        agenticContextAgent = new AgenticContextAgent();
    }
    return agenticContextAgent;
}

// API wrapper function
async function processContext(userMessage) {
    const agent = getAgenticContextAgent();
    return await agent.processContext(userMessage);
}

// Test function
async function testAgenticAgent() {
    console.log('🧪 Testing Agentic Context Agent...\n');
    
    const agent = new AgenticContextAgent();
    const testMessage = "URGENT!!! Need ChatGPT for Pfizer presentation Monday morning!!!";
    
    try {
        const response = await agent.processContext(testMessage);
        
        console.log('📊 AGENTIC RESPONSE:');
        console.log(JSON.stringify(response, null, 2));
        
        console.log('\n🎯 KEY INSIGHTS:');
        console.log(`Urgency Level: ${response.urgency.level.toFixed(2)} (${response.urgency.emotionalState})`);
        console.log(`Context: ${response.context.inferredType} (${(response.context.confidence * 100).toFixed(0)}% confidence)`);
        console.log(`AI Reasoning: ${response.aiReasoning?.primaryFactors?.join(', ') || 'Not available'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

module.exports = {
    AgenticContextAgent,
    processContext,
    testAgenticAgent,
    getAgenticContextAgent
};

// Run test if executed directly
if (require.main === module) {
    testAgenticAgent();
}