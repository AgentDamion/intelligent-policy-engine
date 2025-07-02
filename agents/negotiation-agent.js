/**
 * Negotiation Agent - Handles multi-client policy conflicts intelligently
 * 
 * Features:
 * 1. Maps client relationships (competitors, partners, neutral)
 * 2. Detects policy conflicts between clients
 * 3. Finds compromise solutions that satisfy all policies
 * 4. Generates client-specific compliance requirements
 * 5. Handles escalation when no solution exists
 */

class NegotiationAgent {
    constructor() {
        this.clientDatabase = {
            pharmaceutical: {
                competitors: {
                    'pfizer': ['novartis', 'roche', 'merck', 'astrazeneca', 'sanofi'],
                    'novartis': ['pfizer', 'roche', 'merck', 'astrazeneca', 'sanofi'],
                    'roche': ['pfizer', 'novartis', 'merck', 'astrazeneca', 'sanofi'],
                    'merck': ['pfizer', 'novartis', 'roche', 'astrazeneca', 'sanofi'],
                    'astrazeneca': ['pfizer', 'novartis', 'roche', 'merck', 'sanofi'],
                    'sanofi': ['pfizer', 'novartis', 'roche', 'merck', 'astrazeneca']
                },
                partners: {
                    'pfizer': ['biontech', 'moderna'],
                    'novartis': ['alcon', 'sandoz'],
                    'roche': ['genentech', 'ventana']
                },
                neutral: {
                    'pfizer': ['johnson-johnson', 'abbott'],
                    'novartis': ['johnson-johnson', 'abbott'],
                    'roche': ['johnson-johnson', 'abbott']
                }
            },
            automotive: {
                competitors: {
                    'toyota': ['honda', 'ford', 'gm', 'volkswagen'],
                    'honda': ['toyota', 'ford', 'gm', 'volkswagen'],
                    'ford': ['toyota', 'honda', 'gm', 'volkswagen'],
                    'gm': ['toyota', 'honda', 'ford', 'volkswagen']
                }
            },
            technology: {
                competitors: {
                    'apple': ['google', 'microsoft', 'amazon', 'samsung'],
                    'google': ['apple', 'microsoft', 'amazon', 'samsung'],
                    'microsoft': ['apple', 'google', 'amazon', 'samsung'],
                    'amazon': ['apple', 'google', 'microsoft', 'samsung']
                }
            }
        };

        this.policyConflicts = {
            competitive_intelligence: {
                severity: 'high',
                description: 'Risk of sharing competitive information between rival clients',
                mitigation: 'Strict information segregation and competitive intelligence safeguards'
            },
            brand_conflicts: {
                severity: 'medium',
                description: 'Potential brand confusion or dilution between competing clients',
                mitigation: 'Clear brand separation and distinct visual identities'
            },
            regulatory_conflicts: {
                severity: 'high',
                description: 'Different regulatory requirements between clients',
                mitigation: 'Highest common denominator compliance approach'
            },
            timeline_conflicts: {
                severity: 'medium',
                description: 'Conflicting deadlines or launch schedules',
                mitigation: 'Staggered delivery and priority management'
            }
        };

        this.industryRegulations = {
            pharmaceutical: {
                fda_compliance: {
                    required: true,
                    description: 'FDA approval for medical advertising and claims',
                    requirements: ['pre-approval review', 'medical accuracy', 'side effect disclosure']
                },
                ema_compliance: {
                    required: true,
                    description: 'European Medicines Agency regulations',
                    requirements: ['ema approval', 'european standards', 'multilingual compliance']
                },
                competitive_intelligence: {
                    required: true,
                    description: 'Protection of competitive information',
                    requirements: ['information segregation', 'confidentiality agreements', 'access controls']
                }
            },
            automotive: {
                safety_regulations: {
                    required: true,
                    description: 'Automotive safety and advertising standards',
                    requirements: ['safety claims validation', 'crash test compliance', 'emissions standards']
                }
            },
            technology: {
                data_privacy: {
                    required: true,
                    description: 'Data protection and privacy regulations',
                    requirements: ['gdpr compliance', 'data encryption', 'user consent']
                }
            }
        };
    }

