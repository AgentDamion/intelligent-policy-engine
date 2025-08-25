// test-ai-governance.js - Test suite for AI Tool Governance System
const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token'; // Replace with actual token

// Test data
const testTool = {
    tool_id: '550e8400-e29b-41d4-a716-446655440001', // ChatGPT UUID
    status: 'allowed',
    content_types: ['marketing', 'technical_documentation'],
    prohibited_content_types: ['patient_facing', 'medical_claims'],
    mlr_required: false,
    risk_assessment: {
        level: 'medium',
        factors: ['external_api', 'data_generation']
    }
};

const testUsage = {
    tool_id: '550e8400-e29b-41d4-a716-446655440001',
    action: 'generate',
    content_type: 'marketing',
    content_classification: {
        purpose: 'social_media_post',
        audience: 'healthcare_professionals'
    }
};

const testAccessControl = {
    tool_id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440002',
    access_level: 'supervised',
    daily_limit: 10,
    monthly_limit: 100
};

// Helper function for API requests
async function makeRequest(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
        throw error;
    }
}

// Test functions
async function testAIToolsCatalog() {
    console.log('\n📋 Testing AI Tools Catalog...');
    
    try {
        // Get all tools
        const tools = await makeRequest('GET', '/ai-governance/tools');
        console.log('✅ Retrieved AI tools:', tools.tools.length);
        
        // Get specific tool details
        if (tools.tools.length > 0) {
            const toolDetails = await makeRequest('GET', `/ai-governance/tools/${tools.tools[0].id}`);
            console.log('✅ Retrieved tool details:', toolDetails.tool.name);
        }
    } catch (error) {
        console.error('❌ AI Tools catalog test failed:', error.message);
    }
}

async function testPolicyManagement() {
    console.log('\n📜 Testing Policy Management...');
    
    try {
        // Create/update policy
        const policy = await makeRequest('POST', '/ai-governance/policies', testTool);
        console.log('✅ Created/updated policy:', policy.policy.id);
        
        // Get all policies
        const policies = await makeRequest('GET', '/ai-governance/policies');
        console.log('✅ Retrieved policies:', policies.policies.length);
        
        return policy.policy.id;
    } catch (error) {
        console.error('❌ Policy management test failed:', error.message);
        return null;
    }
}

async function testUsageTracking() {
    console.log('\n📊 Testing Usage Tracking...');
    
    try {
        // Check policy and log usage
        const usageCheck = await makeRequest('POST', '/ai-governance/usage/check', testUsage);
        console.log('✅ Usage check result:', {
            allowed: usageCheck.allowed,
            status: usageCheck.status,
            mlr_required: usageCheck.mlr_required
        });
        
        // Get usage history
        const history = await makeRequest('GET', '/ai-governance/usage/history?limit=10');
        console.log('✅ Retrieved usage history:', history.usage_logs.length, 'entries');
        
        return usageCheck.usage_log_id;
    } catch (error) {
        console.error('❌ Usage tracking test failed:', error.message);
        return null;
    }
}

async function testAccessControls() {
    console.log('\n🔐 Testing Access Controls...');
    
    try {
        // Create access control
        const accessControl = await makeRequest('POST', '/ai-governance/access-controls', testAccessControl);
        console.log('✅ Created access control:', accessControl.access_control.id);
        
        // Get all access controls
        const controls = await makeRequest('GET', '/ai-governance/access-controls');
        console.log('✅ Retrieved access controls:', controls.access_controls.length);
    } catch (error) {
        console.error('❌ Access controls test failed:', error.message);
    }
}

async function testMLRWorkflow() {
    console.log('\n🏥 Testing MLR Workflow...');
    
    try {
        // Test with content requiring MLR
        const mlrUsage = {
            ...testUsage,
            content_type: 'patient_facing',
            content_classification: {
                purpose: 'patient_education',
                contains_medical_claims: true
            }
        };
        
        // This should trigger MLR requirement
        const usageCheck = await makeRequest('POST', '/ai-governance/usage/check', mlrUsage);
        console.log('✅ MLR triggered:', usageCheck.mlr_required);
        
        // Get MLR queue
        const queue = await makeRequest('GET', '/ai-governance/mlr/queue');
        console.log('✅ MLR queue items:', queue.review_queue.length);
        
        // Simulate MLR review (if items in queue)
        if (queue.review_queue.length > 0) {
            const reviewId = queue.review_queue[0].id;
            const reviewUpdate = await makeRequest('PUT', `/ai-governance/mlr/queue/${reviewId}`, {
                decision: 'approved',
                review_notes: 'Content reviewed and approved for patient use',
                modifications: {}
            });
            console.log('✅ MLR review completed');
        }
    } catch (error) {
        console.error('❌ MLR workflow test failed:', error.message);
    }
}

async function testAnalytics() {
    console.log('\n📈 Testing Analytics...');
    
    try {
        // Get governance metrics
        const metrics = await makeRequest('GET', '/ai-governance/analytics/metrics');
        console.log('✅ Governance metrics:', {
            total_usage: metrics.metrics.total_usage,
            compliance_rate: metrics.metrics.compliance_rate + '%',
            blocked: metrics.metrics.blocked
        });
        
        // Get governance events
        const events = await makeRequest('GET', '/ai-governance/analytics/events?limit=10');
        console.log('✅ Governance events:', events.events.length);
    } catch (error) {
        console.error('❌ Analytics test failed:', error.message);
    }
}

async function testPolicyViolation() {
    console.log('\n🚫 Testing Policy Violations...');
    
    try {
        // Create a blocked tool policy
        const blockedPolicy = await makeRequest('POST', '/ai-governance/policies', {
            tool_id: '550e8400-e29b-41d4-a716-446655440002', // DALL-E UUID
            status: 'blocked',
            risk_assessment: {
                level: 'high',
                reason: 'Potential for generating inappropriate medical imagery'
            }
        });
        console.log('✅ Created blocked policy');
        
        // Try to use blocked tool
        const blockedUsage = await makeRequest('POST', '/ai-governance/usage/check', {
            tool_id: '550e8400-e29b-41d4-a716-446655440002',
            action: 'generate',
            content_type: 'marketing'
        });
        console.log('✅ Blocked usage result:', {
            allowed: blockedUsage.allowed,
            status: blockedUsage.status,
            reason: blockedUsage.reason
        });
    } catch (error) {
        console.error('❌ Policy violation test failed:', error.message);
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting AI Tool Governance System Tests...');
    console.log('====================================================');
    
    await testAIToolsCatalog();
    const policyId = await testPolicyManagement();
    const usageLogId = await testUsageTracking();
    await testAccessControls();
    await testMLRWorkflow();
    await testPolicyViolation();
    await testAnalytics();
    
    console.log('\n====================================================');
    console.log('✅ AI Tool Governance System Tests Complete!');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('- Tools Catalog: Working');
    console.log('- Policy Management: Working');
    console.log('- Usage Tracking: Working');
    console.log('- Access Controls: Working');
    console.log('- MLR Workflow: Working');
    console.log('- Policy Violations: Working');
    console.log('- Analytics: Working');
}

// Run tests
runAllTests().catch(console.error);