const fetch = require('node-fetch');

async function testRailwayServer() {
  const baseUrl = process.env.RAILWAY_STATIC_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing Railway Server...');
  console.log('📍 Base URL:', baseUrl);
  
  try {
    // Test health endpoint
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test context endpoint
    console.log('\n2️⃣ Testing context processing...');
    const contextResponse = await fetch(`${baseUrl}/api/process/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage: 'Test message for Railway',
        organizationId: 'test-org'
      })
    });
    
    if (contextResponse.ok) {
      const contextData = await contextResponse.json();
      console.log('✅ Context processing:', contextData.urgency?.level);
    } else {
      console.log('❌ Context failed:', contextResponse.status);
    }
    
    // Test policy endpoint
    console.log('\n3️⃣ Testing policy processing...');
    const policyResponse = await fetch(`${baseUrl}/api/process/policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contextOutput: { urgency: { level: 0.3 } },
        tool: 'ChatGPT',
        vendor: 'OpenAI',
        organizationId: 'test-org'
      })
    });
    
    if (policyResponse.ok) {
      const policyData = await policyResponse.json();
      console.log('✅ Policy processing:', policyData.workflow || 'completed');
    } else {
      console.log('❌ Policy failed:', policyResponse.status);
    }
    
    console.log('\n🎉 All Railway tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRailwayServer();