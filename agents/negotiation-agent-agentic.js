/**
 * Agentic Negotiation Agent - Real AI-powered multi-client conflict resolution
 * 
 * Uses AI to detect competitive relationships, resolve policy conflicts,
 * and provide intelligent escalation decisions for complex scenarios
 */

const OpenAI = require('openai');
require('dotenv').config();

class AgenticNegotiationAgent {
    constructor(organizationId) {
        this.organizationId = organizationId;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        
        // Enterprise safety settings
        this.maxRetries = 3;
        this.timeout = 35000; // Longer timeout for complex reasoning
        this.temperature = 0.2; // Low for consistent compliance decisions
        
        // Negotiation decision storage
        this.decisions = [];
        
        // Pharmaceutical industry knowledge
        this.pharmaCompetitors = {
            'pfizer': ['novartis', 'roche', 'merck', 'astrazeneca', 'sanofi', 'gsk', 'abbvie'],
            'novartis': ['pfizer', 'roche', 'merck', 'astrazeneca', 'sanofi', 'gsk', 'abbvie'],
            'roche': ['pfizer', 'novartis', 'merck', 'astrazeneca', 'sanofi', 'gsk', 'abbvie'],
            'merck': ['pfizer', 'novartis', 'roche', 'astrazeneca', 'sanofi', 'gsk', 'abbvie'],
            'astrazeneca': ['pfizer', 'novartis', 'roche', 'merck', 'sanofi', 'gsk', 'abbvie'],
            'sanofi': ['pfizer', 'novartis', 'roche', 'merck', 'astrazeneca', 'gsk', 'abbvie'],
            'gsk': ['pfizer', 'novartis', 'roche', 'merck', 'astrazeneca', 'sanofi', 'abbvie'],
            'abbvie': ['pfizer', 'novartis', 'roche', 'merck', 'astrazeneca', 'sanofi', 'gsk']
        };
    }

    /**
     * Main entry point - processes context and policy with AI negotiation reasoning
     */
    async processNegotiation(contextOutput, policyDecision) {
        console.log(`🤝 Agentic Negotiation Agent Processing Multi-Client Scenario...`);
        
        try {
            // 1. Build negotiation analysis prompt
            const prompt = this.buildNegotiationPrompt(contextOutput, policyDecision);
            
            // 2. Call AI for negotiation analysis
            const aiResponse = await this.callLLMWithSafety(prompt);
            
            // 3. Validate and structure response
            const negotiationResult = this.validateNegotiationResponse(aiResponse, contextOutput, policyDecision);
            
            // 4. Log decision for audit trail
            this.logNegotiationDecision(contextOutput, policyDecision, negotiationResult);
            
            console.log('🎯 Agentic Negotiation Analysis Complete');
            return negotiationResult;
            
        } catch (error) {
            console.error('❌ Agentic negotiation processing failed:', error);
            // Fallback to rule-based negotiation analysis
            return this.fallbackNegotiationAnalysis(contextOutput, policyDecision);
        }
    }

