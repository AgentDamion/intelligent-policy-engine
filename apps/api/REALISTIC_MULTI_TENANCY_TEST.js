/**
 * REALISTIC MULTI-TENANCY TEST SUITE
 * 
 * This test works with your CURRENT API endpoints
 * and provides actionable feedback for fixing issues
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Test Results Tracking
const testResults = {
  passed: 0,
  failed: 0,
  critical: [],
  warnings: [],
  recommendations: []
};

function logTest(testName, passed, message = '', recommendation = '') {
  if (passed) {
    console.log(`${colors.green}✅ PASS${colors.reset}: ${testName}`);
    testResults.passed++;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${testName}`);
    if (message) console.log(`   ${colors.yellow}→ ${message}${colors.reset}`);
    if (recommendation) {
      console.log(`   ${colors.blue}💡 Recommendation: ${recommendation}${colors.reset}`);
      testResults.recommendations.push({ test: testName, recommendation });
    }
    testResults.failed++;
    testResults.critical.push({ test: testName, error: message });
  }
}

// ==========================================
// TEST 1: Current API Endpoint Analysis
// ==========================================
async function testCurrentAPIEndpoints() {
  console.log(`\n${colors.blue}═══ TEST 1: Current API Endpoint Analysis ═══${colors.reset}\n`);
  
  const endpoints = [
    '/health',
    '/policies',
    '/agents/status',
    '/governance/events',
    '/auth/login'
  ];
  
  console.log('Testing current API endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      let response;
      if (endpoint === '/auth/login') {
        // Test auth endpoint with POST
        response = await axios.post(`${API_BASE}${endpoint}`, {
          email: 'test@example.com',
          password: 'testpassword'
        });
      } else {
        // Test other endpoints with GET
        response = await axios.get(`${API_BASE}${endpoint}`);
      }
      
      logTest(
        `Endpoint ${endpoint}`,
        response.status === 200,
        `Status: ${response.status}`,
        response.status !== 200 ? 'Fix endpoint implementation' : ''
      );
    } catch (error) {
      logTest(
        `Endpoint ${endpoint}`,
        false,
        `Error: ${error.response?.status || error.message}`,
        'Implement this endpoint for multi-tenancy'
      );
    }
  }
}

// ==========================================
// TEST 2: Policy Isolation Check
// ==========================================
async function testPolicyIsolation() {
  console.log(`\n${colors.blue}═══ TEST 2: Policy Isolation Check ═══${colors.reset}\n`);
  
  try {
    // Test current policies endpoint
    const response = await axios.get(`${API_BASE}/policies`);
    
    if (response.status === 200 && response.data.success) {
      const policies = response.data.data;
      
      // Check if policies have enterprise isolation
      const hasEnterpriseId = policies.some(policy => policy.enterpriseId || policy.organizationId);
      
      logTest(
        'Policies have enterprise isolation',
        hasEnterpriseId,
        hasEnterpriseId ? 'Policies are enterprise-scoped' : 'Policies are not enterprise-scoped',
        !hasEnterpriseId ? 'Add enterpriseId field to policies and filter by tenant' : ''
      );
      
      // Check if policies can be filtered by enterprise
      const enterpriseFilterTest = await axios.get(`${API_BASE}/policies?enterpriseId=test-enterprise`);
      
      logTest(
        'Policies can be filtered by enterprise',
        enterpriseFilterTest.status === 200 || enterpriseFilterTest.status === 404,
        `Status: ${enterpriseFilterTest.status}`,
        enterpriseFilterTest.status === 500 ? 'Implement enterprise filtering in policies endpoint' : ''
      );
      
    } else {
      logTest(
        'Policies endpoint working',
        false,
        'Policies endpoint not responding properly',
        'Fix policies endpoint implementation'
      );
    }
    
  } catch (error) {
    logTest(
      'Policy isolation test',
      false,
      `Error: ${error.message}`,
      'Implement proper policy isolation with enterprise scoping'
    );
  }
}

// ==========================================
// TEST 3: Authentication & Authorization
// ==========================================
async function testAuthenticationAuthorization() {
  console.log(`\n${colors.blue}═══ TEST 3: Authentication & Authorization ═══${colors.reset}\n`);
  
  try {
    // Test login endpoint
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    logTest(
      'Authentication endpoint working',
      loginResponse.status === 200 && loginResponse.data.success,
      loginResponse.status === 200 ? 'Login successful' : `Status: ${loginResponse.status}`,
      loginResponse.status !== 200 ? 'Fix authentication endpoint' : ''
    );
    
    if (loginResponse.data.token) {
      // Test authenticated access
      const authHeaders = { Authorization: `Bearer ${loginResponse.data.token}` };
      
      try {
        const protectedResponse = await axios.get(`${API_BASE}/policies`, { headers: authHeaders });
        logTest(
          'Authenticated access to policies',
          protectedResponse.status === 200,
          `Status: ${protectedResponse.status}`,
          protectedResponse.status !== 200 ? 'Implement proper authentication middleware' : ''
        );
      } catch (authError) {
        logTest(
          'Authenticated access to policies',
          false,
          `Auth error: ${authError.response?.status || authError.message}`,
          'Implement proper JWT token validation'
        );
      }
    }
    
  } catch (error) {
    logTest(
      'Authentication test',
      false,
      `Error: ${error.message}`,
      'Implement proper authentication system'
    );
  }
}

// ==========================================
// TEST 4: Multi-Tenancy Database Check
// ==========================================
async function testMultiTenancyDatabase() {
  console.log(`\n${colors.blue}═══ TEST 4: Multi-Tenancy Database Check ═══${colors.reset}\n`);
  
  try {
    // Check if database connection is working
    const healthResponse = await axios.get(`${API_BASE}/health`);
    
    logTest(
      'Database connection working',
      healthResponse.status === 200,
      `Health status: ${healthResponse.data.status}`,
      healthResponse.status !== 200 ? 'Fix database connection' : ''
    );
    
    // Check if database has multi-tenancy structure
    // This would require database schema analysis
    logTest(
      'Multi-tenancy database structure',
      false, // We can't check this without database access
      'Cannot verify database schema',
      'Ensure database has enterprise_id columns and proper indexes'
    );
    
  } catch (error) {
    logTest(
      'Database multi-tenancy test',
      false,
      `Error: ${error.message}`,
      'Fix database connection and implement multi-tenancy schema'
    );
  }
}

// ==========================================
// TEST 5: Security Headers & Configuration
// ==========================================
async function testSecurityConfiguration() {
  console.log(`\n${colors.blue}═══ TEST 5: Security Configuration ═══${colors.reset}\n`);
  
  try {
    const response = await axios.get(`${API_BASE}/health`);
    const headers = response.headers;
    
    // Check for security headers
    const hasSecurityHeaders = headers['x-content-type-options'] || headers['x-frame-options'];
    
    logTest(
      'Security headers present',
      hasSecurityHeaders,
      hasSecurityHeaders ? 'Security headers configured' : 'No security headers found',
      !hasSecurityHeaders ? 'Add security headers (helmet.js)' : ''
    );
    
    // Check CORS configuration
    const hasCORS = headers['access-control-allow-origin'];
    
    logTest(
      'CORS properly configured',
      hasCORS,
      hasCORS ? 'CORS headers present' : 'No CORS headers found',
      !hasCORS ? 'Configure CORS for production domains' : ''
    );
    
  } catch (error) {
    logTest(
      'Security configuration test',
      false,
      `Error: ${error.message}`,
      'Fix API connectivity and security configuration'
    );
  }
}

// ==========================================
// MAIN TEST RUNNER
// ==========================================
async function runRealisticMultiTenancyTests() {
  console.log(`
${colors.magenta}╔════════════════════════════════════════════════════════════╗
║        AICOMPLYR.IO REALISTIC MULTI-TENANCY TEST          ║
║                                                            ║
║  This test works with your CURRENT API endpoints           ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);

  const startTime = Date.now();
  
  // Run all tests
  await testCurrentAPIEndpoints();
  await testPolicyIsolation();
  await testAuthenticationAuthorization();
  await testMultiTenancyDatabase();
  await testSecurityConfiguration();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // ========== FINAL REPORT ==========
  console.log(`\n${colors.magenta}═══════════════ FINAL REPORT ═══════════════${colors.reset}\n`);
  
  console.log(`Test Duration: ${duration} seconds\n`);
  
  console.log(`Results Summary:`);
  console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  
  if (testResults.critical.length > 0) {
    console.log(`\n${colors.red}⚠️  CRITICAL ISSUES FOUND:${colors.reset}`);
    testResults.critical.forEach(issue => {
      console.log(`  ${colors.red}• ${issue.test}: ${issue.error}${colors.reset}`);
    });
  }
  
  if (testResults.recommendations.length > 0) {
    console.log(`\n${colors.blue}💡 RECOMMENDATIONS:${colors.reset}`);
    testResults.recommendations.forEach(rec => {
      console.log(`  ${colors.blue}• ${rec.test}: ${rec.recommendation}${colors.reset}`);
    });
  }
  
  // Overall verdict
  const allPassed = testResults.failed === 0;
  
  console.log(`\n${colors.magenta}═══════════════ VERDICT ═══════════════${colors.reset}\n`);
  
  if (allPassed) {
    console.log(`${colors.green}✅ MULTI-TENANCY READY: PASSED${colors.reset}`);
    console.log(`${colors.green}Your platform has basic multi-tenancy structure.${colors.reset}`);
    console.log(`${colors.green}Proceed with advanced testing.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ MULTI-TENANCY READY: FAILED${colors.reset}`);
    console.log(`${colors.red}Critical multi-tenancy issues need fixing.${colors.reset}`);
    
    console.log(`\n${colors.yellow}Priority Fixes Required:${colors.reset}`);
    console.log(`  1. Implement enterprise-scoped policies`);
    console.log(`  2. Add proper authentication middleware`);
    console.log(`  3. Create multi-tenancy database schema`);
    console.log(`  4. Add security headers and CORS`);
    console.log(`  5. Implement tenant isolation in all endpoints`);
  }
  
  // Save detailed report
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    passed: testResults.passed,
    failed: testResults.failed,
    critical: testResults.critical,
    recommendations: testResults.recommendations
  };
  
  fs.writeFileSync(
    `realistic-multi-tenancy-report-${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n📄 Detailed report saved to: realistic-multi-tenancy-report-*.json`);
  
  // Exit with proper code
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runRealisticMultiTenancyTests().catch(error => {
  console.error(`${colors.red}Test suite failed to run:${colors.reset}`, error);
  process.exit(1);
});
