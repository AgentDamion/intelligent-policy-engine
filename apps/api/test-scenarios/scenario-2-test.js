// Test Scenario 2: Multi-Client Creative Tool Usage
// Input: "Using Midjourney for campaign images serving Pfizer, Novartis, and Roche"

const { ContextAgent } = require('../agents/context-agent');
const { PolicyAgent } = require('../agents/policy-agent');

function testScenario2() {
    console.log('🧪 TEST SCENARIO 2: Multi-Client Creative Tool Usage\n');

    // Test input
    const userMessage = "Using Midjourney for campaign images serving Pfizer, Novartis, and Roche";
    console.log(`👤 USER: ${userMessage}\n`);

    // Initialize agents
    const contextAgent = new ContextAgent();
    const policyAgent = new PolicyAgent();

    console.log('🔍 STEP 1: Context Agent Analysis');
    console.log('=' .repeat(50));
    
    // Process with Context Agent
    const contextOutput = contextAgent.processUserInput(userMessage);
    
    console.log('📊 CONTEXT AGENT OUTPUT:');
    console.log(JSON.stringify(contextOutput, null, 2));
    
    console.log('\n🎯 CONTEXT ANALYSIS INSIGHTS:');
    console.log(`- Urgency Level: ${contextOutput.urgency.level.toFixed(2)} (${contextOutput.urgency.emotionalState})`);
    console.log(`- Inferred Context: ${contextOutput.context.inferredType} (${(contextOutput.context.confidence * 100).toFixed(0)}% confidence)`);
    console.log(`- Clarifying Question: "${contextOutput.clarification.question}"`);
    console.log(`- Reasoning: ${contextOutput.context.reasoning.join(', ')}`);

    console.log('\n🔒 STEP 2: Policy Agent Evaluation');
    console.log('=' .repeat(50));
    
    // Process with Policy Agent
    const policyDecision = policyAgent.evaluateRequest(contextOutput);
    
    console.log('📋 POLICY AGENT DECISION:');
    console.log(JSON.stringify(policyDecision, null, 2));
    
    console.log('\n🎯 POLICY ANALYSIS INSIGHTS:');
    console.log(`- Decision Status: ${policyDecision.decision.status.toUpperCase()}`);
    console.log(`- Decision Type: ${policyDecision.decision.type}`);
    console.log(`- Risk Level: ${policyDecision.risk.level.toUpperCase()} (${(policyDecision.risk.score * 100).toFixed(0)}%)`);
    console.log(`- Reasoning: ${policyDecision.decision.reasoning}`);
    
    if (policyDecision.escalation) {
        console.log(`- Escalation Required: YES (${policyDecision.escalation.approver})`);
    } else {
        console.log('- Escalation Required: NO');
    }

    console.log('\n🔍 STEP 3: Intelligence Gap Analysis');
    console.log('=' .repeat(50));
    
    analyzeIntelligenceGaps(userMessage, contextOutput, policyDecision);

    console.log('\n📋 STEP 4: Recommendations');
    console.log('=' .repeat(50));
    
    provideRecommendations(contextOutput, policyDecision);
}

function analyzeIntelligenceGaps(userMessage, contextOutput, policyDecision) {
    console.log('🔍 IDENTIFIED GAPS:');
    
    const gaps = [];
    
    // Check for multi-client handling
    if (!userMessage.includes('multiple clients') && !userMessage.includes('Pfizer') && !userMessage.includes('Novartis') && !userMessage.includes('Roche')) {
        gaps.push('❌ Multi-client detection: Context Agent may not recognize multiple pharmaceutical clients');
    }
    
    // Check for creative tool handling
    if (userMessage.includes('Midjourney') && contextOutput.context.inferredType === 'client_presentation') {
        gaps.push('❌ Creative tool recognition: Context Agent may not differentiate between text and image generation tools');
    }
    
    // Check for client conflict detection
    if (!policyDecision.risk.factors.some(factor => factor.includes('client conflict') || factor.includes('competitive'))) {
        gaps.push('❌ Client conflict detection: Policy Agent may not identify potential conflicts between competing pharmaceutical companies');
    }
    
    // Check for image-specific policies
    if (userMessage.includes('images') && !policyDecision.conditions.guardrails.image_review) {
        gaps.push('❌ Image-specific policies: Policy Agent may not have specific guardrails for image generation vs text generation');
    }
    
    // Check for pharmaceutical industry specifics
    if (!policyDecision.conditions.compliance_requirements.some(req => req.includes('pharmaceutical') || req.includes('FDA') || req.includes('regulatory'))) {
        gaps.push('❌ Industry-specific compliance: Policy Agent may not include pharmaceutical industry regulations');
    }
    
    if (gaps.length === 0) {
        console.log('✅ No significant gaps identified - agents handled the scenario well');
    } else {
        gaps.forEach(gap => console.log(gap));
    }
}

function provideRecommendations(contextOutput, policyDecision) {
    console.log('💡 RECOMMENDATIONS:');
    
    const recommendations = [];
    
    // Context Agent improvements
    recommendations.push('🔧 Context Agent Enhancements:');
    recommendations.push('  - Add multi-client detection logic');
    recommendations.push('  - Differentiate between text and image generation tools');
    recommendations.push('  - Include industry-specific context (pharmaceutical, healthcare)');
    recommendations.push('  - Add client relationship mapping');
    
    // Policy Agent improvements
    recommendations.push('\n🔧 Policy Agent Enhancements:');
    recommendations.push('  - Add client conflict detection algorithms');
    recommendations.push('  - Include image-specific compliance requirements');
    recommendations.push('  - Add pharmaceutical industry regulations (FDA, EMA)');
    recommendations.push('  - Implement competitive intelligence safeguards');
    
    // System improvements
    recommendations.push('\n🔧 System Improvements:');
    recommendations.push('  - Add client database integration');
    recommendations.push('  - Implement industry-specific policy templates');
    recommendations.push('  - Add regulatory compliance checking');
    recommendations.push('  - Include competitive analysis tools');
    
    recommendations.forEach(rec => console.log(rec));
}

// Run the test
if (require.main === module) {
    testScenario2();
}

module.exports = { testScenario2 }; 