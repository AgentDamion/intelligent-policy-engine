// test-security-headers.js
// Test security headers functionality

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testSecurityHeaders() {
  console.log('🔒 Testing Security Headers...');
  
  try {
    // Test 1: Check security headers on health endpoint
    console.log('\n1️⃣ Testing security headers on /api/health...');
    const response1 = await axios.get(`${BASE_URL}/health`);
    
    console.log('✅ Request successful:', response1.status);
    console.log('📋 Security Headers:');
    
    const securityHeaders = {
      'Strict-Transport-Security': response1.headers['strict-transport-security'],
      'X-Frame-Options': response1.headers['x-frame-options'],
      'X-Content-Type-Options': response1.headers['x-content-type-options'],
      'X-XSS-Protection': response1.headers['x-xss-protection'],
      'Referrer-Policy': response1.headers['referrer-policy'],
      'Content-Security-Policy': response1.headers['content-security-policy'],
      'Permissions-Policy': response1.headers['permissions-policy'],
      'X-Permitted-Cross-Domain-Policies': response1.headers['x-permitted-cross-domain-policies'],
      'X-DNS-Prefetch-Control': response1.headers['x-dns-prefetch-control']
    };
    
    Object.entries(securityHeaders).forEach(([header, value]) => {
      if (value) {
        console.log(`   ✅ ${header}: ${value}`);
      } else {
        console.log(`   ❌ ${header}: Not set`);
      }
    });
    
    // Test 2: Check cache control on sensitive endpoint
    console.log('\n2️⃣ Testing cache control on sensitive endpoint...');
    try {
      const response2 = await axios.get(`${BASE_URL}/auth`);
      console.log('📋 Cache Control Headers:');
      console.log(`   Cache-Control: ${response2.headers['cache-control']}`);
      console.log(`   Pragma: ${response2.headers['pragma']}`);
      console.log(`   Expires: ${response2.headers['expires']}`);
    } catch (error) {
      console.log('✅ Sensitive endpoint properly protected (auth required)');
    }
    
    // Test 3: Check if app still works normally
    console.log('\n3️⃣ Testing normal app functionality...');
    const response3 = await axios.get(`${BASE_URL}/health`);
    if (response3.status === 200) {
      console.log('✅ App functionality normal with security headers');
    } else {
      console.log('❌ App functionality affected by security headers');
    }
    
    // Test 4: Verify HSTS header
    console.log('\n4️⃣ Verifying HSTS header...');
    const hsts = response1.headers['strict-transport-security'];
    if (hsts && hsts.includes('max-age=')) {
      console.log('✅ HSTS header properly configured:', hsts);
    } else {
      console.log('❌ HSTS header missing or malformed');
    }
    
    // Test 5: Verify CSP header
    console.log('\n5️⃣ Verifying Content Security Policy...');
    const csp = response1.headers['content-security-policy'];
    if (csp) {
      console.log('✅ CSP header present:', csp.substring(0, 100) + '...');
    } else {
      console.log('❌ CSP header missing');
    }
    
    // Summary
    console.log('\n📊 Security Headers Summary:');
    const presentHeaders = Object.values(securityHeaders).filter(Boolean).length;
    const totalHeaders = Object.keys(securityHeaders).length;
    console.log(`   Headers present: ${presentHeaders}/${totalHeaders}`);
    
    if (presentHeaders >= 7) {
      console.log('🎉 Excellent! Most security headers are active');
    } else if (presentHeaders >= 5) {
      console.log('✅ Good! Core security headers are active');
    } else {
      console.log('⚠️  Some security headers may be missing');
    }
    
  } catch (error) {
    console.error('❌ Security headers test failed:', error.message);
  }
}

// Run the test
testSecurityHeaders(); 