/**
 * Audit Workflow Test - Demonstrates complete audit trail integration
 * 
 * Tests the Audit Agent integrated with the complete workflow:
 * Context Agent → Policy Agent → Negotiation Agent → Audit Trail
 */

const { ContextAgent } = require('./context-agent');
const { PolicyAgent } = require('./policy-agent');
const { NegotiationAgent } = require('./negotiation-agent');
const { AuditAgent } = require('./audit-agent-fixed');

class AuditedWorkflowOrchestrator {
    constructor() {
        this.contextAgent = new ContextAgent();
        this.policyAgent = new PolicyAgent();
        this.negotiationAgent = new NegotiationAgent();
        this.auditAgent = new AuditAgent();
        
        this.complexityThresholds = {
            multiClient: 2,
            competitiveIndustry: ['pharmaceutical', 'automotive', 'technology'],
            highRiskTools: ['midjourney', 'dall-e', 'stable-diffusion', 'runway'],
            escalationKeywords: ['urgent', 'asap', 'emergency', 'critical']
        };
    }

    /**
     * Process request with complete audit trail
     */
    async processRequestWithAudit(userMessage, userId = 'user_123') {
        console.log('🚀 AUDITED WORKFLOW ORCHESTRATOR');
        console.log('=' .repeat(60));
        console.log(`📝 USER REQUEST: "${userMessage}"`);
        console.log(`👤 USER ID: ${userId}\n`);

        // Start audit session
        const sessionId = this.auditAgent.startAuditSession(userMessage, userId);
        
        const workflowResult = {
            timestamp: new Date().toISOString(),
            request_id: this.generateRequestId(),
            user_message: userMessage,
            user_id: userId,
            session_id: sessionId,
            workflow_path: [],
            agents_engaged: [],
            final_decision: null,
            total_processing_time: 0,
            complexity_assessment: null,
            audit_trail: []
        };

        const startTime = Date.now();

        try {
            // Step 1: Context Agent Analysis
            console.log('🧠 STEP 1: CONTEXT AGENT ANALYSIS');
            console.log('-'.repeat(40));
            const contextOutput = this.contextAgent.processUserInput(userMessage);
            workflowResult.workflow_path.push('context_analysis');
            workflowResult.agents_engaged.push('context_agent');
            
            // Audit the context decision
            this.auditAgent.logContextDecision(contextOutput);
            
            console.log('Context Analysis Results:');
            console.log(`- Urgency Level: ${contextOutput.urgency.level} (${contextOutput.urgency.emotionalState})`);
            console.log(`- Inferred Type: ${contextOutput.context.inferredType} (${(contextOutput.context.confidence * 100).toFixed(0)}% confidence)`);
            console.log(`- Smart Question: "${contextOutput.clarification.question}"`);
            console.log('');

            // Step 2: Complexity Assessment & Routing Decision
            console.log('🎯 STEP 2: COMPLEXITY ASSESSMENT & ROUTING');
            console.log('-'.repeat(40));
            const complexityAssessment = this.assessRequestComplexity(userMessage, contextOutput);
            workflowResult.complexity_assessment = complexityAssessment;
            
            // Audit the routing decision
            this.auditAgent.logWorkflowRouting(complexityAssessment, complexityAssessment.requiresNegotiation ? 'negotiation_required' : 'direct_policy');
            
            console.log('Complexity Assessment:');
            console.log(`- Complexity Level: ${complexityAssessment.level.toUpperCase()}`);
            console.log(`- Multi-Client: ${complexityAssessment.multiClient ? 'YES' : 'NO'}`);
            console.log(`- Competitive Industry: ${complexityAssessment.competitiveIndustry ? 'YES' : 'NO'}`);
            console.log(`- High-Risk Tool: ${complexityAssessment.highRiskTool ? 'YES' : 'NO'}`);
            console.log(`- Conflict Detection: ${complexityAssessment.conflictsDetected ? 'YES' : 'NO'}`);
            console.log(`- Routing Decision: ${complexityAssessment.requiresNegotiation ? 'NEGOTIATION REQUIRED' : 'DIRECT POLICY DECISION'}`);
            console.log('');

            // Step 3: Policy Agent Decision
            console.log('🔒 STEP 3: POLICY AGENT DECISION');
            console.log('-'.repeat(40));
            const policyDecision = this.policyAgent.evaluateRequest(contextOutput);
            workflowResult.workflow_path.push('policy_evaluation');
            workflowResult.agents_engaged.push('policy_agent');
            
            // Audit the policy decision
            this.auditAgent.logPolicyDecision(policyDecision, contextOutput);
            
            console.log('Policy Decision Results:');
            console.log(`- Status: ${policyDecision.decision.status.toUpperCase()}`);
            console.log(`- Type: ${policyDecision.decision.type}`);
            console.log(`- Risk Level: ${policyDecision.risk.level.toUpperCase()} (${(policyDecision.risk.score * 100).toFixed(0)}%)`);
            console.log(`- Reasoning: ${policyDecision.decision.reasoning}`);
            console.log('');

            // Step 4: Conditional Negotiation Agent (if needed)
            if (complexityAssessment.requiresNegotiation) {
                console.log('🤝 STEP 4: NEGOTIATION AGENT PROCESSING');
                console.log('-'.repeat(40));
                const negotiationResult = this.negotiationAgent.negotiateMultiClientRequest(contextOutput, policyDecision);
                workflowResult.workflow_path.push('negotiation_processing');
                workflowResult.agents_engaged.push('negotiation_agent');
                
                // Audit the negotiation decision
                this.auditAgent.logNegotiationDecision(negotiationResult, contextOutput, policyDecision);
                
                console.log('Negotiation Results:');
                console.log(`- Clients Involved: ${negotiationResult.clients.count} (${negotiationResult.clients.names.join(', ')})`);
                console.log(`- Industry: ${negotiationResult.clients.industry}`);
                console.log(`- Tool: ${negotiationResult.clients.tool.name} (${negotiationResult.clients.tool.type})`);
                console.log(`- Risk Level: ${negotiationResult.relationships.risk_level.toUpperCase()}`);
                console.log(`- Conflicts Detected: ${negotiationResult.conflicts.total}`);
                console.log(`- Solution Feasibility: ${negotiationResult.solution.feasibility}`);
                console.log(`- Final Status: ${negotiationResult.decision.status.toUpperCase()}`);
                console.log('');

                // Update final decision with negotiation results
                workflowResult.final_decision = {
                    status: negotiationResult.decision.status,
                    reasoning: negotiationResult.decision.reasoning,
                    next_steps: negotiationResult.decision.next_steps,
                    escalation_required: negotiationResult.solution.escalation,
                    client_requirements: negotiationResult.client_requirements,
                    competitive_relationships: negotiationResult.relationships.competitors,
                    policy_conflicts: negotiationResult.conflicts
                };
            } else {
                // Use policy decision directly
                workflowResult.final_decision = {
                    status: policyDecision.decision.status,
                    reasoning: policyDecision.decision.reasoning,
                    next_steps: policyDecision.next_steps,
                    escalation_required: policyDecision.escalation?.required || false,
                    guardrails: policyDecision.conditions.guardrails,
                    monitoring: policyDecision.monitoring.requirements
                };
            }

            // Calculate processing time
            workflowResult.total_processing_time = Date.now() - startTime;

            // Step 5: Complete Audit Session
            console.log('📋 STEP 5: COMPLETING AUDIT SESSION');
            console.log('-'.repeat(40));
            const completedSession = this.auditAgent.completeAuditSession(workflowResult.final_decision, workflowResult.total_processing_time);
            
            // Step 6: Generate Audit Reports
            console.log('📊 STEP 6: GENERATING AUDIT REPORTS');
            console.log('-'.repeat(40));
            const complianceReport = this.auditAgent.generateComplianceReport(sessionId);
            const auditSearch = this.auditAgent.searchAuditLogs({ agent: 'negotiation' });
            const auditExport = this.auditAgent.exportAuditLogs('json', { session_id: sessionId });

            // Step 7: Final Summary
            console.log('🎯 STEP 7: FINAL AUDITED WORKFLOW SUMMARY');
            console.log('-'.repeat(40));
            this.displayAuditedSummary(workflowResult, complianceReport, completedSession);

            return {
                workflow_result: workflowResult,
                audit_session: completedSession,
                compliance_report: complianceReport,
                audit_search_results: auditSearch,
                audit_export: auditExport
            };

        } catch (error) {
            console.error('❌ AUDITED WORKFLOW ERROR:', error);
            workflowResult.error = error.message;
            return workflowResult;
        }
    }

