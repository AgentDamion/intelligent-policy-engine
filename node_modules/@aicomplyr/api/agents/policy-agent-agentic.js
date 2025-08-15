/**
 * Agentic Policy Agent - Real AI-powered policy compliance analysis
 * 
 * Takes context analysis and applies intelligent compliance reasoning
 * instead of hardcoded rule-based logic
 */

const OpenAI = require('openai');
require('dotenv').config();

class AgenticPolicyAgent {
    constructor(organizationId) {
        this.organizationId = organizationId;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        
        // Enterprise safety settings
        this.maxRetries = 3;
        this.timeout = 30000;
        this.temperature = 0.1; // Very low for consistent compliance decisions
        
        // Policy decision storage
        this.decisions = [];
    }

    /**
     * Main entry point - processes context with AI policy reasoning
     */
    async processPolicy(contextOutput) {
        console.log(`🛡️ Agentic Policy Agent Processing Context...`);
        
        try {
            // 1. Build policy analysis prompt
            const prompt = this.buildPolicyPrompt(contextOutput);
            
            // 2. Call AI for policy analysis
            const aiResponse = await this.callLLMWithSafety(prompt);
            
            // 3. Validate and structure response
            const policyDecision = this.validatePolicyResponse(aiResponse, contextOutput);
            
            // 4. Log decision for audit trail
            this.logPolicyDecision(contextOutput, policyDecision);
            
            console.log('🎯 Agentic Policy Analysis Complete');
            return policyDecision;
            
        } catch (error) {
            console.error('❌ Agentic policy processing failed:', error);
            // Fallback to rule-based policy analysis
            return this.fallbackPolicyAnalysis(contextOutput);
        }
    }

    /**
     * Builds comprehensive policy analysis prompt
     */
    buildPolicyPrompt(contextOutput) {
        const context = contextOutput.context || {};
        const urgency = contextOutput.urgency || {};
        const currentTime = new Date().toISOString();

        return `You are an AI policy compliance expert for pharmaceutical marketing agencies. Analyze this request and provide intelligent policy decisions.

CONTEXT ANALYSIS PROVIDED:
- Request Type: ${context.inferredType || 'unknown'}
- Urgency Level: ${urgency.level || 0} (${urgency.emotionalState || 'unknown'})
- Business Impact: ${urgency.businessImpact || 'unknown'}
- Industry Factors: ${context.industryFactors?.join(', ') || 'pharmaceutical'}
- Time Pressure: ${urgency.timePressure || 0}
- Original Message: "${contextOutput.processingMetadata?.originalMessage || 'No message'}"

POLICY ANALYSIS REQUIREMENTS:
1. DECISION: Approve, conditional approval, or deny the request
2. RISK ASSESSMENT: Comprehensive risk analysis (0.0-1.0 scale)
3. COMPLIANCE REQUIREMENTS: Specific pharma/healthcare compliance needs
4. GUARDRAILS: Protective measures and monitoring requirements
5. CONDITIONS: Specific conditions for approval (if conditional)
6. ESCALATION: When to escalate to human oversight

PHARMACEUTICAL COMPLIANCE CONSIDERATIONS:
- FDA regulations for marketing materials
- Medical accuracy requirements
- Off-label promotion restrictions
- Adverse event reporting obligations
- Competitive intelligence protection
- Patient privacy (HIPAA)
- Fair balance requirements
- Substantiation of claims

AI TOOL SPECIFIC RISKS:
- Content generation accuracy
- Bias in AI outputs
- Intellectual property concerns
- Data privacy in AI training
- Consistency with brand guidelines
- Regulatory review requirements

RESPONSE FORMAT:
Return ONLY valid JSON with this structure:
{
  "timestamp": "ISO_TIMESTAMP",
  "request_id": "POL-TIMESTAMP-RANDOM",
  "decision": {
    "status": "approved|conditional_approval|denied",
    "type": "auto_approval|conditional|manual_review|denied",
    "reasoning": "DETAILED_AI_REASONING",
    "effective_immediately": true|false,
    "confidence": NUMBER_0_TO_1
  },
  "risk": {
    "score": NUMBER_0_TO_1,
    "level": "low|medium|high|critical",
    "factors": ["risk_factor_1", "risk_factor_2"],
    "mitigation_strategies": ["strategy_1", "strategy_2"]
  },
  "conditions": {
    "guardrails": {
      "content_review": {
        "required": true|false,
        "type": "peer_review|medical_review|legal_review",
        "timeframe": "before_use|within_24h|before_publication",
        "reviewer": "specific_role_or_team"
      },
      "time_limits": {
        "max_usage_time": NUMBER_HOURS,
        "deadline": "SPECIFIC_DEADLINE",
        "reminder_intervals": [HOURS_ARRAY]
      },
      "quality_checks": {
        "required": true|false,
        "checks": ["accuracy", "bias", "compliance", "brand"],
        "automated_tools": ["tool1", "tool2"]
      },
      "approval_workflow": {
        "required": true|false,
        "approvers": ["role1", "role2"],
        "parallel": true|false
      }
    },
    "compliance_requirements": [
      "requirement_1",
      "requirement_2"
    ],
    "monitoring_requirements": [
      "monitoring_1",
      "monitoring_2"
    ]
  },
  "escalation": {
    "required": true|false,
    "triggers": ["trigger_1", "trigger_2"],
    "escalation_path": ["role1", "role2"],
    "timeline": "immediate|24h|48h"
  },
  "aiPolicyReasoning": {
    "primaryConcerns": ["concern1", "concern2"],
    "complianceFactors": ["factor1", "factor2"],
    "industrySpecificRisks": ["risk1", "risk2"],
    "recommendedControls": ["control1", "control2"]
  }
}

CRITICAL: Response must be valid JSON only. Consider pharmaceutical industry requirements, AI-specific risks, and regulatory compliance needs.`;
    }