    /**
     * Main entry point - negotiates multi-client policy conflicts
     */
    negotiateMultiClientRequest(contextAgentOutput, policyAgentOutput) {
        console.log('🤝 Negotiation Agent Processing Multi-Client Request...\n');
        
        // 1. Extract client information from context
        const clientAnalysis = this.extractClientInformation(contextAgentOutput);
        
        // 2. Map client relationships
        const relationshipMap = this.mapClientRelationships(clientAnalysis.clients);
        
        // 3. Detect policy conflicts
        const conflictAnalysis = this.detectPolicyConflicts(clientAnalysis, relationshipMap);
        
        // 4. Find compromise solutions
        const compromiseSolution = this.findCompromiseSolution(conflictAnalysis);
        
        // 5. Generate client-specific requirements
        const clientRequirements = this.generateClientRequirements(clientAnalysis, compromiseSolution);
        
        // 6. Build negotiation result
        const negotiationResult = this.buildNegotiationResult(
            clientAnalysis,
            relationshipMap,
            conflictAnalysis,
            compromiseSolution,
            clientRequirements
        );
        
        return negotiationResult;
    }

    /**
     * Extracts client information from Context Agent output
     */
    extractClientInformation(contextAgentOutput) {
        const message = contextAgentOutput.userMessage || "Using Midjourney for campaign images serving Pfizer, Novartis, and Roche";
        
        // Extract client names from message
        const clientKeywords = this.getAllClientKeywords();
        const foundClients = clientKeywords.filter(client => 
            message.toLowerCase().includes(client.toLowerCase())
        );
        
        // Determine industry
        const industry = this.detectIndustry(message, foundClients);
        
        // Extract tool information
        const toolInfo = this.extractToolInformation(message);
        
        return {
            clients: foundClients,
            industry: industry,
            tool: toolInfo,
            message: message,
            clientCount: foundClients.length,
            hasMultipleClients: foundClients.length > 1
        };
    }

    /**
     * Maps relationships between clients
     */
    mapClientRelationships(clients) {
        const relationships = {
            competitors: [],
            partners: [],
            neutral: [],
            conflicts: [],
            riskLevel: 'low'
        };

        if (clients.length < 2) {
            return relationships;
        }

        // Check each pair of clients
        for (let i = 0; i < clients.length; i++) {
            for (let j = i + 1; j < clients.length; j++) {
                const client1 = clients[i].toLowerCase();
                const client2 = clients[j].toLowerCase();
                
                // Check if they're competitors
                const competitiveRelationship = this.checkCompetitiveRelationship(client1, client2);
                if (competitiveRelationship.isCompetitor) {
                    relationships.competitors.push({
                        client1: client1,
                        client2: client2,
                        industry: competitiveRelationship.industry,
                        severity: competitiveRelationship.severity
                    });
                    relationships.conflicts.push({
                        type: 'competitive',
                        clients: [client1, client2],
                        severity: competitiveRelationship.severity,
                        description: `Direct competitors in ${competitiveRelationship.industry} industry`
                    });
                }
                
                // Check if they're partners
                const partnerRelationship = this.checkPartnerRelationship(client1, client2);
                if (partnerRelationship.isPartner) {
                    relationships.partners.push({
                        client1: client1,
                        client2: client2,
                        partnership: partnerRelationship.partnership
                    });
                }
            }
        }

        // Determine overall risk level
        if (relationships.conflicts.length > 0) {
            const maxSeverity = Math.max(...relationships.conflicts.map(c => c.severity));
            relationships.riskLevel = maxSeverity > 0.8 ? 'high' : maxSeverity > 0.5 ? 'medium' : 'low';
        }

        return relationships;
    }

