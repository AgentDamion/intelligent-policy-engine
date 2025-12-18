// Debug JWT token
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZW1va3BuemFzYmV5dGRiemVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4Mzg0MzYsImV4cCI6MjA3MDQxNDQzNn0.pOE3ZySoh2h6gBq89_elFx2WanZ5PZe4ikaXxmwLQqk';

// Decode JWT without verification (just to see structure)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return 'Invalid JWT format';
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    return 'Error decoding JWT: ' + error.message;
  }
}

console.log('🔍 JWT Debug:');
console.log('Token:', jwt);
console.log('Decoded payload:', decodeJWT(jwt));

// Check if token is expired
const decoded = decodeJWT(jwt);
if (typeof decoded === 'object') {
  const now = Math.floor(Date.now() / 1000);
  console.log('Current time:', now);
  console.log('Token expires:', decoded.exp);
  console.log('Is expired:', now > decoded.exp);
}


