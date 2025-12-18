// Test script for Enterprise Dashboard Mock API
// Run: node test-enterprise-backend.js

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testEndpoint(method, url, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`\n🔍 ${method} ${url}`);
    if (body) console.log(`📤 Body:`, JSON.stringify(body, null, 2));
    
    const response = await fetch(url, options);
    console.log(`📥 Status: ${response.status}`);
    
    const data = await response.json();
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Enterprise Dashboard Backend Tests...\n');
  
  // Test all enterprise endpoints
  const tests = [
    { 
      name: '🏢 ENTERPRISE OVERVIEW',
      method: 'GET', 
      url: `${API_BASE}/enterprise/overview` 
    },
    { 
      name: '🔥 RISK HEAT MAP',
      method: 'GET', 
      url: `${API_BASE}/risk/heatmap?window=7d` 
    },
    { 
      name: '🧠 META-LOOP INTELLIGENCE',
      method: 'GET', 
      url: `${API_BASE}/intel/metaloop/latest` 
    },
    { 
      name: '📝 APPROVALS QUEUE',
      method: 'GET', 
      url: `${API_BASE}/approvals` 
    },
    { 
      name: '⏱️ ACTIVITY TIMELINE',
      method: 'GET', 
      url: `${API_BASE}/audit/timeline?window=7d` 
    },
    { 
      name: '💚 PARTNER HEALTH',
      method: 'GET', 
      url: `${API_BASE}/partners/health?window=7d` 
    },
    { 
      name: '🔄 ROUTE TO REVIEW',
      method: 'POST', 
      url: `${API_BASE}/intel/metaloop/route-to-review`,
      body: { recommendationId: 'rec_001' }
    },
    { 
      name: '✅ BULK APPROVAL',
      method: 'POST', 
      url: `${API_BASE}/approvals/bulk`,
      body: { action: 'approve', ids: ['app_001', 'app_002'] }
    },
    { 
      name: '🔍 DEBUG STATUS',
      method: 'GET', 
      url: `${API_BASE}/debug/status` 
    }
  ];
  
  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('='.repeat(50));
    
    const result = await testEndpoint(test.method, test.url, test.body);
    
    if (result.error) {
      console.log('❌ FAILED');
    } else if (result.status === 200) {
      console.log('✅ PASSED');
    } else {
      console.log(`⚠️  UNEXPECTED STATUS: ${result.status}`);
    }
  }
  
  console.log('\n✅ Enterprise Dashboard backend testing complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Check that all endpoints returned expected data structures');
  console.log('2. Run the UI and test the complete dashboard');
  console.log('3. Verify interactive features (heat map clicks, bulk actions, etc.)');
  console.log('4. Test error handling and loading states');
}

runTests().catch(console.error);
