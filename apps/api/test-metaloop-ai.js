/**
 * Test MetaLoop AI Service
 * Verifies that the intelligent MetaLoop system is working correctly
 */

const { metaLoopAIService } = require('./api/metaloop-ai-service');

async function testMetaLoopAI() {
  console.log('🧠 Testing MetaLoop AI Service...\n');
  
  const testCases = [
    {
      message: "Check FDA compliance for our new AI tool",
      context: {
        userId: "test-user-1",
        organizationId: "test-org-1",
        userRole: "compliance_officer"
      }
    },
    {
      message: "Review our policy for social media marketing",
      context: {
        userId: "test-user-2", 
        organizationId: "test-org-1",
        userRole: "marketing_manager"
      }
    },
    {
      message: "Submit our new AI tool for approval",
      context: {
        userId: "test-user-3",
        organizationId: "test-org-2", 
        userRole: "agency_admin"
      }
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
        console.log(`⚡ Actions: ${result.actions.length} actions detected`);
      }
      
      if (result.suggestions && result.suggestions.length > 0) {
        console.log(`💡 Suggestions: ${result.suggestions.length} suggestions provided`);
      }
      
      if (result.learning) {
        console.log(`🧠 Learning: Pattern recognized - ${result.learning.pattern_recognized}`);
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Test Case ${i + 1} Failed:`, error.message);
      console.log('---\n');
    }
  }
  
  console.log('🎉 MetaLoop AI Test Complete!');
}

// Run the test
testMetaLoopAI().catch(console.error); 