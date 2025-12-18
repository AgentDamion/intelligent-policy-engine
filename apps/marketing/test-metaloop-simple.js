/**
 * Simple MetaLoop AI Test - Basic functionality verification
 */

const { metaLoopAIService } = require('./api/metaloop-ai-service');

async function testMetaLoopBasic() {
  console.log('🧠 Testing MetaLoop AI Basic Functionality...\n');
  
  const testCases = [
    {
      message: "Hello, can you help me with compliance?",
      context: { userId: 'test-user-1', organizationId: 'demo-org' }
    },
    {
      message: "What's the status of our FDA submission?",
      context: { userId: 'test-user-2', organizationId: 'demo-org' }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📝 Test Case ${i + 1}: "${testCase.message}"`);
    
    try {
      const startTime = Date.now();
      const result = await metaLoopAIService.processQuery(testCase.message, testCase.context);
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Success: ${result.success}`);
      console.log(`⏱️  Processing Time: ${processingTime}ms`);
      console.log(`🎯 Response: ${result.response.substring(0, 100)}...`);
      
      if (result.actions && result.actions.length > 0) {
        console.log(`🔧 Actions: ${result.actions.length} actions identified`);
      }
      
      if (result.suggestions && result.suggestions.length > 0) {
        console.log(`💡 Suggestions: ${result.suggestions.length} suggestions provided`);
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Test Case ${i + 1} Failed:`, error.message);
      console.log('---\n');
    }
  }
  
  console.log('🎉 MetaLoop AI Basic Test Complete!');
}

testMetaLoopBasic().catch(console.error); 