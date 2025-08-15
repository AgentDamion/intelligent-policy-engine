const axios = require('axios');

async function quickTest() {
  try {
    console.log('Testing context processing endpoint...');
    
    const response = await axios.post('http://localhost:3000/api/process/context', {
      userMessage: 'Test message for context processing',
      organizationId: 'test-org',
      userId: 'test-user'
    });
    
    console.log('✅ Context processing working:', response.data);
    
  } catch (error) {
    console.log('❌ Context processing failed:', error.response?.status, error.response?.data);
  }
}

quickTest();