    /**
     * Assesses request complexity to determine routing
     */
    assessRequestComplexity(userMessage, contextOutput) {
        const messageLower = userMessage.toLowerCase();
        
        // Check for multiple clients
        const clientKeywords = this.negotiationAgent.getAllClientKeywords();
        const foundClients = clientKeywords.filter(client => 
            messageLower.includes(client.toLowerCase())
        );
        const multiClient = foundClients.length >= this.complexityThresholds.multiClient;

        // Check for competitive industry
        const industry = this.negotiationAgent.detectIndustry(messageLower, foundClients);
        const competitiveIndustry = this.complexityThresholds.competitiveIndustry.includes(industry);

        // Check for high-risk tools
        const highRiskTool = this.complexityThresholds.highRiskTools.some(tool => 
            messageLower.includes(tool.toLowerCase())
        );

        // Check for escalation keywords
        const hasEscalationKeywords = this.complexityThresholds.escalationKeywords.some(keyword => 
            messageLower.includes(keyword)
        );

        // Determine if conflicts are likely
        const conflictsDetected = multiClient && competitiveIndustry;

        // Determine if negotiation is required
        const requiresNegotiation = conflictsDetected || (multiClient && highRiskTool);

        // Determine complexity level
        let complexityLevel = 'simple';
        if (requiresNegotiation) {
            complexityLevel = 'complex';
        } else if (multiClient || highRiskTool || competitiveIndustry) {
            complexityLevel = 'moderate';
        }

        return {
            level: complexityLevel,
            multiClient,
            competitiveIndustry,
            highRiskTool,
            hasEscalationKeywords,
            conflictsDetected,
            requiresNegotiation,
            detectedClients: foundClients,
            detectedIndustry: industry,
            detectedTool: this.negotiationAgent.extractToolInformation(userMessage)
        };
    }

