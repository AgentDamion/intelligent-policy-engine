// test-rate-limiting.js
// Simple test to verify rate limiting is working

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting...');
  
  try {
    // Test 1: Normal API call (should work)
    console.log('\n1️⃣ Testing normal API call...');
    const response1 = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Normal API call successful:', response1.status);
    
    // Test 2: Make many requests to a regular endpoint (should trigger rate limiting)
    console.log('\n2️⃣ Testing rate limiting with rapid requests to /api/auth...');
    const promises = [];
    
    for (let i = 0; i < 105; i++) { // More than the 100 limit
      promises.push(
        axios.get(`${BASE_URL}/auth`)
          .then(res => ({ success: true, status: res.status }))
          .catch(err => ({ success: false, status: err.response?.status, message: err.response?.data?.error }))
      );
    }
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const blocked = results.filter(r => !r.success && r.status === 429).length;
    const otherErrors = results.filter(r => !r.success && r.status !== 429).length;
    
    console.log(`📊 Results:`);
    console.log(`   ✅ Successful requests: ${successful}`);
    console.log(`   🚫 Rate limited requests: ${blocked}`);
    console.log(`   ❌ Other errors: ${otherErrors}`);
    console.log(`   📈 Total requests: ${results.length}`);
    
    if (blocked > 0) {
      console.log('🎉 Rate limiting is working! Some requests were blocked.');
    } else {
      console.log('⚠️  Rate limiting may not be working as expected.');
    }
    
    // Test 3: Check rate limit headers on a regular endpoint
    console.log('\n3️⃣ Testing rate limit headers on /api/auth...');
    try {
      const response2 = await axios.get(`${BASE_URL}/auth`);
      const rateLimitHeaders = {
        'RateLimit-Limit': response2.headers['ratelimit-limit'],
        'RateLimit-Remaining': response2.headers['ratelimit-remaining'],
        'RateLimit-Reset': response2.headers['ratelimit-reset']
      };
      console.log('📋 Rate limit headers:', rateLimitHeaders);
    } catch (error) {
      console.log('📋 Rate limit headers (from error response):', {
        'RateLimit-Limit': error.response?.headers['ratelimit-limit'],
        'RateLimit-Remaining': error.response?.headers['ratelimit-remaining'],
        'RateLimit-Reset': error.response?.headers['ratelimit-reset']
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRateLimiting(); 