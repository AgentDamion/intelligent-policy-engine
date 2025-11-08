// Test script for MCP server
const https = require('https');

async function testMCPServer() {
  console.log('ðŸ§ª Testing MCP Server...');
  
  // Test 1: List tables
  console.log('\n1ï¸âƒ£ Testing list_tables...');
  await callMCPServer('list_tables', {});
  
  // Test 2: Get schema for a table
  console.log('\n2ï¸âƒ£ Testing get_table_schema...');
  await callMCPServer('get_table_schema', { table_name: 'agent_activities' });
  
  // Test 3: Run SQL query
  console.log('\n3ï¸âƒ£ Testing run_sql...');
  await callMCPServer('run_sql', { 
    query: "SELECT COUNT(*) as total_agents FROM agent_activities LIMIT 5" 
  });
}

function callMCPServer(action, params) {
  return new Promise((resolve, reject) => {
    const payload = { action, ...params };
    
    const options = {
      hostname: 'dqemokpnzasbeytdbzei.supabase.co',
      path: '/functions/v1/supabase-mcp-server',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZW1va3BuemFzYmV5dGRiemVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4Mzg0MzYsImV4cCI6MjA3MDQxNDQzNn0.pOE3ZySoh2h6gBq89_elFx2WanZ5PZe4ikaXxmwLQqk'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('âœ… Result:', JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.log('âŒ Error:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('âŒ Request Error:', error.message);
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

testMCPServer().catch(console.error);
