// Test script to verify existing Supabase functions
import https from 'https';

const SUPABASE_URL = 'https://jwfpjufheibxadrbghfv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZW1va3BuemFzYmV5dGRiemVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4Mzg0MzYsImV4cCI6MjA3MDQxNDQzNn0.pOE3ZySoh2h6gBq89_elFx2WanZ5PZe4ikaXxmwLQqk';

async function testFunction(functionName, payload) {
  console.log(`🧪 Testing ${functionName}...`);

  const options = {
    hostname: 'jwfpjufheibxadrbghfv.supabase.co',
    path: `/functions/v1/${functionName}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`✅ ${functionName} Response:`, result);
          resolve(result);
        } catch (error) {
          console.log(`❌ ${functionName} JSON Parse Error:`, error.message);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${functionName} Request Error:`, error.message);
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Existing Supabase Functions...\n');

  const tests = [
    {
      name: 'generate_compliance_report',
      payload: {
        project_id: 'test-project-id',
        enterprise_id: 'test-enterprise-id',
        include_details: true
      }
    },
    {
      name: 'compliance_check_agent_activity',
      payload: {
        agent_name: 'test_agent',
        activity_data: { test: 'data' }
      }
    },
    {
      name: 'webhook-manager',
      payload: {
        action: 'test',
        data: { test: 'webhook_data' }
      }
    },
    {
      name: 'platform-adapter',
      payload: {
        platform: 'test',
        action: 'test',
        data: { test: 'platform_data' }
      }
    }
  ];

  for (const test of tests) {
    try {
      await testFunction(test.name, test.payload);
    } catch (error) {
      console.log(`❌ ${test.name} failed:`, error.message);
    }
    console.log(''); // Empty line between tests
  }

  console.log('🏁 Testing complete!');
}

// Run the tests
runTests().catch(console.error);
