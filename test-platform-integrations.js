// Test script for Platform Integrations
// Run with: node test-platform-integrations.js

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001';

async function testPlatformIntegrations() {
  console.log('🧪 Testing Platform Integrations...\n');

  const enterpriseId = 'enterprise-1';
  const headers = {
    'Content-Type': 'application/json',
    'x-enterprise-id': enterpriseId
  };

  try {
    // Test 1: Create a platform configuration
    console.log('1️⃣ Creating platform configuration...');
    const configData = {
      name: 'Test Veeva Vault',
      platform_type: 'veeva',
      auth_config: {
        auth_type: 'oauth2',
        base_url: 'https://test-vault.veevavault.com',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        vault: 'test-vault'
      },
      sync_settings: {
        auto_sync: true,
        sync_on_approval: true,
        sync_on_submission: false
      }
    };

    const createResponse = await fetch(`${API_BASE}/api/platform-integrations/configs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(configData)
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create config: ${createResponse.status}`);
    }

    const createdConfig = await createResponse.json();
    console.log('✅ Configuration created:', createdConfig.item.name);

    // Test 2: List configurations
    console.log('\n2️⃣ Listing configurations...');
    const listResponse = await fetch(`${API_BASE}/api/platform-integrations/configs`, {
      headers: { 'x-enterprise-id': enterpriseId }
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list configs: ${listResponse.status}`);
    }

    const configs = await listResponse.json();
    console.log('✅ Found', configs.items.length, 'configurations');

    // Test 3: Test connection
    console.log('\n3️⃣ Testing connection...');
    const testResponse = await fetch(`${API_BASE}/api/platform-integrations/configs/${createdConfig.item.id}/test`, {
      method: 'POST',
      headers: { 'x-enterprise-id': enterpriseId }
    });

    if (!testResponse.ok) {
      throw new Error(`Failed to test connection: ${testResponse.status}`);
    }

    const testResult = await testResponse.json();
    console.log('✅ Connection test result:', testResult.ok ? 'SUCCESS' : 'FAILED');

    // Test 4: Trigger sync
    console.log('\n4️⃣ Triggering sync...');
    const syncData = {
      submissionId: 'test-submission-123',
      platformIds: [createdConfig.item.id],
      syncType: 'metadata_update',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    const syncResponse = await fetch(`${API_BASE}/api/platform-integrations/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify(syncData)
    });

    if (!syncResponse.ok) {
      throw new Error(`Failed to trigger sync: ${syncResponse.status}`);
    }

    const syncResult = await syncResponse.json();
    console.log('✅ Sync triggered:', syncResult.queued, 'jobs queued');

    // Test 5: Check logs
    console.log('\n5️⃣ Checking integration logs...');
    const logsResponse = await fetch(`${API_BASE}/api/platform-integrations/logs`, {
      headers: { 'x-enterprise-id': enterpriseId }
    });

    if (!logsResponse.ok) {
      throw new Error(`Failed to fetch logs: ${logsResponse.status}`);
    }

    const logs = await logsResponse.json();
    console.log('✅ Found', logs.items.length, 'log entries');

    // Test 6: Check health
    console.log('\n6️⃣ Checking health status...');
    const healthResponse = await fetch(`${API_BASE}/api/platform-integrations/health`, {
      headers: { 'x-enterprise-id': enterpriseId }
    });

    if (!healthResponse.ok) {
      throw new Error(`Failed to fetch health: ${healthResponse.status}`);
    }

    const health = await healthResponse.json();
    console.log('✅ Health check complete:', health.items.length, 'platforms monitored');

    console.log('\n🎉 All tests passed! Platform integrations are working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testPlatformIntegrations();