    /**
     * Calls LLM with enterprise safety controls
     */
    async callLLMWithSafety(prompt) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`🔄 Policy LLM Call Attempt ${attempt}/${this.maxRetries}`);
                
                const response = await Promise.race([
                    this.openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: "You are an expert pharmaceutical compliance and AI governance analyst. Always respond with valid JSON only. Focus on patient safety, regulatory compliance, and risk mitigation."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        temperature: this.temperature,
                        max_tokens: 2000,
                        top_p: 0.9
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Policy LLM timeout')), this.timeout)
                    )
                ]);

                const content = response.choices[0].message.content.trim();
                console.log('✅ Policy LLM Response Received');
                return content;
                
            } catch (error) {
                console.warn(`⚠️ Policy LLM Attempt ${attempt} failed:`, error.message);
                lastError = error;
                
                if (attempt < this.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        throw new Error(`Policy LLM failed after ${this.maxRetries} attempts: ${lastError.message}`);
    }

    /**
     * Validates and structures AI policy response
     */
    validatePolicyResponse(aiResponse, contextOutput) {
        try {
            const parsed = JSON.parse(aiResponse);
            
            // Validate required fields
            this.validatePolicyStructure(parsed);
            
            // Add metadata
            parsed.processingMetadata = {
                agentType: 'agentic-policy',
                modelUsed: 'gpt-3.5-turbo',
                processingTime: new Date().toISOString(),
                organizationId: this.organizationId,
                contextAnalysis: contextOutput,
                validation: 'passed'
            };
            
            // Ensure timestamp and ID
            if (!parsed.timestamp) {
                parsed.timestamp = new Date().toISOString();
            }
            if (!parsed.request_id) {
                parsed.request_id = `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            
            return parsed;
            
        } catch (error) {
            console.error('❌ Policy response validation failed:', error);
            throw new Error(`Invalid AI policy response: ${error.message}`);
        }
    }

    /**
     * Validates policy response structure
     */
    validatePolicyStructure(response) {
        const required = [
            'decision.status',
            'decision.reasoning',
            'risk.score',
            'risk.level'
        ];

        for (const field of required) {
            if (!this.getNestedField(response, field)) {
                throw new Error(`Missing required policy field: ${field}`);
            }
        }

        // Validate decision status
        const validStatuses = ['approved', 'conditional_approval', 'denied'];
        if (!validStatuses.includes(response.decision.status)) {
            throw new Error(`Invalid decision status: ${response.decision.status}`);
        }

        // Validate risk score
        if (response.risk.score < 0 || response.risk.score > 1) {
            throw new Error('Risk score must be 0-1');
        }
    }

    /**
     * Gets nested field from object
     */
    getNestedField(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Fallback rule-based policy analysis
     */
    fallbackPolicyAnalysis(contextOutput) {
        console.log('🔄 Using fallback rule-based policy analysis');
        
        const urgency = contextOutput.urgency || {};
        const context = contextOutput.context || {};
        
        // Simple rule-based decision
        let riskScore = 0.3;
        let decision = 'conditional_approval';
        
        // Increase risk for high urgency
        if (urgency.level > 0.8) riskScore += 0.2;
        
        // Increase risk for client presentations
        if (context.inferredType === 'client_presentation') riskScore += 0.2;
        
        // Pharmaceutical industry always has elevated risk
        riskScore += 0.1;
        
        riskScore = Math.min(riskScore, 1.0);
        
        if (riskScore > 0.7) decision = 'conditional_approval';
        if (riskScore > 0.9) decision = 'denied';
        
        return {
            timestamp: new Date().toISOString(),
            request_id: `POL-FALLBACK-${Date.now()}`,
            decision: {
                status: decision,
                type: 'fallback_analysis',
                reasoning: 'Fallback rule-based analysis due to AI unavailability',
                effective_immediately: false,
                confidence: 0.6
            },
            risk: {
                score: riskScore,
                level: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
                factors: ['Pharmaceutical industry requirements', 'AI tool usage'],
                mitigation_strategies: ['Manual review required', 'Compliance verification needed']
            },
            conditions: {
                guardrails: {
                    content_review: {
                        required: true,
                        type: 'manual_review',
                        timeframe: 'before_use',
                        reviewer: 'compliance_team'
                    }
                },
                compliance_requirements: ['Manual compliance verification'],
                monitoring_requirements: ['Human oversight required']
            },
            escalation: {
                required: true,
                triggers: ['AI system unavailability'],
                escalation_path: ['compliance_manager'],
                timeline: 'immediate'
            },
            processingMetadata: {
                agentType: 'fallback-policy',
                modelUsed: 'rule-based',
                processingTime: new Date().toISOString(),
                organizationId: this.organizationId,
                validation: 'fallback_mode'
            }
        };
    }

    /**
     * Logs policy decision for audit trail
     */
    logPolicyDecision(contextInput, policyOutput) {
        const decision = {
            timestamp: new Date().toISOString(),
            contextInput: contextInput,
            policyOutput: policyOutput,
            agent: 'agentic-policy',
            organizationId: this.organizationId,
            confidence: policyOutput.decision?.confidence || 0,
            processingType: policyOutput.processingMetadata?.agentType || 'unknown'
        };
        
        this.decisions.push(decision);
        
        // Keep only last 100 decisions
        if (this.decisions.length > 100) {
            this.decisions = this.decisions.slice(-100);
        }
        
        console.log('📝 Policy decision logged for audit trail');
    }

    /**
     * Gets recent decisions for audit purposes
     */
    getRecentDecisions(limit = 10) {
        return this.decisions.slice(-limit);
    }
}

// Singleton instances per organization
const agenticPolicyAgents = new Map();

function getAgenticPolicyAgent(organizationId) {
    if (!agenticPolicyAgents.has(organizationId)) {
        agenticPolicyAgents.set(organizationId, new AgenticPolicyAgent(organizationId));
    }
    return agenticPolicyAgents.get(organizationId);
}

// Test function
async function testAgenticPolicyAgent() {
    console.log('🧪 Testing Agentic Policy Agent...\n');
    
    // Mock context output from agentic context agent
    const mockContext = {
        timestamp: new Date().toISOString(),
        urgency: {
            level: 0.9,
            emotionalState: "stressed",
            timePressure: 0.8,
            businessImpact: "high"
        },
        context: {
            inferredType: "client_presentation",
            confidence: 0.85,
            reasoning: ["Multiple brands involved", "Need for creative assets"],
            industryFactors: ["strict regulatory requirements", "competitive landscape"]
        },
        processingMetadata: {
            originalMessage: "Need Midjourney for creative assets - we're working on campaigns for both Pfizer AND Novartis this month!"
        }
    };
    
    const agent = new AgenticPolicyAgent('test-org-123');
    
    try {
        const response = await agent.processPolicy(mockContext);
        
        console.log('📊 AGENTIC POLICY RESPONSE:');
        console.log(JSON.stringify(response, null, 2));
        
        console.log('\n🎯 KEY POLICY INSIGHTS:');
        console.log(`Decision: ${response.decision.status.toUpperCase()}`);
        console.log(`Risk Level: ${response.risk.level.toUpperCase()} (${response.risk.score})`);
        console.log(`AI Reasoning: ${response.decision.reasoning}`);
        
    } catch (error) {
        console.error('❌ Policy test failed:', error);
    }
}

module.exports = {
    AgenticPolicyAgent,
    getAgenticPolicyAgent,
    testAgenticPolicyAgent
};

// Run test if executed directly
if (require.main === module) {
    testAgenticPolicyAgent();
}