    /**
     * Detects policy conflicts between clients
     */
    detectPolicyConflicts(clientAnalysis, relationshipMap) {
        const conflicts = {
            competitive_intelligence: [],
            regulatory_conflicts: [],
            brand_conflicts: [],
            timeline_conflicts: [],
            escalation_required: false,
            total_conflicts: 0
        };

        // Check for competitive intelligence conflicts
        if (relationshipMap.competitors.length > 0) {
            conflicts.competitive_intelligence.push({
                type: 'competitive_intelligence',
                severity: 0.9,
                description: 'Multiple competing clients require strict information segregation',
                affected_clients: relationshipMap.competitors.map(c => [c.client1, c.client2]).flat(),
                mitigation: 'Implement strict information segregation and competitive intelligence safeguards'
            });
        }

        // Check for regulatory conflicts
        if (clientAnalysis.industry) {
            const industryRegs = this.industryRegulations[clientAnalysis.industry];
            if (industryRegs) {
                conflicts.regulatory_conflicts.push({
                    type: 'regulatory',
                    severity: 0.8,
                    description: `Industry-specific regulations for ${clientAnalysis.industry}`,
                    requirements: Object.values(industryRegs),
                    mitigation: 'Apply highest common denominator compliance approach'
                });
            }
        }

        // Check for tool-specific conflicts
        if (clientAnalysis.tool.type === 'image_generation') {
            conflicts.brand_conflicts.push({
                type: 'brand_conflicts',
                severity: 0.7,
                description: 'Image generation for competing brands requires distinct visual identities',
                affected_clients: clientAnalysis.clients,
                mitigation: 'Ensure clear brand separation and distinct visual identities'
            });
        }

        // Calculate total conflicts and escalation requirement
        conflicts.total_conflicts = conflicts.competitive_intelligence.length + 
                                   conflicts.regulatory_conflicts.length + 
                                   conflicts.brand_conflicts.length + 
                                   conflicts.timeline_conflicts.length;
        
        conflicts.escalation_required = conflicts.total_conflicts > 2 || 
                                       relationshipMap.riskLevel === 'high';

        return conflicts;
    }

    /**
     * Finds compromise solutions that satisfy all policies
     */
    findCompromiseSolution(conflictAnalysis) {
        const solution = {
            approach: 'compromise',
            feasibility: 'feasible',
            requirements: [],
            guardrails: [],
            monitoring: [],
            escalation: conflictAnalysis.escalation_required
        };

        // Handle competitive intelligence conflicts
        if (conflictAnalysis.competitive_intelligence.length > 0) {
            solution.requirements.push({
                type: 'information_segregation',
                description: 'Strict separation of client information and competitive intelligence',
                implementation: [
                    'Separate project workspaces for each client',
                    'Dedicated team members per client',
                    'Confidentiality agreements for all team members',
                    'Access controls and audit trails'
                ]
            });
        }

        // Handle regulatory conflicts
        if (conflictAnalysis.regulatory_conflicts.length > 0) {
            solution.requirements.push({
                type: 'regulatory_compliance',
                description: 'Highest common denominator compliance approach',
                implementation: [
                    'Apply most stringent regulatory requirements across all clients',
                    'Pre-approval review for all content',
                    'Legal review for compliance with all applicable regulations',
                    'Regular compliance audits and reporting'
                ]
            });
        }

        // Handle brand conflicts
        if (conflictAnalysis.brand_conflicts.length > 0) {
            solution.requirements.push({
                type: 'brand_separation',
                description: 'Clear brand separation and distinct visual identities',
                implementation: [
                    'Distinct visual styles for each client',
                    'Separate brand guidelines and style guides',
                    'Clear attribution and branding requirements',
                    'Pre-approval of all visual elements'
                ]
            });
        }

        // Determine if solution is feasible
        if (conflictAnalysis.total_conflicts > 3) {
            solution.feasibility = 'challenging';
        }
        if (conflictAnalysis.total_conflicts > 5) {
            solution.feasibility = 'infeasible';
            solution.approach = 'escalation_required';
        }

        return solution;
    }

    /**
     * Generates client-specific compliance requirements
     */
    generateClientRequirements(clientAnalysis, compromiseSolution) {
        const requirements = {};

        clientAnalysis.clients.forEach(client => {
            const clientLower = client.toLowerCase();
            requirements[clientLower] = {
                client: client,
                specific_requirements: [],
                guardrails: [],
                approvals_required: [],
                monitoring: []
            };

            // Add industry-specific requirements
            if (clientAnalysis.industry === 'pharmaceutical') {
                requirements[clientLower].specific_requirements.push(
                    'FDA compliance review for all medical claims',
                    'EMA compliance for European markets',
                    'Medical accuracy validation',
                    'Side effect disclosure compliance'
                );
                requirements[clientLower].approvals_required.push(
                    'Medical review board approval',
                    'Legal compliance review',
                    'Regulatory affairs approval'
                );
            }

            // Add competitive intelligence safeguards
            if (compromiseSolution.requirements.some(req => req.type === 'information_segregation')) {
                requirements[clientLower].guardrails.push(
                    'Client-specific workspace isolation',
                    'Confidentiality agreements for all team members',
                    'Access controls and audit trails',
                    'Competitive intelligence training'
                );
            }

            // Add tool-specific requirements
            if (clientAnalysis.tool.type === 'image_generation') {
                requirements[clientLower].specific_requirements.push(
                    'Visual compliance review',
                    'Brand guideline adherence',
                    'Copyright clearance',
                    'Medical imagery compliance (if applicable)'
                );
            }

            // Add monitoring requirements
            requirements[clientLower].monitoring.push(
                'Real-time compliance monitoring',
                'Regular audit reporting',
                'Client satisfaction tracking',
                'Competitive intelligence monitoring'
            );
        });

        return requirements;
    }

