const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Mock JWT tokens for testing (in production, these would be real tokens)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xMjMiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwib3JnYW5pemF0aW9uSWQiOiJvcmdfMTIzIn0.test';
const SUPER_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJzdXBlcl9hZG1pbl8xMjMiLCJlbWFpbCI6InN1cGVyYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoic3VwZXItYWRtaW4iLCJvcmdhbml6YXRpb25JZCI6Im9yZ18xMjMifQ.test';

async function testAdminActions() {
    console.log('🧪 Testing Admin Actions with Audit Logging\n');
    
    try {
        // Test 1: Regular admin action (clear_cache)
        console.log('1. Testing regular admin action (clear_cache)...');
        const adminResponse = await axios.post(`${BASE_URL}/admin/actions`, {
            action: 'clear_cache',
            target: 'user_cache',
            reason: 'Performance optimization test'
        }, {
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Admin action successful:', adminResponse.data.message);
        
        // Wait a moment for the audit log to be written
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 2: Super-admin action (suspend_client)
        console.log('\n2. Testing super-admin action (suspend_client)...');
        const superAdminResponse = await axios.post(`${BASE_URL}/admin/actions`, {
            action: 'suspend_client',
            target: 'org_456',
            reason: 'Payment overdue test'
        }, {
            headers: {
                'Authorization': `Bearer ${SUPER_ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Super-admin action successful:', superAdminResponse.data.message);
        
        // Wait a moment for the audit log to be written
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 3: View audit logs
        console.log('\n3. Testing audit log retrieval...');
        const auditLogsResponse = await axios.get(`${BASE_URL}/debug/admin-audit-logs`, {
            params: {
                limit: 10,
                offset: 0
            },
            timeout: 10000
        });
        
        console.log('✅ Audit logs retrieved successfully');
        console.log(`📊 Total audit entries: ${auditLogsResponse.data.pagination.total}`);
        console.log(`📄 Retrieved entries: ${auditLogsResponse.data.data.length}`);
        
        // Display recent audit entries
        if (auditLogsResponse.data.data.length > 0) {
            console.log('\n📋 Recent Audit Entries:');
            auditLogsResponse.data.data.forEach((entry, index) => {
                console.log(`\n${index + 1}. Action: ${entry.action}`);
                console.log(`   Admin User: ${entry.admin_user_id}`);
                console.log(`   Target: ${entry.target}`);
                console.log(`   Reason: ${entry.reason}`);
                console.log(`   IP Address: ${entry.ip_address}`);
                console.log(`   Timestamp: ${entry.timestamp}`);
                console.log(`   Status: ${entry.result?.status || 'N/A'}`);
            });
        }
        
        // Test 4: Filter audit logs by action
        console.log('\n4. Testing filtered audit logs (clear_cache actions)...');
        const filteredResponse = await axios.get(`${BASE_URL}/debug/admin-audit-logs`, {
            params: {
                action: 'clear_cache',
                limit: 5
            },
            timeout: 10000
        });
        
        console.log('✅ Filtered audit logs retrieved');
        console.log(`📊 Clear cache actions found: ${filteredResponse.data.pagination.total}`);
        
        console.log('\n🎉 All admin audit tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        
        process.exit(1);
    }
}

async function main() {
    console.log('🚀 Starting Admin Audit Logging Tests\n');
    
    try {
        await testAdminActions();
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { testAdminActions }; 