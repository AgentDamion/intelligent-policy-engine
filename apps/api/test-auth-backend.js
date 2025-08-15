// Test script for Modern Authentication Hub Backend Integration
// Run this to verify the auth endpoints are working

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';
const TEST_USER = {
    email: 'admin@aicomplyr.io',
    password: 'Test1234!'  // Mock auth accepts any password
};

const TEST_ORG = {
    orgName: 'Test Enterprise',
    region: 'us',
    emailDomain: 'testcompany.com',
    enableSSO: false,
    orgType: 'enterprise',
    initialRoles: ['admin']
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, headers = {}) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    console.log(`\n🔍 ${method} ${url}`);
    if (body) console.log('📤 Body:', JSON.stringify(body, null, 2));
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        console.log(`📥 Status: ${response.status}`);
        console.log('📄 Response:', JSON.stringify(data, null, 2));
        
        return { response, data };
    } catch (error) {
        console.error('❌ Request failed:', error.message);
        return { error };
    }
}

// Test functions
async function testHealthCheck() {
    console.log('\n🏥 === HEALTH CHECK ===');
    await apiCall('/health');
}

async function testSignIn() {
    console.log('\n🔐 === SIGN IN TEST ===');
    return await apiCall('/auth/signin', 'POST', TEST_USER);
}

async function testSessionCheck(token) {
    console.log('\n👤 === SESSION CHECK ===');
    return await apiCall('/auth/session', 'GET', null, {
        'Authorization': `Bearer ${token}`
    });
}

async function testCreateOrg() {
    console.log('\n🏢 === CREATE ORGANIZATION ===');
    return await apiCall('/org/create', 'POST', TEST_ORG);
}

async function testRequestAccess() {
    console.log('\n📝 === REQUEST ACCESS ===');
    return await apiCall('/org/request-access', 'POST', {
        email: 'newuser@example.com',
        inviteCode: 'TEST123'
    });
}

async function testLogout() {
    console.log('\n🚪 === LOGOUT ===');
    return await apiCall('/auth/logout', 'POST');
}

async function testAnalytics() {
    console.log('\n📊 === ANALYTICS ===');
    return await apiCall('/analytics/track', 'POST', {
        name: 'test.event',
        properties: { source: 'backend_test' }
    });
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Modern Authentication Hub Backend Tests...\n');
    
    let authToken = null;
    
    try {
        // 1. Health check
        await testHealthCheck();
        
        // 2. Test sign in
        const signInResult = await testSignIn();
        if (signInResult.data && signInResult.data.token) {
            authToken = signInResult.data.token;
            console.log('✅ Sign in successful, token obtained');
        } else {
            console.log('⚠️ Sign in failed or no token returned');
        }
        
        // 3. Test session check (if we have a token)
        if (authToken) {
            await testSessionCheck(authToken);
        }
        
        // 4. Test org creation
        await testCreateOrg();
        
        // 5. Test access request
        await testRequestAccess();
        
        // 6. Test analytics
        await testAnalytics();
        
        // 7. Test logout
        await testLogout();
        
    } catch (error) {
        console.error('\n❌ Test runner failed:', error.message);
    }
    
    console.log('\n✅ Backend testing complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Check that all endpoints returned expected responses');
    console.log('2. Run the UI and test the complete auth flow');
    console.log('3. Set up SSO providers if needed');
    console.log('4. Implement MFA if required');
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    testHealthCheck,
    testSignIn,
    testSessionCheck,
    testCreateOrg,
    testRequestAccess,
    testLogout,
    testAnalytics
};

