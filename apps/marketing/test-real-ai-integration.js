// Test Real AI Integration - Verify Cursor agents are using actual AI models
import https from 'https';

const SUPABASE_URL = 'https://jwfpjufheibxadrbghfv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZW1va3BuemFzYmV5dGRiemVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4Mzg0MzYsImV4cCI6MjA3MDQxNDQzNn0.pOE3ZySoh2h6gBq89_elFx2WanZ5PZe4ikaXxmwLQqk';

async function testRealAIIntegration() {
  console.log('🤖 Testing REAL AI Integration...');
  console.log('=====================================');

  // Test 1: Policy Agent with Real AI
  console.log('\n1️⃣ Testing Policy Agent with AI...');
  await testPolicyAgent();

  // Test 2: Context Agent with Real AI
  console.log('\n2️⃣ Testing Context Agent with AI...');
  await testContextAgent();

  // Test 3: Verify AI Metadata
  console.log('\n3️⃣ Verifying AI Metadata...');
  await testAIMetadata();

  console.log('\n✅ Real AI Integration Test Complete!');
}

async function testPolicyAgent() {
  const payload = {
    agentName: 'policy',
    action: 'process',
    input: {
      tool: 'ChatGPT',
      vendor: 'OpenAI',
      usage: 'medical content generation for healthcare client',
      dataHandling: ['personal_data', 'medical_records'],
      content: 'Generate patient education materials for diabetes management'
    },
    context: {
      enterprise_id: 'test-enterprise',
      urgency: {
        level: 0.8,
        timePressure: 0.9,
        emotionalState: 'stressed'
      }
    }
  };

  const result = await callCursorAdapter(payload);
  
  if (result.success) {
    console.log('✅ Policy Agent Response:');
    console.log(`   Status: ${result.result.decision.status}`);
    console.log(`   Confidence: ${result.result.decision.confidence}`);
    console.log(`   Risk Level: ${result.result.decision.riskLevel}`);
    console.log(`   Reasoning: ${result.result.decision.reasoning}`);
    console.log(`   AI Provider: ${result.result.metadata.aiProvider}`);
    console.log(`   AI Model: ${result.result.metadata.aiModel}`);
    
    // Verify this is real AI (not mock)
    if (result.result.metadata.aiProvider && result.result.metadata.aiModel) {
      console.log('✅ REAL AI DETECTED - Not mock logic!');
    } else {
      console.log('❌ Still using mock logic - AI integration failed');
    }
  } else {
    console.log('❌ Policy Agent failed:', result.error);
  }
}

async function testContextAgent() {
  const payload = {
    agentName: 'context',
    action: 'analyze',
    input: {
      user: {
        role: 'junior_marketing_manager',
        department: 'marketing',
        experience: '6_months'
      },
      urgency: {
        level: 0.9,
        timePressure: 0.8,
        emotionalState: 'anxious'
      },
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      clientName: 'Big Pharma Corp'
    },
    context: {
      enterprise_id: 'test-enterprise'
    }
  };

  const result = await callCursorAdapter(payload);
  
  if (result.success) {
    console.log('✅ Context Agent Response:');
    console.log(`   Urgency Assessment: ${result.result.urgency?.assessment || 'N/A'}`);
    console.log(`   Confidence: ${result.result.confidence}`);
    console.log(`   AI Provider: ${result.result.aiMetadata?.provider}`);
    console.log(`   AI Model: ${result.result.aiMetadata?.model}`);
    console.log(`   Recommendations: ${result.result.recommendations?.length || 0} items`);
    
    if (result.result.aiMetadata?.provider) {
      console.log('✅ REAL AI DETECTED - Context analysis using AI!');
    } else {
      console.log('❌ Still using mock logic - AI integration failed');
    }
  } else {
    console.log('❌ Context Agent failed:', result.error);
  }
}

async function testAIMetadata() {
  // Test with a request that should show AI usage statistics
  const payload = {
    agentName: 'policy',
    action: 'test',
    input: {
      tool: 'GPT-4',
      usage: 'test_ai_integration',
      content: 'This is a test to verify AI metadata is being captured'
    },
    context: {
      enterprise_id: 'test-enterprise'
    }
  };

  const result = await callCursorAdapter(payload);
  
  if (result.success && result.result.metadata) {
    const metadata = result.result.metadata;
    console.log('✅ AI Metadata Verification:');
    console.log(`   Agent Version: ${metadata.agentVersion}`);
    console.log(`   AI Provider: ${metadata.aiProvider || 'Not detected'}`);
    console.log(`   AI Model: ${metadata.aiModel || 'Not detected'}`);
    console.log(`   AI Usage: ${metadata.aiUsage ? 'Detected' : 'Not detected'}`);
    
    if (metadata.aiProvider && metadata.aiModel) {
      console.log('✅ AI INTEGRATION WORKING - Real AI calls detected!');
      console.log('🎉 You have successfully broken out of the mock/simulation cycle!');
    } else {
      console.log('❌ AI integration not working - still using mock logic');
      console.log('🔧 Check your environment variables: OPENAI_API_KEY, AI_PROVIDER');
    }
  } else {
    console.log('❌ Could not verify AI metadata');
  }
}

function callCursorAdapter(payload) {
  return new Promise((resolve, reject) => {
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

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
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

// Run the test
testRealAIIntegration()
  .then(() => {
    console.log('\n🏁 Real AI Integration Test Complete!');
    console.log('\nNext Steps:');
    console.log('1. If tests pass: Your Cursor integration is now using real AI!');
    console.log('2. If tests fail: Check your OPENAI_API_KEY environment variable');
    console.log('3. Deploy the updated edge functions to Supabase');
    console.log('4. Update your Lovable frontend to use the real AI responses');
  })
  .catch((error) => {
    console.log('❌ Test failed:', error.message);
  });