    /**
     * Builds the final negotiation result
     */
    buildNegotiationResult(clientAnalysis, relationshipMap, conflictAnalysis, compromiseSolution, clientRequirements) {
        return {
            timestamp: new Date().toISOString(),
            negotiation_id: this.generateNegotiationId(),
            
            // Client analysis
            clients: {
                count: clientAnalysis.clientCount,
                names: clientAnalysis.clients,
                industry: clientAnalysis.industry,
                tool: clientAnalysis.tool
            },

            // Relationship mapping
            relationships: {
                competitors: relationshipMap.competitors,
                partners: relationshipMap.partners,
                neutral: relationshipMap.neutral,
                conflicts: relationshipMap.conflicts,
                risk_level: relationshipMap.riskLevel
            },

            // Conflict analysis
            conflicts: {
                total: conflictAnalysis.total_conflicts,
                competitive_intelligence: conflictAnalysis.competitive_intelligence,
                regulatory: conflictAnalysis.regulatory_conflicts,
                brand: conflictAnalysis.brand_conflicts,
                timeline: conflictAnalysis.timeline_conflicts,
                escalation_required: conflictAnalysis.escalation_required
            },

            // Compromise solution
            solution: {
                approach: compromiseSolution.approach,
                feasibility: compromiseSolution.feasibility,
                requirements: compromiseSolution.requirements,
                escalation: compromiseSolution.escalation
            },

            // Client-specific requirements
            client_requirements: clientRequirements,

            // Final decision
            decision: {
                status: this.determineFinalStatus(compromiseSolution, conflictAnalysis),
                reasoning: this.generateDecisionReasoning(compromiseSolution, conflictAnalysis),
                next_steps: this.generateNextSteps(compromiseSolution, clientRequirements)
            }
        };
    }

    // Helper methods
    getAllClientKeywords() {
        const allClients = [];
        Object.values(this.clientDatabase).forEach(industry => {
            Object.keys(industry.competitors).forEach(client => allClients.push(client));
        });
        return allClients;
    }

    detectIndustry(message, clients) {
        const messageLower = message.toLowerCase();
        
        if (messageLower.includes('pharmaceutical') || 
            clients.some(client => this.clientDatabase.pharmaceutical.competitors[client.toLowerCase()])) {
            return 'pharmaceutical';
        }
        if (messageLower.includes('automotive') || 
            clients.some(client => this.clientDatabase.automotive.competitors[client.toLowerCase()])) {
            return 'automotive';
        }
        if (messageLower.includes('technology') || 
            clients.some(client => this.clientDatabase.technology.competitors[client.toLowerCase()])) {
            return 'technology';
        }
        
        return 'general';
    }

    extractToolInformation(message) {
        const messageLower = message.toLowerCase();
        
        if (messageLower.includes('midjourney') || messageLower.includes('dall-e') || messageLower.includes('stable-diffusion')) {
            return { type: 'image_generation', name: 'Midjourney', complexity: 'high' };
        }
        if (messageLower.includes('chatgpt') || messageLower.includes('claude') || messageLower.includes('bard')) {
            return { type: 'text_generation', name: 'ChatGPT', complexity: 'medium' };
        }
        if (messageLower.includes('runway') || messageLower.includes('pika') || messageLower.includes('synthesia')) {
            return { type: 'video_generation', name: 'Runway', complexity: 'high' };
        }
        
        return { type: 'unknown', name: 'Unknown', complexity: 'medium' };
    }

    checkCompetitiveRelationship(client1, client2) {
        for (const [industry, data] of Object.entries(this.clientDatabase)) {
            if (data.competitors[client1] && data.competitors[client1].includes(client2)) {
                return {
                    isCompetitor: true,
                    industry: industry,
                    severity: 0.9
                };
            }
        }
        return { isCompetitor: false, industry: null, severity: 0 };
    }

