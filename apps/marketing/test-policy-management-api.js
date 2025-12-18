const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock user data for testing
const mockUser = {
  user_id: 'test-user-id',
  organization_id: 'test-org-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin'
};

// Generate test JWT token
const generateTestToken = () => {
  return jwt.sign(mockUser, JWT_SECRET, { expiresIn: '24h' });
};

// API client setup
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = generateTestToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Test utilities
const testUtils = {
  log: (message, data = null) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  
  assert: (condition, message) => {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },
  
  assertResponse: (response, expectedStatus = 200) => {
    testUtils.assert(response.status === expectedStatus, 
      `Expected status ${expectedStatus}, got ${response.status}`);
    testUtils.assert(response.data.success === true, 
      'Expected success: true in response');
  }
};

// Test data
const testData = {
  organization: {
    name: 'Test Pharma Corp',
    industry: 'pharmaceutical',
    compliance_tier: 'enterprise',
    contact_email: 'test@pharmacorp.com',
    contact_phone: '+1-555-0123',
    address: '123 Test Street, City, State'
  },
  
  policyTemplate: {
    name: 'Test FDA Template',
    description: 'Test FDA compliance template',
    industry: 'pharmaceutical',
    regulation_framework: 'FDA',
    template_rules: {
      data_handling: { patient_privacy: true },
      content_creation: { medical_claims: false }
    },
    risk_categories: {
      high: ['patient_data'],
      medium: ['adverse_events'],
      low: ['general_info']
    }
  },
  
  policy: {
    name: 'Test Social Media Policy',
    description: 'Test FDA-compliant social media policy',
    policy_rules: {
      data_handling: { 
        patient_privacy: true, 
        adverse_event_reporting: true 
      },
      content_creation: { 
        medical_claims: false, 
        balanced_presentation: true 
      }
    },
    compliance_framework: 'FDA',
    effective_date: '2024-02-01',
    expiry_date: '2025-02-01'
  },
  
  partner: {
    name: 'Test Marketing Agency',
    partner_type: 'agency',
    contact_email: 'contact@testagency.com',
    contact_phone: '+1-555-0456',
    address: '456 Agency Street, City, State',
    services_offered: ['social_media', 'content_creation'],
    compliance_certifications: ['ISO_27001']
  },
  
  policyRule: {
    rule_type: 'data_handling',
    rule_name: 'Patient Privacy Protection',
    description: 'Protect patient privacy in all communications',
    conditions: {
      data_type: 'patient_data',
      access_level: 'restricted'
    },
    requirements: {
      encryption: true,
      access_controls: true,
      audit_logging: true
    },
    risk_weight: 8,
    is_mandatory: true,
    enforcement_level: 'strict'
  }
};

