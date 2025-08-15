/**
 * Test script to check API endpoints and identify issues
 */

const axios = require('axios');

async function testEndpoints() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 Testing API Endpoints...\n');
  
  try {
    // Test 1: Health endpoint
    console.log('1️⃣ Testing /api/health...');
    const healthResponse = await axios.get(`${baseUrl}/api/health`);
    console.log('✅ Health endpoint working:', healthResponse.data);
    
    // Test 2: Policies endpoint
    console.log('\n2️⃣ Testing /api/policies...');
    const policiesResponse = await axios.get(`${baseUrl}/api/policies`);
    console.log('✅ Policies endpoint working:', policiesResponse.data);
    
    // Test 3: Context processing endpoint
    console.log('\n3️⃣ Testing /api/process/context...');
    try {
      const contextResponse = await axios.post(`${baseUrl}/api/process/context`, {
        userMessage: 'Test message for context processing',
        organizationId: 'test-org',
        userId: 'test-user'
      });
      console.log('✅ Context processing working:', contextResponse.data);
    } catch (error) {
      console.log('❌ Context processing failed:', error.response?.status, error.response?.data);
    }
    
    // Test 4: Authentication endpoints
    console.log('\n4️⃣ Testing /api/auth/login...');
    try {
      const authResponse = await axios.post(`${baseUrl}/api/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      });
      console.log('✅ Auth endpoint working:', authResponse.data);
    } catch (error) {
      console.log('❌ Auth endpoint failed:', error.response?.status, error.response?.data);
    }
    
    // Test 5: Agent status
    console.log('\n5️⃣ Testing /api/agents/status...');
    try {
      const agentResponse = await axios.get(`${baseUrl}/api/agents/status`);
      console.log('✅ Agent status working:', agentResponse.data);
    } catch (error) {
      console.log('❌ Agent status failed:', error.response?.status, error.response?.data);
    }
    
    // Test 6: Enhanced orchestration
    console.log('\n6️⃣ Testing /api/enhanced-orchestration/process...');
    try {
      const orchestrationResponse = await axios.post(`${baseUrl}/api/enhanced-orchestration/process`, {
        type: 'test',
        content: 'Test content',
        metadata: {}
      });
      console.log('✅ Orchestration working:', orchestrationResponse.data);
    } catch (error) {
      console.log('❌ Orchestration failed:', error.response?.status, error.response?.data);
    }
    
    // Test 7: Governance events
    console.log('\n7️⃣ Testing /api/governance/events...');
    try {
      const eventsResponse = await axios.get(`${baseUrl}/api/governance/events`);
      console.log('✅ Governance events working:', eventsResponse.data);
    } catch (error) {
      console.log('❌ Governance events failed:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoints();
