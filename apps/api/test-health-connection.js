const axios = require('axios');

const url = 'http://localhost:3000/api/health';

console.log(`[HTTP] GET ${url}`);

axios.get(url, { timeout: 5000 })
  .then(res => {
    console.log('Status:', res.status);
    console.log('Headers:', res.headers);
    console.log('Body:', res.data);
    process.exit(0);
  })
  .catch(err => {
    console.error('[AXIOS ERROR]');
    if (err.message) console.error('Message:', err.message);
    if (err.code) console.error('Code:', err.code);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Headers:', err.response.headers);
      console.error('Body:', err.response.data);
    } else {
      console.error('No response received.');
    }
    process.exit(1);
  }); 