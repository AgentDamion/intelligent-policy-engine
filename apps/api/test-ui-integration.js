/**
 * Test UI Integration - Verify MetaLoop AI API endpoint
 */

const { metaLoopAIService } = require('./api/metaloop-ai-service');

async function testUIIntegration() {
  console.log('🧠 Testing MetaLoop AI UI Integration...\n');
  
  // Simulate the exact request format that the UI sends
  const uiRequest = {
    message: "Check FDA compliance for our new AI tool",
    context: {
      userId: 'ui-test-user',
      organizationId: 'demo-org',
      userMessage: "Check FDA compliance for our new AI tool",
      timestamp: new Date().toISOString()
    }
  };
  
  console.log('📝 UI Request:', uiRequest.message);
  console.log('👤 User Context:', uiRequest.context.userId);
  
  try {
    const startTime = Date.now();
    const result = await metaLoopAIService.processQuery(uiRequest.message, uiRequest.context);
    const processingTime = Date.now() - startTime;
    
    console.log('\n✅ MetaLoop AI Response:');
    console.log(`📊 Success: ${result.success}`);
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`🎯 Response: ${result.response.substring(0, 150)}...`);
    console.log(`💡 Suggestions: ${result.suggestions?.length || 0} suggestions`);
    console.log(`🔧 Actions: ${result.actions?.length || 0} actions`);
    console.log(`🧠 Learning: ${result.learning ? 'Pattern recognized' : 'No learning data'}`);
    
    // Verify the response format matches what the UI expects
    const expectedFields = ['success', 'response', 'actions', 'suggestions', 'insights', 'confidence', 'learning'];
    const missingFields = expectedFields.filter(field => !(field in result));
    
    if (missingFields.length === 0) {
      console.log('\n✅ All expected response fields present');
    } else {
      console.log(`\n⚠️  Missing fields: ${missingFields.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ UI Integration Test Failed:', error.message);
  }
  
  console.log('\n🎉 MetaLoop AI UI Integration Test Complete!');
}

testUIIntegration().catch(console.error); 