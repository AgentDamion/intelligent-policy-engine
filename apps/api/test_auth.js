const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing authentication endpoint...');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    console.log('✅ Auth endpoint working:', response.data);
    
  } catch (error) {
    console.log('❌ Auth endpoint failed:', error.response?.status, error.response?.data);
  }
}

testAuth();
