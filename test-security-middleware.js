#!/usr/bin/env node

/**
 * Security Middleware Test Script
 * Tests the newly added security features
 */

const http = require('http');

const testSecurityMiddleware = () => {
  console.log('🔒 Testing Security Middleware...\n');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET',
    headers: {
      'User-Agent': 'Security-Test-Client/1.0'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Status Code: ${res.statusCode}`);
    console.log('📋 Security Headers:');
    
    // Check for security headers
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy',
      'content-security-policy',
      'strict-transport-security'
    ];

    securityHeaders.forEach(header => {
      const value = res.headers[header];
      if (value) {
        console.log(`  ✅ ${header}: ${value}`);
      } else {
        console.log(`  ❌ ${header}: Not set`);
      }
    });

    // Check for rate limiting headers
    console.log('\n🚦 Rate Limiting Headers:');
    const rateLimitHeaders = [
      'ratelimit-limit',
      'ratelimit-remaining',
      'ratelimit-reset'
    ];

    rateLimitHeaders.forEach(header => {
      const value = res.headers[header];
      if (value) {
        console.log(`  ✅ ${header}: ${value}`);
      } else {
        console.log(`  ❌ ${header}: Not set`);
      }
    });

    // Check for compression
    console.log('\n🗜️ Compression:');
    const encoding = res.headers['content-encoding'];
    if (encoding) {
      console.log(`  ✅ Content-Encoding: ${encoding}`);
    } else {
      console.log(`  ❌ Content-Encoding: Not set`);
    }

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('\n📊 Health Check Response:');
        console.log(`  Status: ${response.status}`);
        console.log(`  Environment: ${response.environment}`);
        console.log(`  Uptime: ${response.uptime}s`);
        console.log(`  Memory Used: ${response.memory.used}`);
        console.log(`  WebSocket Clients: ${response.websocketClients}`);
        
        console.log('\n🎉 Security middleware test completed!');
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    console.log('💡 Make sure the server is running on port 3000');
  });

  req.end();
};

// Test rate limiting
const testRateLimiting = () => {
  console.log('\n🚦 Testing Rate Limiting...\n');
  
  let requestCount = 0;
  const maxRequests = 5;
  
  const makeRequest = () => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      requestCount++;
      console.log(`Request ${requestCount}: Status ${res.statusCode}`);
      
      if (res.statusCode === 429) {
        console.log('✅ Rate limiting is working!');
        console.log(`Rate limit message: ${res.headers['retry-after'] || 'Not specified'}`);
        return;
      }
      
      if (requestCount < maxRequests) {
        setTimeout(makeRequest, 100); // Small delay between requests
      } else {
        console.log('ℹ️ Rate limiting not triggered with 5 requests (this is normal for development)');
      }
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
    });

    req.end();
  };

  makeRequest();
};

// Run tests
console.log('🚀 Starting Security Middleware Tests\n');
console.log('Make sure the server is running with: npm start\n');

testSecurityMiddleware();

setTimeout(() => {
  testRateLimiting();
}, 2000);