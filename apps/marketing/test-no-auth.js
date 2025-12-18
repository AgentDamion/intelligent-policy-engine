// Test without authentication headers
import https from 'https';

const SUPABASE_URL = 'https://jwfpjufheibxadrbghfv.supabase.co';

async function testNoAuth() {
  console.log('🧪 Testing without authentication...');

  const payload = {
    project_id: 'test-project',
    enterprise_id: 'test-enterprise'
  };

  const options = {
    hostname: 'jwfpjufheibxadrbghfv.supabase.co',
    path: '/functions/v1/generate_compliance_report',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
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

// Test without auth
testNoAuth()
  .then((result) => {
    console.log('🏁 Test completed!');
  })
  .catch((error) => {
    console.log('❌ Test failed:', error.message);
  });