// Test functions
const tests = {
  // Test organization endpoints
  async testOrganizations() {
    testUtils.log('🧪 Testing Organization endpoints...');
    
    try {
      // Test GET /api/organizations
      testUtils.log('Testing GET /api/organizations');
      const orgsResponse = await apiClient.get('/organizations');
      testUtils.assertResponse(orgsResponse);
      testUtils.assert(Array.isArray(orgsResponse.data.data), 'Expected data to be an array');
      
      // Test POST /api/organizations
      testUtils.log('Testing POST /api/organizations');
      const createOrgResponse = await apiClient.post('/organizations', testData.organization);
      testUtils.assertResponse(createOrgResponse, 201);
      testUtils.assert(createOrgResponse.data.data.name === testData.organization.name, 
        'Organization name should match');
      
      testUtils.log('✅ Organization tests passed');
      return createOrgResponse.data.data.id;
    } catch (error) {
      testUtils.log('❌ Organization tests failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Test policy template endpoints
  async testPolicyTemplates() {
    testUtils.log('🧪 Testing Policy Template endpoints...');
    
    try {
      // Test GET /api/policy-templates
      testUtils.log('Testing GET /api/policy-templates');
      const templatesResponse = await apiClient.get('/policy-templates');
      testUtils.assertResponse(templatesResponse);
      testUtils.assert(Array.isArray(templatesResponse.data.data), 'Expected data to be an array');
      
      // Test GET /api/policy-templates/:id
      if (templatesResponse.data.data.length > 0) {
        const templateId = templatesResponse.data.data[0].id;
        testUtils.log(`Testing GET /api/policy-templates/${templateId}`);
        const templateResponse = await apiClient.get(`/policy-templates/${templateId}`);
        testUtils.assertResponse(templateResponse);
        testUtils.assert(templateResponse.data.data.id === templateId, 'Template ID should match');
      }
      
      testUtils.log('✅ Policy Template tests passed');
      return templatesResponse.data.data[0]?.id;
    } catch (error) {
      testUtils.log('❌ Policy Template tests failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Test policy endpoints
  async testPolicies(templateId) {
    testUtils.log('🧪 Testing Policy endpoints...');
    
    try {
      // Test GET /api/policies
      testUtils.log('Testing GET /api/policies');
      const policiesResponse = await apiClient.get('/policies');
      testUtils.assertResponse(policiesResponse);
      testUtils.assert(Array.isArray(policiesResponse.data.data), 'Expected data to be an array');
      
      // Test POST /api/policies
      testUtils.log('Testing POST /api/policies');
      const createPolicyData = {
        ...testData.policy,
        template_id: templateId
      };
      const createPolicyResponse = await apiClient.post('/policies', createPolicyData);
      testUtils.assertResponse(createPolicyResponse, 201);
      testUtils.assert(createPolicyResponse.data.data.name === testData.policy.name, 
        'Policy name should match');
      
      const policyId = createPolicyResponse.data.data.id;
      
      // Test GET /api/policies/:id
      testUtils.log(`Testing GET /api/policies/${policyId}`);
      const policyResponse = await apiClient.get(`/policies/${policyId}`);
      testUtils.assertResponse(policyResponse);
      testUtils.assert(policyResponse.data.data.id === policyId, 'Policy ID should match');
      
      // Test PUT /api/policies/:id
      testUtils.log(`Testing PUT /api/policies/${policyId}`);
      const updateData = {
        name: 'Updated Test Policy',
        status: 'active'
      };
      const updatePolicyResponse = await apiClient.put(`/policies/${policyId}`, updateData);
      testUtils.assertResponse(updatePolicyResponse);
      testUtils.assert(updatePolicyResponse.data.data.name === updateData.name, 
        'Policy name should be updated');
      
      testUtils.log('✅ Policy tests passed');
      return policyId;
    } catch (error) {
      testUtils.log('❌ Policy tests failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Test policy rules endpoints
  async testPolicyRules(policyId) {
    testUtils.log('🧪 Testing Policy Rules endpoints...');
    
    try {
      // Test GET /api/policies/:id/rules
      testUtils.log(`Testing GET /api/policies/${policyId}/rules`);
      const rulesResponse = await apiClient.get(`/policies/${policyId}/rules`);
      testUtils.assertResponse(rulesResponse);
      testUtils.assert(Array.isArray(rulesResponse.data.data), 'Expected data to be an array');
      
      // Test POST /api/policies/:id/rules
      testUtils.log(`Testing POST /api/policies/${policyId}/rules`);
      const createRuleResponse = await apiClient.post(`/policies/${policyId}/rules`, testData.policyRule);
      testUtils.assertResponse(createRuleResponse, 201);
      testUtils.assert(createRuleResponse.data.data.rule_name === testData.policyRule.rule_name, 
        'Rule name should match');
      
      testUtils.log('✅ Policy Rules tests passed');
      return createRuleResponse.data.data.id;
    } catch (error) {
      testUtils.log('❌ Policy Rules tests failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Test partner endpoints
  async testPartners() {
    testUtils.log('🧪 Testing Partner endpoints...');
    
    try {
      // Test GET /api/partners
      testUtils.log('Testing GET /api/partners');
      const partnersResponse = await apiClient.get('/partners');
      testUtils.assertResponse(partnersResponse);
      testUtils.assert(Array.isArray(partnersResponse.data.data), 'Expected data to be an array');
      
      // Test POST /api/partners
      testUtils.log('Testing POST /api/partners');
      const createPartnerResponse = await apiClient.post('/partners', testData.partner);
      testUtils.assertResponse(createPartnerResponse, 201);
      testUtils.assert(createPartnerResponse.data.data.name === testData.partner.name, 
        'Partner name should match');
      
      testUtils.log('✅ Partner tests passed');
      return createPartnerResponse.data.data.id;
    } catch (error) {
      testUtils.log('❌ Partner tests failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Test policy distribution endpoints
  async testPolicyDistribution(policyId, partnerId) {
    testUtils.log('🧪 Testing Policy Distribution endpoints...');
    
    try {
      // Test POST /api/policies/:id/distribute
      testUtils.log(`Testing POST /api/policies/${policyId}/distribute`);
      const distributeData = {
        partner_ids: [partnerId]
      };
      const distributeResponse = await apiClient.post(`/policies/${policyId}/distribute`, distributeData);
      testUtils.assertResponse(distributeResponse);
      testUtils.assert(Array.isArray(distributeResponse.data.data), 'Expected data to be an array');
      
      // Test GET /api/policies/:id/distributions
      testUtils.log(`Testing GET /api/policies/${policyId}/distributions`);
      const distributionsResponse = await apiClient.get(`/policies/${policyId}/distributions`);
      testUtils.assertResponse(distributionsResponse);
      testUtils.assert(Array.isArray(distributionsResponse.data.data), 'Expected data to be an array');
      
      testUtils.log('✅ Policy Distribution tests passed');
    } catch (error) {
      testUtils.log('❌ Policy Distribution tests failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Test compliance endpoints
  async testCompliance() {
    testUtils.log('🧪 Testing Compliance endpoints...');
    
    try {
      // Test GET /api/compliance/violations
      testUtils.log('Testing GET /api/compliance/violations');
      const violationsResponse = await apiClient.get('/compliance/violations');
      testUtils.assertResponse(violationsResponse);
      testUtils.assert(Array.isArray(violationsResponse.data.data), 'Expected data to be an array');
      
      // Test GET /api/compliance/checks
      testUtils.log('Testing GET /api/compliance/checks');
      const checksResponse = await apiClient.get('/compliance/checks');
      testUtils.assertResponse(checksResponse);
      testUtils.assert(Array.isArray(checksResponse.data.data), 'Expected data to be an array');
      
      testUtils.log('✅ Compliance tests passed');
    } catch (error) {
      testUtils.log('❌ Compliance tests failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Test audit logs endpoints
  async testAuditLogs() {
    testUtils.log('🧪 Testing Audit Logs endpoints...');
    
    try {
      // Test GET /api/audit-logs
      testUtils.log('Testing GET /api/audit-logs');
      const auditLogsResponse = await apiClient.get('/audit-logs');
      testUtils.assertResponse(auditLogsResponse);
      testUtils.assert(Array.isArray(auditLogsResponse.data.data), 'Expected data to be an array');
      
      testUtils.log('✅ Audit Logs tests passed');
    } catch (error) {
      testUtils.log('❌ Audit Logs tests failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Test dashboard endpoints
  async testDashboard() {
    testUtils.log('🧪 Testing Dashboard endpoints...');
    
    try {
      // Test GET /api/dashboard/stats
      testUtils.log('Testing GET /api/dashboard/stats');
      const statsResponse = await apiClient.get('/dashboard/stats');
      testUtils.assertResponse(statsResponse);
      testUtils.assert(statsResponse.data.data.policies, 'Expected policies stats');
      testUtils.assert(statsResponse.data.data.partners, 'Expected partners stats');
      testUtils.assert(statsResponse.data.data.compliance, 'Expected compliance stats');
      testUtils.assert(Array.isArray(statsResponse.data.data.recent_activity), 'Expected recent activity');
      
      testUtils.log('✅ Dashboard tests passed');
    } catch (error) {
      testUtils.log('❌ Dashboard tests failed:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Test error handling
  async testErrorHandling() {
    testUtils.log('🧪 Testing Error Handling...');
    
    try {
      // Test invalid token
      testUtils.log('Testing invalid token');
      try {
        await axios.get(`${API_BASE_URL}/policies`, {
          headers: { 'Authorization': 'Bearer invalid-token' }
        });
        throw new Error('Should have failed with invalid token');
      } catch (error) {
        testUtils.assert(error.response?.status === 401, 'Should return 401 for invalid token');
      }
      
      // Test missing token
      testUtils.log('Testing missing token');
      try {
        await axios.get(`${API_BASE_URL}/policies`);
        throw new Error('Should have failed with missing token');
      } catch (error) {
        testUtils.assert(error.response?.status === 401, 'Should return 401 for missing token');
      }
      
      // Test invalid policy ID
      testUtils.log('Testing invalid policy ID');
      try {
        await apiClient.get('/policies/invalid-uuid');
        throw new Error('Should have failed with invalid policy ID');
      } catch (error) {
        testUtils.assert(error.response?.status === 404, 'Should return 404 for invalid policy ID');
      }
      
      testUtils.log('✅ Error Handling tests passed');
    } catch (error) {
      testUtils.log('❌ Error Handling tests failed:', error.message);
      throw error;
    }
  }
};

// Main test runner
async function runAllTests() {
  testUtils.log('🚀 Starting Policy Management API Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  try {
    // Run tests in sequence
    await tests.testOrganizations();
    results.passed++;
    
    const templateId = await tests.testPolicyTemplates();
    results.passed++;
    
    const policyId = await tests.testPolicies(templateId);
    results.passed++;
    
    await tests.testPolicyRules(policyId);
    results.passed++;
    
    const partnerId = await tests.testPartners();
    results.passed++;
    
    await tests.testPolicyDistribution(policyId, partnerId);
    results.passed++;
    
    await tests.testCompliance();
    results.passed++;
    
    await tests.testAuditLogs();
    results.passed++;
    
    await tests.testDashboard();
    results.passed++;
    
    await tests.testErrorHandling();
    results.passed++;
    
  } catch (error) {
    results.failed++;
    results.errors.push(error.message);
    testUtils.log('❌ Test failed:', error.message);
  }
  
  // Print summary
  testUtils.log('\n📊 Test Summary:');
  testUtils.log(`✅ Passed: ${results.passed}`);
  testUtils.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    testUtils.log('\n❌ Errors:');
    results.errors.forEach((error, index) => {
      testUtils.log(`${index + 1}. ${error}`);
    });
  }
  
  if (results.failed === 0) {
    testUtils.log('\n🎉 All tests passed! Policy Management API is working correctly.');
  } else {
    testUtils.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n✅ API tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ API tests failed:', error);
      process.exit(1);
    });
}

module.exports = { tests, testUtils, testData };
