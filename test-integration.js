#!/usr/bin/env node

/**
 * Integration Test Script
 * Tests all the implemented components for beta launch readiness
 */

import fetch from 'node-fetch';
import WebSocket from 'ws';

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

// Mock JWT token for testing (in production, this would come from Supabase auth)
const MOCK_TOKEN = 'mock-jwt-token-for-testing';

console.log('🧪 Starting Integration Tests for Beta Launch\n');

async function testHealthCheck() {
  console.log('1️⃣ Testing Health Check...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      console.log('✅ Health check passed');
      return true;
    } else {
      console.log('❌ Health check failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testSystemStatus() {
  console.log('\n2️⃣ Testing System Status API...');
  try {
    const response = await fetch(`${BASE_URL}/api/status`);
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      console.log('✅ System status API working');
      console.log(`   Database: ${data.database}`);
      console.log(`   Uptime: ${data.uptime}s`);
      return true;
    } else {
      console.log('❌ System status failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ System status error:', error.message);
    return false;
  }
}

async function testAgentActivityIngestion() {
  console.log('\n3️⃣ Testing Agent Activity Ingestion...');
  try {
    const testActivity = {
      agent: 'Test Agent',
      action: 'Integration Test',
      status: 'success',
      details: {
        test: true,
        timestamp: new Date().toISOString()
      },
      workspace_id: 'test-workspace',
      enterprise_id: 'test-enterprise'
    };

    const response = await fetch(`${BASE_URL}/api/agent/activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOCK_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testActivity)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Agent activity ingestion working');
      console.log(`   Activity ID: ${data.data.id}`);
      return true;
    } else {
      console.log('❌ Agent activity ingestion failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Agent activity ingestion error:', error.message);
    return false;
  }
}

async function testAgentActivityFeed() {
  console.log('\n4️⃣ Testing Agent Activity Feed...');
  try {
    const response = await fetch(`${BASE_URL}/api/agent/activity?limit=5`, {
      headers: {
        'Authorization': `Bearer ${MOCK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok && Array.isArray(data.activities)) {
      console.log('✅ Agent activity feed working');
      console.log(`   Activities: ${data.activities.length}`);
      console.log(`   Total: ${data.total}`);
      return true;
    } else {
      console.log('❌ Agent activity feed failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Agent activity feed error:', error.message);
    return false;
  }
}

async function testConflictAnalysis() {
  console.log('\n5️⃣ Testing Conflict Analysis...');
  try {
    const testPolicies = [
      {
        id: 'policy-1',
        name: 'AI Content Policy',
        content: 'All AI content must be reviewed'
      },
      {
        id: 'policy-2',
        name: 'Privacy Policy',
        content: 'No personal data in AI processing'
      }
    ];

    const response = await fetch(`${BASE_URL}/api/analyze-conflicts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOCK_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ policies: testPolicies })
    });

    const data = await response.json();
    
    if (response.ok && data.success && data.data) {
      console.log('✅ Conflict analysis working');
      console.log(`   Conflicts found: ${data.data.conflicts.length}`);
      console.log(`   Severity: ${data.data.overallSeverity}`);
      return true;
    } else {
      console.log('❌ Conflict analysis failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Conflict analysis error:', error.message);
    return false;
  }
}

async function testWebSocketConnection() {
  console.log('\n6️⃣ Testing WebSocket Connection...');
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(`${WS_URL}?token=${MOCK_TOKEN}`);
      
      const timeout = setTimeout(() => {
        console.log('❌ WebSocket connection timeout');
        ws.close();
        resolve(false);
      }, 5000);

      ws.on('open', () => {
        console.log('✅ WebSocket connection established');
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      });

      ws.on('error', (error) => {
        console.log('❌ WebSocket connection error:', error.message);
        clearTimeout(timeout);
        resolve(false);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'connected') {
            console.log('✅ WebSocket authentication successful');
          }
        } catch (e) {
          // Ignore parsing errors for now
        }
      });

    } catch (error) {
      console.log('❌ WebSocket test error:', error.message);
      resolve(false);
    }
  });
}

async function testErrorHandling() {
  console.log('\n7️⃣ Testing Error Handling...');
  
  const tests = [
    {
      name: 'Invalid endpoint',
      url: `${BASE_URL}/api/nonexistent`,
      expectedStatus: 404
    },
    {
      name: 'Missing auth token',
      url: `${BASE_URL}/api/me`,
      expectedStatus: 401
    },
    {
      name: 'Invalid conflict analysis',
      url: `${BASE_URL}/api/analyze-conflicts`,
      method: 'POST',
      body: { policies: [] },
      expectedStatus: 400
    }
  ];

  let passed = 0;
  
  for (const test of tests) {
    try {
      const options = {
        method: test.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name} - correct error status`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - expected ${test.expectedStatus}, got ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - error:`, error.message);
    }
  }
  
  return passed === tests.length;
}

async function runAllTests() {
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testSystemStatus());
  results.push(await testAgentActivityIngestion());
  results.push(await testAgentActivityFeed());
  results.push(await testConflictAnalysis());
  results.push(await testWebSocketConnection());
  results.push(await testErrorHandling());
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Your system is ready for beta launch!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run the RLS fix script in Supabase: fix-rls-policies.sql');
    console.log('2. Set up your environment variables');
    console.log('3. Deploy to production');
    console.log('4. Test with real Supabase authentication');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues before beta launch.');
  }
  
  return passed === total;
}

// Run the tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
