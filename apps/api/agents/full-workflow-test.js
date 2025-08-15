// Full Workflow Test: Context Agent → Policy Agent

const ContextAgent = require('../agents/context-agent.js');
const { PolicyAgent } = require('./policy-agent');

function runFullWorkflowTest() {
    console.log('🚦 FULL WORKFLOW TEST: Context Agent → Policy Agent\n');

    // 1. User input
    const userMessage = "Need to use ChatGPT for Monday's presentation!!!";
    console.log(`👤 USER: ${userMessage}\n`);

    // 2. Context Agent analyzes the request
    const contextAgent = new ContextAgent();
    const contextOutput = contextAgent.processUserInput(userMessage);
    console.log('🧠 CONTEXT AGENT OUTPUT:');
    console.log(JSON.stringify(contextOutput, null, 2));
    console.log('\n');

    // 3. Policy Agent makes compliance decision
    const policyAgent = new PolicyAgent();
    const policyDecision = policyAgent.evaluateRequest(contextOutput);
    console.log('🔒 POLICY AGENT DECISION:');
    console.log(JSON.stringify(policyDecision, null, 2));
    console.log('\n');

    // 4. Show end-to-end reasoning
    console.log('📝 END-TO-END REASONING:');
    console.log(`- Urgency detected: ${contextOutput.urgency.level} (${contextOutput.urgency.emotionalState})`);
    console.log(`- Inferred context: ${contextOutput.context.inferredType} (${(contextOutput.context.confidence * 100).toFixed(0)}% confidence)`);
    console.log(`- Clarifying question: "${contextOutput.clarification.question}"`);
    console.log(`- Policy status: ${policyDecision.decision.status.toUpperCase()} (${policyDecision.decision.type})`);
    console.log(`- Risk level: ${policyDecision.risk.level.toUpperCase()} (${(policyDecision.risk.score * 100).toFixed(0)}%)`);
    console.log(`- Reasoning: ${policyDecision.decision.reasoning}`);
    if (policyDecision.decision.status === 'approved') {
        console.log(`- Guardrails: ${Object.keys(policyDecision.conditions.guardrails).join(', ')}`);
        console.log(`- Monitoring: ${Object.keys(policyDecision.monitoring.requirements).join(', ')}`);
        console.log(`- Next steps: ${policyDecision.next_steps.join(' | ')}`);
    } else {
        console.log('- Escalation required or request denied.');
    }
}

if (require.main === module) {
    runFullWorkflowTest();
} 