    checkPartnerRelationship(client1, client2) {
        for (const [industry, data] of Object.entries(this.clientDatabase)) {
            if (data.partners && data.partners[client1] && data.partners[client1].includes(client2)) {
                return {
                    isPartner: true,
                    partnership: 'strategic_partnership',
                    industry: industry
                };
            }
        }
        return { isPartner: false, partnership: null, industry: null };
    }

    determineFinalStatus(compromiseSolution, conflictAnalysis) {
        if (compromiseSolution.feasibility === 'infeasible') {
            return 'escalation_required';
        }
        if (conflictAnalysis.escalation_required) {
            return 'conditional_approval_with_escalation';
        }
        if (compromiseSolution.requirements.length > 0) {
            return 'conditional_approval';
        }
        return 'approved';
    }

    generateDecisionReasoning(compromiseSolution, conflictAnalysis) {
        if (compromiseSolution.feasibility === 'infeasible') {
            return 'Too many conflicts detected - escalation required for resolution';
        }
        if (conflictAnalysis.escalation_required) {
            return 'Complex multi-client scenario requires senior management approval';
        }
        if (compromiseSolution.requirements.length > 0) {
            return 'Compromise solution found with specific guardrails and requirements';
        }
        return 'No conflicts detected - standard approval process';
    }

    generateNextSteps(compromiseSolution, clientRequirements) {
        const steps = [];
        
        if (compromiseSolution.escalation) {
            steps.push('Escalate to senior management for approval');
            steps.push('Prepare conflict analysis documentation');
            steps.push('Schedule stakeholder review meeting');
        }
        
        steps.push('Implement client-specific workspaces and access controls');
        steps.push('Set up monitoring and audit systems');
        steps.push('Schedule regular compliance reviews');
        
        Object.values(clientRequirements).forEach(clientReq => {
            steps.push(`Coordinate with ${clientReq.client} for specific requirements`);
        });
        
        return steps;
    }

    generateNegotiationId() {
        return `NEG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Test the Negotiation Agent
function testNegotiationAgent() {
    const negotiationAgent = new NegotiationAgent();
    
    // Mock Context Agent output for Scenario 2
    const mockContextOutput = {
        userMessage: "Using Midjourney for campaign images serving Pfizer, Novartis, and Roche",
        urgency: { level: 0.3, emotionalState: "calm" },
        context: { inferredType: "creative_campaign", confidence: 0.7 }
    };
    
    // Mock Policy Agent output
    const mockPolicyOutput = {
        decision: { status: "approved", type: "auto_approval" },
        risk: { score: 0.5, level: "medium" }
    };
    
    console.log('🤝 Testing Negotiation Agent...\n');
    
    const negotiationResult = negotiationAgent.negotiateMultiClientRequest(mockContextOutput, mockPolicyOutput);
    
    console.log('📋 NEGOTIATION RESULT:');
    console.log(JSON.stringify(negotiationResult, null, 2));
    
    console.log('\n🎯 KEY INSIGHTS:');
    console.log(`Clients: ${negotiationResult.clients.count} (${negotiationResult.clients.names.join(', ')})`);
    console.log(`Industry: ${negotiationResult.clients.industry}`);
    console.log(`Tool: ${negotiationResult.clients.tool.name} (${negotiationResult.clients.tool.type})`);
    console.log(`Risk Level: ${negotiationResult.relationships.risk_level.toUpperCase()}`);
    console.log(`Conflicts: ${negotiationResult.conflicts.total}`);
    console.log(`Solution Feasibility: ${negotiationResult.solution.feasibility}`);
    console.log(`Final Status: ${negotiationResult.decision.status.toUpperCase()}`);
    
    console.log('\n🔍 COMPETITIVE RELATIONSHIPS:');
    negotiationResult.relationships.competitors.forEach(comp => {
        console.log(`- ${comp.client1} ↔ ${comp.client2} (${comp.industry})`);
    });
    
    console.log('\n🛡️ CONFLICT MITIGATION:');
    negotiationResult.solution.requirements.forEach(req => {
        console.log(`- ${req.type}: ${req.description}`);
    });
    
    console.log('\n📋 NEXT STEPS:');
    negotiationResult.decision.next_steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NegotiationAgent, testNegotiationAgent };
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
// testNegotiationAgent();
}