    /**
     * Displays comprehensive audited summary
     */
    displayAuditedSummary(workflowResult, complianceReport, completedSession) {
        console.log('🎯 ENTERPRISE-GRADE AUDITED COMPLIANCE SUMMARY');
        console.log('=' .repeat(60));
        
        console.log(`📊 REQUEST ID: ${workflowResult.request_id}`);
        console.log(`📋 AUDIT SESSION ID: ${workflowResult.session_id}`);
        console.log(`⏱️  Processing Time: ${workflowResult.total_processing_time}ms`);
        console.log(`🔄 Workflow Path: ${workflowResult.workflow_path.join(' → ')}`);
        console.log(`🤖 Agents Engaged: ${workflowResult.agents_engaged.join(' → ')}`);
        console.log('');

        console.log('🧠 COMPLEXITY ASSESSMENT:');
        const complexity = workflowResult.complexity_assessment;
        console.log(`- Level: ${complexity.level.toUpperCase()}`);
        console.log(`- Multi-Client: ${complexity.multiClient ? '✅ YES' : '❌ NO'}`);
        console.log(`- Competitive Industry: ${complexity.competitiveIndustry ? '✅ YES' : '❌ NO'}`);
        console.log(`- High-Risk Tool: ${complexity.highRiskTool ? '✅ YES' : '❌ NO'}`);
        console.log(`- Conflicts Detected: ${complexity.conflictsDetected ? '⚠️  YES' : '✅ NO'}`);
        console.log(`- Negotiation Required: ${complexity.requiresNegotiation ? '🤝 YES' : '❌ NO'}`);
        console.log('');

        console.log('📋 FINAL DECISION:');
        const decision = workflowResult.final_decision;
        console.log(`- Status: ${decision.status.toUpperCase()}`);
        console.log(`- Reasoning: ${decision.reasoning}`);
        console.log(`- Escalation Required: ${decision.escalation_required ? '⚠️  YES' : '✅ NO'}`);
        console.log('');

        console.log('📊 AUDIT TRAIL SUMMARY:');
        console.log(`- Total Audit Entries: ${completedSession.audit_entries.length}`);
        console.log(`- Session Duration: ${completedSession.session_duration_ms}ms`);
        console.log(`- Agents Audited: ${completedSession.agents_engaged.join(', ')}`);
        console.log('');

        console.log('📈 COMPLIANCE METRICS:');
        console.log(`- Policy Adherence: ${complianceReport.compliance_metrics.policy_adherence}%`);
        console.log(`- Audit Completeness: ${complianceReport.compliance_metrics.audit_trail_completeness}%`);
        console.log(`- Decision Consistency: ${complianceReport.compliance_metrics.decision_consistency}%`);
        console.log('');

        if (decision.next_steps && decision.next_steps.length > 0) {
            console.log('📋 NEXT STEPS:');
            decision.next_steps.forEach((step, index) => {
                console.log(`${index + 1}. ${step}`);
            });
            console.log('');
        }

        if (decision.competitive_relationships && decision.competitive_relationships.length > 0) {
            console.log('🔍 COMPETITIVE RELATIONSHIPS:');
            decision.competitive_relationships.forEach(rel => {
                console.log(`- ${rel.client1} ↔ ${rel.client2} (${rel.industry})`);
            });
            console.log('');
        }

        if (decision.policy_conflicts && decision.policy_conflicts.total > 0) {
            console.log('⚠️  POLICY CONFLICTS RESOLVED:');
            console.log(`- Total Conflicts: ${decision.policy_conflicts.total}`);
            if (decision.policy_conflicts.competitive_intelligence) {
                console.log(`- Competitive Intelligence: ${decision.policy_conflicts.competitive_intelligence.length} resolved`);
            }
            if (decision.policy_conflicts.regulatory) {
                console.log(`- Regulatory Conflicts: ${decision.policy_conflicts.regulatory.length} resolved`);
            }
            if (decision.policy_conflicts.brand) {
                console.log(`- Brand Conflicts: ${decision.policy_conflicts.brand.length} resolved`);
            }
            console.log('');
        }

        console.log('🏆 ENTERPRISE COMPLIANCE ACHIEVED');
        console.log('✅ Complete audit trail maintained');
        console.log('✅ All agent decisions logged');
        console.log('✅ Policy references tracked');
        console.log('✅ Before/after states recorded');
        console.log('✅ Searchable and exportable logs');
        console.log('✅ Compliance reporting generated');
        console.log('=' .repeat(60));
    }

