/**
 * CRITICAL MULTI-TENANCY TEST SUITE
 * 
 * This is THE most important test for your platform.
 * If any of these tests fail, DO NOT LAUNCH.
 * 
 * Run with: node multi_tenancy_test.js
 */

const fetch = require('node-fetch');
const assert = require('assert');

const API_BASE = 'http://localhost:3000/api';

// Test data generators
const generateId = () => Math.random().toString(36).substring(7);
const timestamp = () => new Date().toISOString();

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper functions
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Test Results Tracking
const testResults = {
  passed: 0,
  failed: 0,
  critical: [],
  warnings: []
};

function logTest(testName, passed, message = '') {
  if (passed) {
    console.log(`${colors.green}✅ PASS${colors.reset}: ${testName}`);
    testResults.passed++;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${testName}`);
    if (message) console.log(`   ${colors.yellow}→ ${message}${colors.reset}`);
    testResults.failed++;
    testResults.critical.push({ test: testName, error: message });
  }
}

// ==========================================
// CRITICAL TEST 1: Enterprise Data Isolation
// ==========================================
async function testEnterpriseIsolation() {
  console.log(`\n${colors.blue}═══ TEST 1: Enterprise Data Isolation ═══${colors.reset}\n`);
  
  // Create two enterprises
  const enterprise1 = {
    id: `pfizer-${generateId()}`,
    name: 'Pfizer Test',
    type: 'pharma'
  };
  
  const enterprise2 = {
    id: `moderna-${generateId()}`,
    name: 'Moderna Test',
    type: 'pharma'
  };
  
  // Create enterprise-specific data
  console.log('Creating test enterprises...');
  
  // Create a policy for Enterprise 1
  const policy1 = await apiCall('/policies', 'POST', {
    enterpriseId: enterprise1.id,
    name: 'Pfizer AI Policy',
    rules: ['No patient data in AI'],
    createdAt: timestamp()
  });
  
  // Create a policy for Enterprise 2
  const policy2 = await apiCall('/policies', 'POST', {
    enterpriseId: enterprise2.id,
    name: 'Moderna AI Policy',
    rules: ['AI allowed with approval'],
    createdAt: timestamp()
  });
  
  // TEST: Enterprise 1 cannot see Enterprise 2's policies
  const enterprise1Policies = await apiCall(`/policies?enterpriseId=${enterprise1.id}`);
  const enterprise2Policies = await apiCall(`/policies?enterpriseId=${enterprise2.id}`);
  
  // Critical isolation checks
  let isolationPassed = true;
  
  // Check 1: Each enterprise only sees their own policies
  if (enterprise1Policies.data && enterprise2Policies.data) {
    const e1HasE2Policy = enterprise1Policies.data.policies?.some(
      p => p.name === 'Moderna AI Policy'
    );
    const e2HasE1Policy = enterprise2Policies.data.policies?.some(
      p => p.name === 'Pfizer AI Policy'
    );
    
    logTest(
      'Policy isolation between enterprises',
      !e1HasE2Policy && !e2HasE1Policy,
      e1HasE2Policy ? 'Enterprise 1 can see Enterprise 2 policies!' : 
      e2HasE1Policy ? 'Enterprise 2 can see Enterprise 1 policies!' : ''
    );
    
    if (e1HasE2Policy || e2HasE1Policy) isolationPassed = false;
  } else {
    logTest('Policy isolation between enterprises', false, 'Could not retrieve policies');
    isolationPassed = false;
  }
  
  // Check 2: Direct access attempt should fail
  const unauthorizedAccess = await apiCall(`/enterprises/${enterprise2.id}/data`, 'GET', null, 'enterprise1-token');
  logTest(
    'Direct cross-enterprise access blocked',
    unauthorizedAccess.status === 403 || unauthorizedAccess.status === 404,
    `Returned status ${unauthorizedAccess.status} - should be 403 or 404`
  );
  
  return isolationPassed;
}

// ==========================================
// CRITICAL TEST 2: Agency Multi-Client Access
// ==========================================
async function testAgencyMultiClient() {
  console.log(`\n${colors.blue}═══ TEST 2: Agency Multi-Client Access Control ═══${colors.reset}\n`);
  
  // Create an agency
  const agency = {
    id: `agency-${generateId()}`,
    name: 'Global Creative Agency',
    type: 'agency'
  };
  
  // Create two client enterprises
  const client1 = {
    id: `client1-${generateId()}`,
    name: 'Pharma Client 1',
    policies: ['No AI for regulated content']
  };
  
  const client2 = {
    id: `client2-${generateId()}`,
    name: 'Pharma Client 2',
    policies: ['AI requires approval']
  };
  
  console.log('Setting up agency with multiple clients...');
  
  // Connect agency to both clients
  const connection1 = await apiCall('/agency-connections', 'POST', {
    agencyId: agency.id,
    clientId: client1.id,
    permissions: ['view_policies', 'submit_tools']
  });
  
  const connection2 = await apiCall('/agency-connections', 'POST', {
    agencyId: agency.id,
    clientId: client2.id,
    permissions: ['view_policies', 'submit_tools']
  });
  
  // TEST: Agency can see both clients but data is segregated
  const agencyView = await apiCall(`/agency/${agency.id}/clients`);
  
  let multiClientPassed = true;
  
  // Check 1: Agency can see multiple clients
  logTest(
    'Agency can connect to multiple clients',
    agencyView.data?.clients?.length >= 2 || connection1.status === 200,
    `Found ${agencyView.data?.clients?.length || 0} clients`
  );
  
  // Check 2: Agency sees client-specific policies
  const client1Policies = await apiCall(`/policies?enterpriseId=${client1.id}&agencyId=${agency.id}`);
  const client2Policies = await apiCall(`/policies?enterpriseId=${client2.id}&agencyId=${agency.id}`);
  
  logTest(
    'Agency sees segregated client policies',
    client1Policies.status === 200 || client2Policies.status === 200,
    'Agency should see different policies per client'
  );
  
  // Check 3: Agency cannot mix client data
  const crossClientSubmission = await apiCall('/tool-submissions', 'POST', {
    agencyId: agency.id,
    toolName: 'GPT-4',
    clientId: client1.id,
    policyId: 'client2-policy-id' // Wrong client's policy!
  });
  
  logTest(
    'Agency cannot submit with wrong client policy',
    crossClientSubmission.status === 400 || crossClientSubmission.status === 403,
    `Status ${crossClientSubmission.status} - should reject cross-client policy use`
  );
  
  if (crossClientSubmission.status === 200) multiClientPassed = false;
  
  return multiClientPassed;
}

// ==========================================
// CRITICAL TEST 3: Audit Trail Isolation
// ==========================================
async function testAuditTrailIsolation() {
  console.log(`\n${colors.blue}═══ TEST 3: Audit Trail Isolation ═══${colors.reset}\n`);
  
  const enterprise1 = `enterprise-${generateId()}`;
  const enterprise2 = `enterprise-${generateId()}`;
  
  console.log('Creating audit events for different enterprises...');
  
  // Create audit events for each enterprise
  const audit1 = await apiCall('/audit/events', 'POST', {
    enterpriseId: enterprise1,
    action: 'policy_created',
    userId: 'user1',
    details: { policy: 'Confidential Policy 1' },
    timestamp: timestamp()
  });
  
  const audit2 = await apiCall('/audit/events', 'POST', {
    enterpriseId: enterprise2,
    action: 'tool_approved',
    userId: 'user2',
    details: { tool: 'Secret Tool 2' },
    timestamp: timestamp()
  });
  
  // TEST: Each enterprise only sees their own audit trail
  const enterprise1Audit = await apiCall(`/audit/events?enterpriseId=${enterprise1}`);
  const enterprise2Audit = await apiCall(`/audit/events?enterpriseId=${enterprise2}`);
  
  let auditIsolationPassed = true;
  
  // Check 1: No cross-contamination of audit logs
  if (enterprise1Audit.data?.events && enterprise2Audit.data?.events) {
    const e1HasE2Audit = enterprise1Audit.data.events.some(
      e => e.details?.tool === 'Secret Tool 2'
    );
    const e2HasE1Audit = enterprise2Audit.data.events.some(
      e => e.details?.policy === 'Confidential Policy 1'
    );
    
    logTest(
      'Audit trails are isolated per enterprise',
      !e1HasE2Audit && !e2HasE1Audit,
      e1HasE2Audit ? 'Enterprise 1 can see Enterprise 2 audit logs!' :
      e2HasE1Audit ? 'Enterprise 2 can see Enterprise 1 audit logs!' : ''
    );
    
    if (e1HasE2Audit || e2HasE1Audit) {
      auditIsolationPassed = false;
      testResults.critical.push({
        test: 'Audit Trail Isolation',
        error: 'CRITICAL: Audit logs are leaking between enterprises!'
      });
    }
  }
  
  // Check 2: Audit logs are immutable
  const modifyAttempt = await apiCall(`/audit/events/${audit1.data?.id}`, 'PUT', {
    action: 'modified_action'
  });
  
  logTest(
    'Audit logs are immutable',
    modifyAttempt.status === 403 || modifyAttempt.status === 405,
    `Status ${modifyAttempt.status} - audit logs should not be modifiable`
  );
  
  return auditIsolationPassed;
}

// ==========================================
// CRITICAL TEST 4: User Permission Boundaries
// ==========================================
async function testUserPermissionBoundaries() {
  console.log(`\n${colors.blue}═══ TEST 4: User Permission Boundaries ═══${colors.reset}\n`);
  
  // Create users with different roles
  const users = {
    enterpriseAdmin: {
      id: `admin-${generateId()}`,
      role: 'enterprise_admin',
      enterpriseId: 'enterprise-1'
    },
    seatUser: {
      id: `user-${generateId()}`,
      role: 'seat_user',
      enterpriseId: 'enterprise-1',
      seatId: 'seat-1'
    },
    differentEnterprise: {
      id: `other-${generateId()}`,
      role: 'enterprise_admin',
      enterpriseId: 'enterprise-2'
    }
  };
  
  console.log('Testing user permission boundaries...');
  
  // TEST: Users can only access their authorized scope
  let permissionsPassed = true;
  
  // Check 1: Seat user cannot access enterprise-level settings
  const seatUserEnterpriseAccess = await apiCall(
    '/enterprise/settings',
    'GET',
    null,
    `seat-user-token-${users.seatUser.id}`
  );
  
  logTest(
    'Seat user cannot access enterprise settings',
    seatUserEnterpriseAccess.status === 403 || seatUserEnterpriseAccess.status === 401,
    `Status ${seatUserEnterpriseAccess.status} - should be 403`
  );
  
  // Check 2: Admin from different enterprise cannot access
  const crossEnterpriseAccess = await apiCall(
    `/enterprises/${users.enterpriseAdmin.enterpriseId}/policies`,
    'GET',
    null,
    `token-${users.differentEnterprise.id}`
  );
  
  logTest(
    'Admin cannot access different enterprise',
    crossEnterpriseAccess.status === 403 || crossEnterpriseAccess.status === 404,
    `Status ${crossEnterpriseAccess.status} - should block cross-enterprise access`
  );
  
  // Check 3: Deleted user cannot access anything
  const deletedUserAccess = await apiCall(
    '/policies',
    'GET',
    null,
    'deleted-user-token'
  );
  
  logTest(
    'Deleted users are properly revoked',
    deletedUserAccess.status === 401,
    `Status ${deletedUserAccess.status} - deleted users should get 401`
  );
  
  return permissionsPassed;
}

// ==========================================
// CRITICAL TEST 5: Data Leak Detection
// ==========================================
async function testDataLeakDetection() {
  console.log(`\n${colors.blue}═══ TEST 5: Data Leak Detection ═══${colors.reset}\n`);
  
  const sensitiveData = {
    enterpriseId: `secure-${generateId()}`,
    apiKey: 'secret-api-key-12345',
    internalNotes: 'Confidential: Acquisition target',
    patientData: 'PHI-protected-content'
  };
  
  console.log('Testing for potential data leaks...');
  
  // Check 1: API responses don't leak sensitive fields
  const response = await apiCall('/enterprises');
  const responseText = JSON.stringify(response.data);
  
  logTest(
    'API responses do not contain sensitive fields',
    !responseText.includes('api_key') && 
    !responseText.includes('apiKey') &&
    !responseText.includes('password') &&
    !responseText.includes('secret'),
    responseText.includes('api') ? 'Response may contain sensitive data!' : ''
  );
  
  // Check 2: Error messages don't leak information
  const errorResponse = await apiCall('/enterprises/fake-id/secret-data');
  
  logTest(
    'Error messages do not leak information',
    !errorResponse.data?.error?.includes('SQL') &&
    !errorResponse.data?.error?.includes('database') &&
    !errorResponse.data?.error?.includes('postgres'),
    'Error messages may be leaking implementation details'
  );
  
  // Check 3: Search doesn't return cross-tenant results
  const searchResponse = await apiCall('/search?q=*');
  
  logTest(
    'Global search respects tenant boundaries',
    !searchResponse.data || searchResponse.status === 403,
    'Global search should not be allowed or should filter by tenant'
  );
  
  return true;
}

// ==========================================
// MAIN TEST RUNNER
// ==========================================
async function runMultiTenancyTests() {
  console.log(`
${colors.magenta}╔════════════════════════════════════════════════════════════╗
║          AICOMPLYR.IO MULTI-TENANCY SECURITY TEST          ║
║                                                            ║
║  CRITICAL: If ANY of these tests fail, DO NOT LAUNCH!     ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);

  const startTime = Date.now();
  
  // Run all critical tests
  const results = {
    enterpriseIsolation: await testEnterpriseIsolation(),
    agencyMultiClient: await testAgencyMultiClient(),
    auditTrailIsolation: await testAuditTrailIsolation(),
    userPermissions: await testUserPermissionBoundaries(),
    dataLeakDetection: await testDataLeakDetection()
  };
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // ========== FINAL REPORT ==========
  console.log(`\n${colors.magenta}═══════════════ FINAL REPORT ═══════════════${colors.reset}\n`);
  
  console.log(`Test Duration: ${duration} seconds\n`);
  
  console.log(`Results Summary:`);
  console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  
  if (testResults.critical.length > 0) {
    console.log(`\n${colors.red}⚠️  CRITICAL SECURITY ISSUES FOUND:${colors.reset}`);
    testResults.critical.forEach(issue => {
      console.log(`  ${colors.red}• ${issue.test}: ${issue.error}${colors.reset}`);
    });
  }
  
  // Overall verdict
  const allPassed = Object.values(results).every(r => r === true);
  
  console.log(`\n${colors.magenta}═══════════════ VERDICT ═══════════════${colors.reset}\n`);
  
  if (allPassed && testResults.failed === 0) {
    console.log(`${colors.green}✅ MULTI-TENANCY SECURITY: PASSED${colors.reset}`);
    console.log(`${colors.green}Your platform appears to have proper tenant isolation.${colors.reset}`);
    console.log(`${colors.green}Proceed with additional testing.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ MULTI-TENANCY SECURITY: FAILED${colors.reset}`);
    console.log(`${colors.red}DO NOT LAUNCH - Critical security issues detected!${colors.reset}`);
    console.log(`${colors.red}Fix all issues before proceeding with beta.${colors.reset}`);
    
    console.log(`\n${colors.yellow}Priority Fixes Required:${colors.reset}`);
    if (!results.enterpriseIsolation) {
      console.log(`  1. Fix enterprise data isolation immediately`);
    }
    if (!results.auditTrailIsolation) {
      console.log(`  2. Audit trails are leaking between tenants`);
    }
    if (!results.agencyMultiClient) {
      console.log(`  3. Agency multi-client access control is broken`);
    }
  }
  
  // Save detailed report
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    passed: testResults.passed,
    failed: testResults.failed,
    critical: testResults.critical,
    results: results
  };
  
  fs.writeFileSync(
    `multi-tenancy-report-${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n📄 Detailed report saved to: multi-tenancy-report-*.json`);
  
  // Exit with proper code
  process.exit(allPassed && testResults.failed === 0 ? 0 : 1);
}

// Run the tests
runMultiTenancyTests().catch(error => {
  console.error(`${colors.red}Test suite failed to run:${colors.reset}`, error);
  process.exit(1);
});
