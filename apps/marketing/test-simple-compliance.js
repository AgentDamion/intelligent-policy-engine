// Test generate_compliance_report with simpler payload
import https from 'https';

const SUPABASE_URL = 'https://jwfpjufheibxadrbghfv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZW1va3BuemFzYmV5dGRiemVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4Mzg0MzYsImV4cCI6MjA3MDQxNDQzNn0.pOE3ZySoh2h6gBq89_elFx2WanZ5PZe4ikaXxmwLQqk';

async function testSimpleCompliance() {
  console.log('🧪 Testing generate_compliance_report with simple payload...');

  // Try with minimal required fields
  const payload = {
    project_id: 'test-project',
    enterprise_id: 'test-enterprise'
  };

  const options = {
    hostname: 'jwfpjufheibxadrbghfv.supabase.co',
    path: '/functions/v1/generate_compliance_report',
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

      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Response:');
          console.log(JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.log('❌ JSON Parse Error:', error.message);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request Error:', error.message);
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Test the compliance report
testSimpleCompliance()
  .then((result) => {
    console.log('🏁 Test completed!');
    if (result.success) {
      console.log('✅ generate_compliance_report is working!');
    } else {
      console.log('❌ generate_compliance_report failed:', result.error);
    }
  })
  .catch((error) => {
    console.log('❌ Test failed:', error.message);
  });


