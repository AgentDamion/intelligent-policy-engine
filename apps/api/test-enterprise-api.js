const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_ORGANIZATION_ID = 'test-org-123'; // Replace with actual org ID from your database

// Test data
const testData = {
  changeRequest: {
    organization_id: TEST_ORGANIZATION_ID,
    request_type: 'policy',
    title: 'Test AI Governance Policy Update',
    description: 'Test policy update for FDA compliance',
    impact_level: 'high',
    requester_id: 'test-user-123'
  },
  incident: {
    organization_id: TEST_ORGANIZATION_ID,
    incident_number: 'TEST-INC-001',
    incident_type: 'compliance',
    severity: 'medium',
    priority: 'high',
    title: 'Test Data Classification Violation',
    description: 'Test incident description',
    reported_by: 'test-user-123'
  },
  sopDocument: {
    organization_id: TEST_ORGANIZATION_ID,
    document_number: 'TEST-SOP-001',
    title: 'Test AI Tool Approval Procedure',
    document_type: 'sop',
    version: '1.0',
    content: 'Test SOP content',
    approver_id: 'test-user-123'
  },
  vendor: {
    organization_id: TEST_ORGANIZATION_ID,
    vendor_name: 'Test CloudTech Solutions',
    vendor_type: 'cloud',
    risk_level: 'medium',
    compliance_status: 'pending',
    data_access_level: 'limited'
  },
  drPlan: {
    organization_id: TEST_ORGANIZATION_ID,
    plan_name: 'Test AI Platform DR Plan',
    plan_type: 'dr',
    critical_functions: ['AI Model Serving', 'Data Processing'],
    recovery_time_objective_hours: 4,
    recovery_point_objective_hours: 1
  },
  onboarding: {
    organization_id: TEST_ORGANIZATION_ID,
    user_id: 'test-user-123',
    onboarding_type: 'new_hire',
    start_date: '2024-01-01',
    target_completion_date: '2024-01-15'
  },
  compliance: {
    organization_id: TEST_ORGANIZATION_ID,
    regulation_name: 'Test FDA 21 CFR Part 11',
    jurisdiction: 'US',
    regulation_type: 'fda',
    effective_date: '2024-01-01',
    compliance_deadline: '2024-12-31',
    risk_level: 'high',
    responsible_party: 'test-user-123'
  }
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility function to log test results
function logTest(testName, success, error = null) {
  if (success) {
    console.log(`✅ ${testName} - PASSED`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName} - FAILED`);
    testResults.failed++;
    if (error) {
      testResults.errors.push({ test: testName, error: error.message || error });
    }
  }
}

// Test utility endpoints
async function testUtilityEndpoints() {
  console.log('\n🔧 Testing Utility Endpoints...');
  
  try {
    // Test options endpoint
    const optionsResponse = await axios.get(`${BASE_URL}/api/enterprise/options`);
    if (optionsResponse.data.success && optionsResponse.data.data) {
      logTest('Enterprise Options Endpoint', true);
    } else {
      logTest('Enterprise Options Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('Enterprise Options Endpoint', false, error);
  }
}

// Test change management endpoints
async function testChangeManagement() {
  console.log('\n📋 Testing Change Management Endpoints...');
  
  try {
    // Test GET change requests
    const getResponse = await axios.get(`${BASE_URL}/api/change-requests`, {
      params: { organization_id: TEST_ORGANIZATION_ID }
    });
    logTest('GET Change Requests', getResponse.data.success);
    
    // Test POST change request
    const postResponse = await axios.post(`${BASE_URL}/api/change-requests`, testData.changeRequest);
    if (postResponse.data.success && postResponse.data.data.id) {
      logTest('POST Change Request', true);
      
      // Test PUT change request
      const updateData = { ...testData.changeRequest, title: 'Updated Test Title' };
      const putResponse = await axios.put(`${BASE_URL}/api/change-requests/${postResponse.data.data.id}`, updateData);
      logTest('PUT Change Request', putResponse.data.success);
    } else {
      logTest('POST Change Request', false, 'No ID returned');
    }
  } catch (error) {
    logTest('Change Management Endpoints', false, error);
  }
}

// Test incident management endpoints
async function testIncidentManagement() {
  console.log('\n🚨 Testing Incident Management Endpoints...');
  
  try {
    // Test GET incidents
    const getResponse = await axios.get(`${BASE_URL}/api/incidents`, {
      params: { organization_id: TEST_ORGANIZATION_ID }
    });
    logTest('GET Incidents', getResponse.data.success);
    
    // Test POST incident
    const postResponse = await axios.post(`${BASE_URL}/api/incidents`, testData.incident);
    if (postResponse.data.success && postResponse.data.data.id) {
      logTest('POST Incident', true);
      
      // Test PUT incident
      const updateData = { ...testData.incident, title: 'Updated Test Incident' };
      const putResponse = await axios.put(`${BASE_URL}/api/incidents/${postResponse.data.data.id}`, updateData);
      logTest('PUT Incident', putResponse.data.success);
    } else {
      logTest('POST Incident', false, 'No ID returned');
    }
  } catch (error) {
    logTest('Incident Management Endpoints', false, error);
  }
}

// Test SOP document endpoints
async function testSOPDocuments() {
  console.log('\n📄 Testing SOP Document Endpoints...');
  
  try {
    // Test GET SOP documents
    const getResponse = await axios.get(`${BASE_URL}/api/sop-documents`, {
      params: { organization_id: TEST_ORGANIZATION_ID }
    });
    logTest('GET SOP Documents', getResponse.data.success);
    
    // Test POST SOP document
    const postResponse = await axios.post(`${BASE_URL}/api/sop-documents`, testData.sopDocument);
    if (postResponse.data.success && postResponse.data.data.id) {
      logTest('POST SOP Document', true);
      
      // Test PUT SOP document
      const updateData = { ...testData.sopDocument, title: 'Updated Test SOP' };
      const putResponse = await axios.put(`${BASE_URL}/api/sop-documents/${postResponse.data.data.id}`, updateData);
      logTest('PUT SOP Document', putResponse.data.success);
    } else {
      logTest('POST SOP Document', false, 'No ID returned');
    }
  } catch (error) {
    logTest('SOP Document Endpoints', false, error);
  }
}

// Test vendor management endpoints
async function testVendorManagement() {
  console.log('\n🏢 Testing Vendor Management Endpoints...');
  
  try {
    // Test GET vendors
    const getResponse = await axios.get(`${BASE_URL}/api/vendors`, {
      params: { organization_id: TEST_ORGANIZATION_ID }
    });
    logTest('GET Vendors', getResponse.data.success);
    
    // Test POST vendor
    const postResponse = await axios.post(`${BASE_URL}/api/vendors`, testData.vendor);
    if (postResponse.data.success && postResponse.data.data.id) {
      logTest('POST Vendor', true);
      
      // Test PUT vendor
      const updateData = { ...testData.vendor, vendor_name: 'Updated Test Vendor' };
      const putResponse = await axios.put(`${BASE_URL}/api/vendors/${postResponse.data.data.id}`, updateData);
      logTest('PUT Vendor', putResponse.data.success);
    } else {
      logTest('POST Vendor', false, 'No ID returned');
    }
  } catch (error) {
    logTest('Vendor Management Endpoints', false, error);
  }
}

// Test disaster recovery endpoints
async function testDisasterRecovery() {
  console.log('\n🔄 Testing Disaster Recovery Endpoints...');
  
  try {
    // Test GET DR plans
    const getResponse = await axios.get(`${BASE_URL}/api/disaster-recovery-plans`, {
      params: { organization_id: TEST_ORGANIZATION_ID }
    });
    logTest('GET Disaster Recovery Plans', getResponse.data.success);
    
    // Test POST DR plan
    const postResponse = await axios.post(`${BASE_URL}/api/disaster-recovery-plans`, testData.drPlan);
    if (postResponse.data.success && postResponse.data.data.id) {
      logTest('POST Disaster Recovery Plan', true);
      
      // Test PUT DR plan
      const updateData = { ...testData.drPlan, plan_name: 'Updated Test DR Plan' };
      const putResponse = await axios.put(`${BASE_URL}/api/disaster-recovery-plans/${postResponse.data.data.id}`, updateData);
      logTest('PUT Disaster Recovery Plan', putResponse.data.success);
    } else {
      logTest('POST Disaster Recovery Plan', false, 'No ID returned');
    }
  } catch (error) {
    logTest('Disaster Recovery Endpoints', false, error);
  }
}

// Test enterprise onboarding endpoints
async function testEnterpriseOnboarding() {
  console.log('\n👥 Testing Enterprise Onboarding Endpoints...');
  
  try {
    // Test GET onboarding records
    const getResponse = await axios.get(`${BASE_URL}/api/enterprise-onboarding`, {
      params: { organization_id: TEST_ORGANIZATION_ID }
    });
    logTest('GET Enterprise Onboarding', getResponse.data.success);
    
    // Test POST onboarding record
    const postResponse = await axios.post(`${BASE_URL}/api/enterprise-onboarding`, testData.onboarding);
    if (postResponse.data.success && postResponse.data.data.id) {
      logTest('POST Enterprise Onboarding', true);
      
      // Test PUT onboarding record
      const updateData = { ...testData.onboarding, status: 'completed' };
      const putResponse = await axios.put(`${BASE_URL}/api/enterprise-onboarding/${postResponse.data.data.id}`, updateData);
      logTest('PUT Enterprise Onboarding', putResponse.data.success);
    } else {
      logTest('POST Enterprise Onboarding', false, 'No ID returned');
    }
  } catch (error) {
    logTest('Enterprise Onboarding Endpoints', false, error);
  }
}

// Test compliance requirements endpoints
async function testComplianceRequirements() {
  console.log('\n📋 Testing Compliance Requirements Endpoints...');
  
  try {
    // Test GET compliance requirements
    const getResponse = await axios.get(`${BASE_URL}/api/compliance-requirements`, {
      params: { organization_id: TEST_ORGANIZATION_ID }
    });
    logTest('GET Compliance Requirements', getResponse.data.success);
    
    // Test POST compliance requirement
    const postResponse = await axios.post(`${BASE_URL}/api/compliance-requirements`, testData.compliance);
    if (postResponse.data.success && postResponse.data.data.id) {
      logTest('POST Compliance Requirement', true);
      
      // Test PUT compliance requirement
      const updateData = { ...testData.compliance, status: 'compliant' };
      const putResponse = await axios.put(`${BASE_URL}/api/compliance-requirements/${postResponse.data.data.id}`, updateData);
      logTest('PUT Compliance Requirement', putResponse.data.success);
    } else {
      logTest('POST Compliance Requirement', false, 'No ID returned');
    }
  } catch (error) {
    logTest('Compliance Requirements Endpoints', false, error);
  }
}

// Test enterprise dashboard endpoint
async function testEnterpriseDashboard() {
  console.log('\n📊 Testing Enterprise Dashboard Endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/enterprise/dashboard`, {
      params: { organization_id: TEST_ORGANIZATION_ID }
    });
    
    if (response.data.success && response.data.data.counts && response.data.data.criticalItems) {
      logTest('Enterprise Dashboard', true);
    } else {
      logTest('Enterprise Dashboard', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('Enterprise Dashboard', false, error);
  }
}

// Test filtering and pagination
async function testFilteringAndPagination() {
  console.log('\n🔍 Testing Filtering and Pagination...');
  
  try {
    // Test filtering
    const filterResponse = await axios.get(`${BASE_URL}/api/change-requests`, {
      params: { 
        organization_id: TEST_ORGANIZATION_ID,
        status: 'submitted',
        impact_level: 'high'
      }
    });
    logTest('Filtering Parameters', filterResponse.data.success);
    
    // Test pagination
    const paginationResponse = await axios.get(`${BASE_URL}/api/change-requests`, {
      params: { 
        organization_id: TEST_ORGANIZATION_ID,
        page: 1,
        limit: 5
      }
    });
    
    if (paginationResponse.data.success && paginationResponse.data.pagination) {
      logTest('Pagination Parameters', true);
    } else {
      logTest('Pagination Parameters', false, 'No pagination data');
    }
  } catch (error) {
    logTest('Filtering and Pagination', false, error);
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Enterprise API Tests...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`🏢 Test Organization ID: ${TEST_ORGANIZATION_ID}`);
  
  try {
    // Test basic connectivity first
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    if (healthResponse.data.status === 'healthy') {
      console.log('✅ Server is healthy and responding');
    } else {
      console.log('❌ Server health check failed');
      return;
    }
    
    // Run all test suites
    await testUtilityEndpoints();
    await testChangeManagement();
    await testIncidentManagement();
    await testSOPDocuments();
    await testVendorManagement();
    await testDisasterRecovery();
    await testEnterpriseOnboarding();
    await testComplianceRequirements();
    await testEnterpriseDashboard();
    await testFilteringAndPagination();
    
    // Print summary
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.errors.length > 0) {
      console.log('\n❌ Error Details:');
      testResults.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.error}`);
      });
    }
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed! Enterprise API is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 3001');
      console.log('💡 Run: npm start');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults
};