    /**
     * Builds comprehensive negotiation analysis prompt
     */
    buildNegotiationPrompt(contextOutput, policyDecision) {
        const context = contextOutput.context || {};
        const urgency = contextOutput.urgency || {};
        const decision = policyDecision.decision || {};
        const risk = policyDecision.risk || {};
        const originalMessage = contextOutput.processingMetadata?.originalMessage || '';

        return `You are an AI negotiation expert specializing in multi-client pharmaceutical marketing compliance conflicts. Analyze this complex scenario and provide intelligent conflict resolution.

CONTEXT ANALYSIS PROVIDED:
- Request Type: ${context.inferredType || 'unknown'}
- Urgency Level: ${urgency.level || 0} (${urgency.emotionalState || 'unknown'})
- Business Impact: ${urgency.businessImpact || 'unknown'}
- Industry Factors: ${context.industryFactors?.join(', ') || 'pharmaceutical'}
- AI Confidence: ${context.confidence || 0}
- Original Request: "${originalMessage}"

POLICY DECISION PROVIDED:
- Decision Status: ${decision.status || 'unknown'}
- Risk Score: ${risk.score || 0} (${risk.level || 'unknown'})
- Policy Reasoning: ${decision.reasoning || 'No reasoning provided'}
- Compliance Requirements: ${policyDecision.conditions?.compliance_requirements?.join(', ') || 'Standard compliance'}

NEGOTIATION ANALYSIS REQUIREMENTS:
1. CLIENT DETECTION: Identify all pharmaceutical companies mentioned
2. COMPETITIVE ANALYSIS: Assess competitive relationships and conflicts
3. CONFLICT RESOLUTION: Provide intelligent solutions for multi-client scenarios
4. INFORMATION SEGREGATION: Design safeguards for competitive intelligence
5. ESCALATION DECISIONS: Determine when human oversight is required
6. COMPLIANCE HARMONIZATION: Resolve conflicting compliance requirements

PHARMACEUTICAL COMPETITIVE LANDSCAPE KNOWLEDGE:
Major competitors include: Pfizer, Novartis, Roche, Merck, AstraZeneca, Sanofi, GSK, AbbVie
- Direct competitors require strict information segregation
- Joint ventures and partnerships exist but are complex
- Regulatory requirements may differ by region and therapeutic area
- Competitive intelligence protection is critical

AI TOOL CONFLICT CONSIDERATIONS:
- Image generation tools risk creating similar visual assets for competitors
- Text generation tools risk cross-contamination of messaging
- Data analysis tools risk revealing competitive insights
- Creative tools require distinct brand separation

RESPONSE FORMAT:
Return ONLY valid JSON with this structure:
{
  "timestamp": "ISO_TIMESTAMP",
  "negotiation_id": "NEG-TIMESTAMP-RANDOM",
  "clients": {
    "detected": ["client1", "client2"],
    "count": NUMBER,
    "industry": "pharmaceutical",
    "competitive_analysis": {
      "competitors_involved": ["client1", "client2"],
      "partnership_opportunities": ["client1", "client2"],
      "neutral_relationships": ["client1", "client2"]
    }
  },
  "conflicts": {
    "competitive_intelligence": {
      "severity": NUMBER_0_TO_1,
      "affected_clients": ["client1", "client2"],
      "risk_description": "DESCRIPTION",
      "mitigation_required": true|false
    },
    "regulatory_conflicts": {
      "severity": NUMBER_0_TO_1,
      "jurisdictional_differences": ["difference1", "difference2"],
      "harmonization_approach": "APPROACH"
    },
    "brand_conflicts": {
      "severity": NUMBER_0_TO_1,
      "visual_separation_required": true|false,
      "messaging_conflicts": ["conflict1", "conflict2"]
    },
    "total_conflict_score": NUMBER_0_TO_1
  },
  "resolution": {
    "approach": "information_segregation|sequential_processing|escalation_required|approval_with_conditions",
    "feasibility": "feasible|challenging|requires_escalation|not_recommended",
    "information_barriers": {
      "required": true|false,
      "implementation": ["barrier1", "barrier2"],
      "monitoring": ["monitor1", "monitor2"]
    },
    "workflow_modifications": {
      "required": true|false,
      "changes": ["change1", "change2"],
      "timeline": "immediate|24h|48h"
    },
    "resource_allocation": {
      "dedicated_teams": true|false,
      "separate_tools": true|false,
      "isolated_environments": true|false
    }
  },
  "client_requirements": {
    "CLIENT_NAME": {
      "specific_safeguards": ["safeguard1", "safeguard2"],
      "approval_requirements": ["requirement1", "requirement2"],
      "monitoring_needs": ["need1", "need2"],
      "escalation_triggers": ["trigger1", "trigger2"]
    }
  },
  "escalation": {
    "required": true|false,
    "urgency": "immediate|24h|48h|routine",
    "escalation_path": ["role1", "role2"],
    "decision_authority": "ROLE_OR_COMMITTEE",
    "documentation_required": ["doc1", "doc2"]
  },
  "final_decision": {
    "status": "approved_with_conditions|conditional_approval|escalation_required|denied",
    "reasoning": "DETAILED_AI_REASONING",
    "implementation_timeline": "immediate|24h|48h|requires_planning",
    "success_probability": NUMBER_0_TO_1,
    "risk_mitigation_effectiveness": NUMBER_0_TO_1
  },
  "aiNegotiationReasoning": {
    "competitive_intelligence_assessment": ["insight1", "insight2"],
    "conflict_resolution_strategy": ["strategy1", "strategy2"],
    "industry_specific_considerations": ["consideration1", "consideration2"],
    "recommended_safeguards": ["safeguard1", "safeguard2"]
  }
}

CRITICAL: Response must be valid JSON only. Focus on pharmaceutical industry competitive dynamics, regulatory compliance, and client conflict resolution.`;
    }

