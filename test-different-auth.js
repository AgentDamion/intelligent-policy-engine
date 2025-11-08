// Test with different authentication approaches
import https from 'https';

const SUPABASE_URL = 'https://jwfpjufheibxadrbghfv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZW1va3BuemFzYmV5dGRiemVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4Mzg0MzYsImV4cCI6MjA3MDQxNDQzNn0.pOE3ZySoh2h6gBq89_elFx2WanZ5PZe4ikaXxmwLQqk';

async function testDifferentAuth() {
  console.log('🧪 Testing different authentication methods...');

  const payload = {
    project_id: 'test-project',
    enterprise_id: 'test-enterprise'
  };

  // Test 1: Just apikey header
  console.log('\n📋 Test 1: apikey only');
  await testWithHeaders({
    'Content-Type': 'application/json',
    'apikey': ANON_KEY
  });

  // Test 2: Authorization header only
  console.log('\n📋 Test 2: Authorization only');
  await testWithHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`
  });

  // Test 3: Both headers
  console.log('\n📋 Test 3: Both headers');
  await testWithHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`,
    'apikey': ANON_KEY
  });
}

async function testWithHeaders(headers) {
  const options = {
    hostname: 'jwfpjufheibxadrbghfv.supabase.co',
    path: '/functions/v1/generate_compliance_report',
    method: 'POST',
    headers: headers
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      console.log('Status:', res.statusCode);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('Response:', JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('Request Error:', error.message);
      reject(error);
    });

    req.write(JSON.stringify({
      project_id: 'test-project',
      enterprise_id: 'test-enterprise'
    }));
    req.end();
  });
}

// Run the tests
testDifferentAuth().catch(console.error);


