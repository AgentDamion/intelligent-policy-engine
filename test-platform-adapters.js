#!/usr/bin/env node

/**
 * Universal Platform Adapter Test Suite
 * This script tests all platform adapters and their integrations
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  organizationId: process.env.TEST_ORGANIZATION_ID || 'test-org-id',
  testTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  details: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.supabaseKey}`,
        'x-org-id': config.organizationId,
        ...options.headers
      },
      timeout: config.testTimeout
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function runTest(testName, testFunction) {
  testResults.total++;
  log(`\n🧪 Running: ${testName}`, 'cyan');
  
  try {
    const result = await testFunction();
    if (result.success) {
      testResults.passed++;
      log(`✅ PASSED: ${testName}`, 'green');
      testResults.details.push({ name: testName, status: 'passed', result });
    } else {
      testResults.failed++;
      log(`❌ FAILED: ${testName} - ${result.error}`, 'red');
      testResults.details.push({ name: testName, status: 'failed', error: result.error, result });
    }
  } catch (error) {
    testResults.failed++;
    log(`❌ ERROR: ${testName} - ${error.message}`, 'red');
    testResults.details.push({ name: testName, status: 'error', error: error.message });
  }
}

async function retryTest(testName, testFunction, attempts = config.retryAttempts) {
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await testFunction();
      if (result.success) {
        return result;
      }
      if (i < attempts - 1) {
        log(`⚠️  Retry ${i + 1}/${attempts} for ${testName}`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, config.retryDelay * (i + 1)));
      }
    } catch (error) {
      if (i === attempts - 1) throw error;
      log(`⚠️  Retry ${i + 1}/${attempts} for ${testName} - ${error.message}`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * (i + 1)));
    }
  }
  throw new Error(`Test failed after ${attempts} attempts`);
}

// Test functions
async function testPlatformManagerHealth() {
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-manager`);
  return {
    success: response.status === 200,
    result: response.data
  };
}

async function testPlatformManagerCRUD() {
  // Test creating a platform configuration
  const createResponse = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-manager`, {
    method: 'POST',
    body: {
      platform_type: 'test_platform',
      platform_name: 'Test Platform',
      configuration: {
        endpoints: { base_url: 'https://test.example.com' }
      },
      credentials: {
        api_key: 'test-key'
      }
    }
  });

  if (createResponse.status !== 200) {
    return { success: false, error: `Create failed: ${createResponse.status}` };
  }

  const configId = createResponse.data.id;

  // Test reading the configuration
  const readResponse = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-manager/${configId}`);
  if (readResponse.status !== 200) {
    return { success: false, error: `Read failed: ${readResponse.status}` };
  }

  // Test updating the configuration
  const updateResponse = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-manager/${configId}`, {
    method: 'PUT',
    body: {
      platform_name: 'Updated Test Platform'
    }
  });
  if (updateResponse.status !== 200) {
    return { success: false, error: `Update failed: ${updateResponse.status}` };
  }

  // Test deleting the configuration
  const deleteResponse = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-manager/${configId}`, {
    method: 'DELETE'
  });
  if (deleteResponse.status !== 200) {
    return { success: false, error: `Delete failed: ${deleteResponse.status}` };
  }

  return { success: true, result: 'CRUD operations completed successfully' };
}

async function testUniversalPlatformHealth() {
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-universal/health`);
  return {
    success: response.status === 200 && response.data.ok,
    result: response.data
  };
}

async function testUniversalPlatformIntegration() {
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-universal/integrate`, {
    method: 'POST',
    body: {
      activity_id: 'test-activity-id',
      compliance_data: {
        aicomplyr: {
          version: '1.0.0',
          generated_at: new Date().toISOString(),
          project_id: 'test-project',
          organization_id: config.organizationId,
          activity_id: 'test-activity-id'
        },
        compliance: {
          status: 'compliant',
          score: 95,
          risk_level: 'low',
          last_checked: new Date().toISOString()
        },
        ai_tools: [],
        policy_checks: [],
        violations: [],
        references: {}
      },
      async: true
    }
  });

  return {
    success: response.status === 200 && response.data.ok,
    result: response.data
  };
}

async function testAdobePlatformHealth() {
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-adobe/health`);
  return {
    success: response.status === 200 && response.data.ok,
    result: response.data
  };
}

async function testVeevaPlatformHealth() {
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-veeva/health`);
  return {
    success: response.status === 200 && response.data.ok,
    result: response.data
  };
}

async function testSharePointPlatformHealth() {
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-sharepoint/health`);
  return {
    success: response.status === 200 && response.data.ok,
    result: response.data
  };
}

async function testComplianceIntegration() {
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/compliance_check_agent_activity`, {
    method: 'POST',
    body: {
      activity_id: 'test-activity-id',
      trigger_type: 'manual',
      force_check: true
    }
  });

  return {
    success: response.status === 200 && response.data.success,
    result: response.data
  };
}

async function testDatabaseConnectivity() {
  // Test if we can query the platform configurations table
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-manager`);
  return {
    success: response.status === 200,
    result: 'Database connectivity verified'
  };
}

async function testSecurityHeaders() {
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-manager`);
  const hasCors = response.headers['access-control-allow-origin'] === '*';
  const hasContentType = response.headers['content-type']?.includes('application/json');
  
  return {
    success: hasCors && hasContentType,
    result: {
      cors: hasCors,
      contentType: hasContentType,
      headers: response.headers
    }
  };
}

async function testErrorHandling() {
  // Test with invalid organization ID
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-manager`, {
    headers: { 'x-org-id': 'invalid-org-id' }
  });
  
  return {
    success: response.status === 400, // Should return 400 for invalid org
    result: response.data
  };
}

async function testPerformance() {
  const startTime = Date.now();
  const response = await makeRequest(`${config.supabaseUrl}/functions/v1/platform-manager`);
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  return {
    success: response.status === 200 && responseTime < 5000, // Should respond within 5 seconds
    result: {
      responseTime: responseTime,
      status: response.status
    }
  };
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting Universal Platform Adapter Test Suite', 'bright');
  log(`Testing against: ${config.supabaseUrl}`, 'blue');
  log(`Organization ID: ${config.organizationId}`, 'blue');
  log(`Timeout: ${config.testTimeout}ms`, 'blue');
  
  const tests = [
    { name: 'Database Connectivity', fn: testDatabaseConnectivity },
    { name: 'Platform Manager Health', fn: testPlatformManagerHealth },
    { name: 'Platform Manager CRUD Operations', fn: testPlatformManagerCRUD },
    { name: 'Universal Platform Health', fn: testUniversalPlatformHealth },
    { name: 'Universal Platform Integration', fn: testUniversalPlatformIntegration },
    { name: 'Adobe Platform Health', fn: testAdobePlatformHealth },
    { name: 'Veeva Platform Health', fn: testVeevaPlatformHealth },
    { name: 'SharePoint Platform Health', fn: testSharePointPlatformHealth },
    { name: 'Compliance Integration', fn: testComplianceIntegration },
    { name: 'Security Headers', fn: testSecurityHeaders },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Performance', fn: testPerformance }
  ];

  for (const test of tests) {
    await runTest(test.name, test.fn);
  }

  // Print summary
  log('\n📊 Test Summary', 'bright');
  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Skipped: ${testResults.skipped}`, 'yellow');
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

  // Print detailed results
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.details
      .filter(test => test.status === 'failed' || test.status === 'error')
      .forEach(test => {
        log(`  - ${test.name}: ${test.error}`, 'red');
      });
  }

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Universal Platform Adapter Test Suite', 'bright');
  log('');
  log('Usage: node test-platform-adapters.js [options]', 'blue');
  log('');
  log('Options:', 'blue');
  log('  --help, -h          Show this help message', 'blue');
  log('  --url <url>         Supabase URL (default: from SUPABASE_URL env var)', 'blue');
  log('  --key <key>         Supabase API key (default: from SUPABASE_ANON_KEY env var)', 'blue');
  log('  --org <id>          Organization ID (default: from TEST_ORGANIZATION_ID env var)', 'blue');
  log('  --timeout <ms>      Test timeout in milliseconds (default: 30000)', 'blue');
  log('');
  log('Environment Variables:', 'blue');
  log('  SUPABASE_URL        Supabase project URL', 'blue');
  log('  SUPABASE_ANON_KEY   Supabase anonymous key', 'blue');
  log('  TEST_ORGANIZATION_ID Test organization ID', 'blue');
  process.exit(0);
}

// Parse command line arguments
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  const nextArg = process.argv[i + 1];
  
  switch (arg) {
    case '--url':
      if (nextArg) config.supabaseUrl = nextArg;
      i++;
      break;
    case '--key':
      if (nextArg) config.supabaseKey = nextArg;
      i++;
      break;
    case '--org':
      if (nextArg) config.organizationId = nextArg;
      i++;
      break;
    case '--timeout':
      if (nextArg) config.testTimeout = parseInt(nextArg);
      i++;
      break;
  }
}

// Run the tests
runAllTests().catch(error => {
  log(`💥 Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});