    /**
     * Calls LLM with enterprise safety controls
     */
    async callLLMWithSafety(prompt) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`🔄 Negotiation LLM Call Attempt ${attempt}/${this.maxRetries}`);
                
                const response = await Promise.race([
                    this.openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: "You are an expert pharmaceutical industry negotiation and conflict resolution specialist with deep knowledge of competitive dynamics, regulatory compliance, and multi-client governance. Always respond with valid JSON only."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        temperature: this.temperature,
                        max_tokens: 3000,
                        top_p: 0.9
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Negotiation LLM timeout')), this.timeout)
                    )
                ]);

                const content = response.choices[0].message.content.trim();
                console.log('✅ Negotiation LLM Response Received');
                return content;
                
            } catch (error) {
                console.warn(`⚠️ Negotiation LLM Attempt ${attempt} failed:`, error.message);
                lastError = error;
                
                if (attempt < this.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }
            }
        }
        
        throw new Error(`Negotiation LLM failed after ${this.maxRetries} attempts: ${lastError.message}`);
    }

    /**
     * Validates and structures AI negotiation response
     */
    validateNegotiationResponse(aiResponse, contextOutput, policyDecision) {
        try {
            const parsed = JSON.parse(aiResponse);
            
            // Validate required fields
            this.validateNegotiationStructure(parsed);
            
            // Add metadata
            parsed.processingMetadata = {
                agentType: 'agentic-negotiation',
                modelUsed: 'gpt-3.5-turbo',
                processingTime: new Date().toISOString(),
                organizationId: this.organizationId,
                contextAnalysis: contextOutput,
                policyDecision: policyDecision,
                validation: 'passed'
            };
            
            // Ensure timestamp and ID
            if (!parsed.timestamp) {
                parsed.timestamp = new Date().toISOString();
            }
            if (!parsed.negotiation_id) {
                parsed.negotiation_id = `NEG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            
            return parsed;
            
        } catch (error) {
            console.error('❌ Negotiation response validation failed:', error);
            throw new Error(`Invalid AI negotiation response: ${error.message}`);
        }
    }

    /**
     * Validates negotiation response structure
     */
    validateNegotiationStructure(response) {
        const required = [
            'clients.detected',
            'conflicts.total_conflict_score',
            'resolution.approach',
            'final_decision.status'
        ];

        for (const field of required) {
            if (!this.getNestedField(response, field)) {
                throw new Error(`Missing required negotiation field: ${field}`);
            }
        }

        // Validate conflict score
        if (response.conflicts.total_conflict_score < 0 || response.conflicts.total_conflict_score > 1) {
            throw new Error('Total conflict score must be 0-1');
        }
    }

    /**
     * Gets nested field from object
     */
    getNestedField(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Fallback rule-based negotiation analysis
     */
    fallbackNegotiationAnalysis(contextOutput, policyDecision) {
        console.log('🔄 Using fallback rule-based negotiation analysis');
        
        const originalMessage = contextOutput.processingMetadata?.originalMessage || '';
        const messageLower = originalMessage.toLowerCase();
        
        // Detect pharmaceutical companies in message
        const detectedClients = [];
        for (const pharma of Object.keys(this.pharmaCompetitors)) {
            if (messageLower.includes(pharma)) {
                detectedClients.push(pharma);
            }
        }
        
        // Calculate conflict score
        let conflictScore = 0;
        const competitors = [];
        
        // Check for competitive relationships
        for (let i = 0; i < detectedClients.length; i++) {
            for (let j = i + 1; j < detectedClients.length; j++) {
                const client1 = detectedClients[i];
                const client2 = detectedClients[j];
                
                if (this.pharmaCompetitors[client1]?.includes(client2)) {
                    competitors.push([client1, client2]);
                    conflictScore += 0.3;
                }
            }
        }
        
        conflictScore = Math.min(conflictScore, 1.0);
        
        // Determine resolution approach
        let approach = 'information_segregation';
        let status = 'approved_with_conditions';
        
        if (conflictScore > 0.7) {
            approach = 'escalation_required';
            status = 'escalation_required';
        }
        
        return {
            timestamp: new Date().toISOString(),
            negotiation_id: `NEG-FALLBACK-${Date.now()}`,
            clients: {
                detected: detectedClients,
                count: detectedClients.length,
                industry: 'pharmaceutical',
                competitive_analysis: {
                    competitors_involved: competitors.flat(),
                    partnership_opportunities: [],
                    neutral_relationships: []
                }
            },
            conflicts: {
                competitive_intelligence: {
                    severity: conflictScore,
                    affected_clients: detectedClients,
                    risk_description: 'Potential competitive intelligence conflicts detected',
                    mitigation_required: conflictScore > 0.3
                },
                total_conflict_score: conflictScore
            },
            resolution: {
                approach: approach,
                feasibility: conflictScore > 0.7 ? 'requires_escalation' : 'feasible',
                information_barriers: {
                    required: conflictScore > 0.3,
                    implementation: ['Separate workspaces', 'Access controls'],
                    monitoring: ['Audit trails', 'Regular reviews']
                }
            },
            escalation: {
                required: conflictScore > 0.7,
                urgency: conflictScore > 0.7 ? 'immediate' : 'routine',
                escalation_path: ['compliance_manager', 'legal_counsel']
            },
            final_decision: {
                status: status,
                reasoning: 'Fallback rule-based analysis due to AI unavailability',
                success_probability: 0.6
            },
            processingMetadata: {
                agentType: 'fallback-negotiation',
                modelUsed: 'rule-based',
                processingTime: new Date().toISOString(),
                organizationId: this.organizationId,
                validation: 'fallback_mode'
            }
        };
    }

    /**
     * Logs negotiation decision for audit trail
     */
    logNegotiationDecision(contextInput, policyInput, negotiationOutput) {
        const decision = {
            timestamp: new Date().toISOString(),
            contextInput: contextInput,
            policyInput: policyInput,
            negotiationOutput: negotiationOutput,
            agent: 'agentic-negotiation',
            organizationId: this.organizationId,
            conflictScore: negotiationOutput.conflicts?.total_conflict_score || 0,
            processingType: negotiationOutput.processingMetadata?.agentType || 'unknown'
        };
        
        this.decisions.push(decision);
        
        // Keep only last 100 decisions
        if (this.decisions.length > 100) {
            this.decisions = this.decisions.slice(-100);
        }
        
        console.log('📝 Negotiation decision logged for audit trail');
    }

    /**
     * Gets recent decisions for audit purposes
     */
    getRecentDecisions(limit = 10) {
        return this.decisions.slice(-limit);
    }
}

// Singleton instances per organization
const agenticNegotiationAgents = new Map();

function getAgenticNegotiationAgent(organizationId) {
    if (!agenticNegotiationAgents.has(organizationId)) {
        agenticNegotiationAgents.set(organizationId, new AgenticNegotiationAgent(organizationId));
    }
    return agenticNegotiationAgents.get(organizationId);
}

// Test function
async function testAgenticNegotiationAgent() {
    console.log('🧪 Testing Agentic Negotiation Agent...\n');
    
    // Mock context and policy outputs
    const mockContext = {
        urgency: { level: 0.9, emotionalState: "stressed", businessImpact: "high" },
        context: { inferredType: "creative_campaign", confidence: 0.85 },
        processingMetadata: { originalMessage: "Need Midjourney for campaigns serving both Pfizer AND Novartis!" }
    };
    
    const mockPolicy = {
        decision: { status: "conditional_approval", reasoning: "High risk multi-client scenario" },
        risk: { score: 0.85, level: "high" },
        conditions: { compliance_requirements: ["FDA regulations", "Competitive intelligence protection"] }
    };
    
    const agent = new AgenticNegotiationAgent('test-org-123');
    
    try {
        const response = await agent.processNegotiation(mockContext, mockPolicy);
        
        console.log('📊 AGENTIC NEGOTIATION RESPONSE:');
        console.log(JSON.stringify(response, null, 2));
        
        console.log('\n🎯 KEY NEGOTIATION INSIGHTS:');
        console.log(`Clients Detected: ${response.clients.detected.join(', ')}`);
        console.log(`Conflict Score: ${response.conflicts.total_conflict_score}`);
        console.log(`Resolution: ${response.resolution.approach}`);
        console.log(`Final Decision: ${response.final_decision.status}`);
        
    } catch (error) {
        console.error('❌ Negotiation test failed:', error);
    }
}

module.exports = {
    AgenticNegotiationAgent,
    getAgenticNegotiationAgent,
    testAgenticNegotiationAgent
};

// Run test if executed directly
if (require.main === module) {
    testAgenticNegotiationAgent();
}