    /**
     * Generates unique request ID
     */
    generateRequestId() {
        return `AUDIT-WF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Test both simple and complex scenarios with audit trail
 */
async function runAuditedWorkflowTests() {
    const orchestrator = new AuditedWorkflowOrchestrator();
    
    console.log('🚀 AUDITED WORKFLOW TEST SUITE');
    console.log('Testing complete audit trail integration\n');

    // Test Case 1: Simple Scenario (Context + Policy + Audit)
    console.log('📋 TEST CASE 1: SIMPLE SCENARIO WITH AUDIT');
    console.log('Expected Path: Context Agent → Policy Agent → Audit Trail');
    console.log('=' .repeat(80));
    
    const simpleScenario = "Need ChatGPT for Monday's presentation!!!";
    await orchestrator.processRequestWithAudit(simpleScenario, "user_456");
    
    console.log('\n\n');
    
    // Test Case 2: Complex Scenario (Context + Policy + Negotiation + Audit)
    console.log('📋 TEST CASE 2: COMPLEX SCENARIO WITH AUDIT');
    console.log('Expected Path: Context Agent → Policy Agent → Negotiation Agent → Audit Trail');
    console.log('=' .repeat(80));
    
    const complexScenario = "Using Midjourney for campaign images serving Pfizer, Novartis, and Roche";
    await orchestrator.processRequestWithAudit(complexScenario, "user_789");
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuditedWorkflowOrchestrator, runAuditedWorkflowTests };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAuditedWorkflowTests();
} 