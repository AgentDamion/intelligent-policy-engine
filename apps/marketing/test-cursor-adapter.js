// Test the cursor-agent-adapter function
import https from 'https';

const SUPABASE_URL = 'https://jwfpjufheibxadrbghfv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZW1va3BuemFzYmV5dGRiemVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4Mzg0MzYsImV4cCI6MjA3MDQxNDQzNn0.pOE3ZySoh2h6gBq89_elFx2WanZ5PZe4ikaXxmwLQqk';

async function testCursorAdapter() {
  console.log('🧪 Testing cursor-agent-adapter function...');

  const payload = {
    agentName: 'policy',
    action: 'process',
    input: {
      tool: 'ChatGPT',
      vendor: 'OpenAI',
      usage: 'content creation',
      dataHandling: ['personal_data'],
      content: 'AI content generation for marketing'
    },
    context: {
      enterprise_id: 'test-enterprise'
    }
  };

  const options = {
    hostname: 'jwfpjufheibxadrbghfv.supabase.co',
    path: '/functions/v1/cursor-agent-adapter',
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
          console.log('✅ cursor-agent-adapter Response:');
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

// Test the cursor adapter
testCursorAdapter()
  .then((result) => {
    console.log('🏁 Test completed!');
    if (result.success) {
      console.log('✅ cursor-agent-adapter is working with real AI analysis!');
    } else {
      console.log('❌ cursor-agent-adapter failed:', result.error);
    }
  })
  .catch((error) => {
    console.log('❌ Test failed:', error.message);
  });


