import dotenv from 'dotenv';

dotenv.config();

async function testAIGovernance() {
  console.log('=== TESTING NEW AI GOVERNANCE SYSTEM ===');
  console.log('This tests the AI-powered governance decisions for agency requests');
  console.log('');
  
  try {
    // Import our NEW governance API
    const { default: governanceHandler } = await import('./api/ai/governance-analysis.js');
    
    console.log('🧪 Test 1: Agency Tool Request');
    await testGovernanceDecision(governanceHandler, {
      requestType: 'agency_tool_request',
      content: 'Ogilvy requests approval to use ChatGPT-4 for diabetes patient education materials',
      clientId: 'pfizer-123',
      agencyId: 'ogilvy-456'
    });

    console.log('🧪 Test 2: High-Risk Content Review');
    await testGovernanceDecision(governanceHandler, {
      requestType: 'ai_content_submission', 
      content: 'AI-generated social media: "Our arthritis drug reduces pain by 90%! Most effective treatment available!"',
      clientId: 'jnj-789',
      agencyId: 'mccann-101'
    });

  } catch (error) {
    console.error('❌ AI Governance test failed:', error.message);
  }
}

async function testGovernanceDecision(handler, testData) {
  const mockReq = { method: 'POST', body: testData };
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        console.log(`✅ Decision: ${data.decision.recommendation}`);
        console.log(`🤖 AI Provider: ${data.aiProvider}`);
        console.log(`👤 Human Review: ${data.requiresHumanReview ? 'Required' : 'Not needed'}`);
        console.log(`🎯 Confidence: ${data.decision.confidence}`);
        console.log('');
      }
    })
  };
  
  await handler(mockReq, mockRes);
}

testAIGovernance();