const axios = require('axios');

async function testEndpoints() {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('🔍 Testing API Endpoints...\n');
  
  const endpoints = [
    { path: '/health', method: 'GET' },
    { path: '/policies', method: 'GET' },
    { path: '/agents/status', method: 'GET' },
    { path: '/governance/events', method: 'GET' },
    { path: '/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'testpassword' } }
  ];
  
  for (const endpoint of endpoints) {
    try {
      let response;
      if (endpoint.method === 'POST') {
        response = await axios.post(`${baseUrl}${endpoint.path}`, endpoint.data);
      } else {
        response = await axios.get(`${baseUrl}${endpoint.path}`);
      }
      
      console.log(`✅ ${endpoint.method} ${endpoint.path}: ${response.status}`);
      console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
      
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path}: ${error.response?.status || error.message}`);
    }
    console.log('');
  }
}

testEndpoints();
