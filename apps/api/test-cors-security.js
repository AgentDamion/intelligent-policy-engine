// test-cors-security.js
// Test CORS security functionality

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testCorsSecurity() {
  console.log('🔒 Testing CORS Security...');
  
  try {
    // Test 1: Allowed origin (localhost)
    console.log('\n1️⃣ Testing allowed origin (localhost)...');
    try {
      const response1 = await axios.get(`${BASE_URL}/health`, {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      console.log('✅ Allowed origin request successful:', response1.status);
      console.log('📋 CORS headers:', {
        'Access-Control-Allow-Origin': response1.headers['access-control-allow-origin'],
        'Access-Control-Allow-Credentials': response1.headers['access-control-allow-credentials']
      });
    } catch (error) {
      console.log('❌ Allowed origin request failed:', error.message);
    }
    
    // Test 2: Blocked origin (unauthorized domain)
    console.log('\n2️⃣ Testing blocked origin (unauthorized domain)...');
    try {
      const response2 = await axios.get(`${BASE_URL}/health`, {
        headers: {
          'Origin': 'https://malicious-site.com'
        }
      });
      console.log('⚠️  Unexpected: Blocked origin request succeeded');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Blocked origin correctly rejected (403 Forbidden)');
      } else {
        console.log('✅ Blocked origin rejected:', error.message);
      }
    }
    
    // Test 3: No origin (mobile app, Postman, etc.)
    console.log('\n3️⃣ Testing request with no origin...');
    try {
      const response3 = await axios.get(`${BASE_URL}/health`);
      console.log('✅ No-origin request successful:', response3.status);
    } catch (error) {
      console.log('❌ No-origin request failed:', error.message);
    }
    
    // Test 4: Allowed production domain
    console.log('\n4️⃣ Testing allowed production domain...');
    try {
      const response4 = await axios.get(`${BASE_URL}/health`, {
        headers: {
          'Origin': 'https://aicomplyr.io'
        }
      });
      console.log('✅ Production domain request successful:', response4.status);
    } catch (error) {
      console.log('❌ Production domain request failed:', error.message);
    }
    
    // Test 5: Check CORS preflight
    console.log('\n5️⃣ Testing CORS preflight request...');
    try {
      const response5 = await axios.options(`${BASE_URL}/health`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      console.log('✅ CORS preflight successful:', response5.status);
      console.log('📋 Preflight headers:', {
        'Access-Control-Allow-Origin': response5.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': response5.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': response5.headers['access-control-allow-headers']
      });
    } catch (error) {
      console.log('❌ CORS preflight failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
  }
}

// Run the test
testCorsSecurity(); 