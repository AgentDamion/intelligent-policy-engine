// test-complete-security-stack.js
// Test the complete B2B security stack

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testCompleteSecurityStack() {
  console.log('🔒 Testing Complete B2B Security Stack...');
  
  try {
    // Test 1: Rate Limiting
    console.log('\n1️⃣ Testing Rate Limiting...');
    const rateLimitTest = await testRateLimiting();
    console.log(`   ✅ Rate Limiting: ${rateLimitTest ? 'PASS' : 'FAIL'}`);
    
    // Test 2: CORS Security
    console.log('\n2️⃣ Testing CORS Security...');
    const corsTest = await testCorsSecurity();
    console.log(`   ✅ CORS Security: ${corsTest ? 'PASS' : 'FAIL'}`);
    
    // Test 3: Security Headers
    console.log('\n3️⃣ Testing Security Headers...');
    const headersTest = await testSecurityHeaders();
    console.log(`   ✅ Security Headers: ${headersTest ? 'PASS' : 'FAIL'}`);
    
    // Test 4: Audit Logging
    console.log('\n4️⃣ Testing Audit Logging...');
    const auditTest = await testAuditLogging();
    console.log(`   ✅ Audit Logging: ${auditTest ? 'PASS' : 'FAIL'}`);
    
    // Test 5: Database Connection Pooling
    console.log('\n5️⃣ Testing Database Connection Pooling...');
    const dbTest = await testDatabasePooling();
    console.log(`   ✅ Database Pooling: ${dbTest ? 'PASS' : 'FAIL'}`);
    
    // Test 6: AI Provider Security
    console.log('\n6️⃣ Testing AI Provider Security...');
    const aiTest = await testAIProviderSecurity();
    console.log(`   ✅ AI Provider Security: ${aiTest ? 'PASS' : 'FAIL'}`);
    
    // Summary
    console.log('\n📊 Complete Security Stack Summary:');
    const tests = [rateLimitTest, corsTest, headersTest, auditTest, dbTest, aiTest];
    const passedTests = tests.filter(Boolean).length;
    const totalTests = tests.length;
    
    console.log(`   Tests passed: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 EXCELLENT! Complete B2B security stack is working perfectly!');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('✅ GOOD! Most security features are working');
    } else {
      console.log('⚠️  Some security features need attention');
    }
    
  } catch (error) {
    console.error('❌ Security stack test failed:', error.message);
  }
}

async function testRateLimiting() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const rateLimitHeaders = {
      'RateLimit-Limit': response.headers['ratelimit-limit'],
      'RateLimit-Remaining': response.headers['ratelimit-remaining']
    };
    
    return rateLimitHeaders['RateLimit-Limit'] && rateLimitHeaders['RateLimit-Remaining'];
  } catch (error) {
    return false;
  }
}

async function testCorsSecurity() {
  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      headers: { 'Origin': 'http://localhost:3000' }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
    };
    
    return corsHeaders['Access-Control-Allow-Origin'] === 'http://localhost:3000';
  } catch (error) {
    return false;
  }
}

async function testSecurityHeaders() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    
    const requiredHeaders = [
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
      'content-security-policy'
    ];
    
    const presentHeaders = requiredHeaders.filter(header => 
      response.headers[header]
    ).length;
    
    return presentHeaders >= 3; // At least 3 out of 4 core headers
  } catch (error) {
    return false;
  }
}

async function testAuditLogging() {
  try {
    // Make a request to trigger audit logging
    await axios.get(`${BASE_URL}/health`);
    
    // Check if audit log file exists
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, 'logs/audit.log');
    
    return fs.existsSync(logFile);
  } catch (error) {
    return false;
  }
}

async function testDatabasePooling() {
  try {
    // Test database connection
    const pool = require('./database/connection');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    return true;
  } catch (error) {
    return false;
  }
}

async function testAIProviderSecurity() {
  try {
    // Check if AI rate limiting is configured
    const aiRateLimit = process.env.AI_RATE_LIMIT_PER_MINUTE;
    const aiFallback = process.env.AI_FALLBACK_PROVIDER;
    
    return aiRateLimit && aiFallback;
  } catch (error) {
    return false;
  }
}

// Run the test
testCompleteSecurityStack(); 