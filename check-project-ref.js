// Check if project reference matches
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZW1va3BuemFzYmV5dGRiemVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4Mzg0MzYsImV4cCI6MjA3MDQxNDQzNn0.pOE3ZySoh2h6gBq89_elFx2WanZ5PZe4ikaXxmwLQqk';

// Decode JWT payload
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

const decoded = decodeJWT(jwt);
console.log('🔍 JWT Project Reference:', decoded?.ref);
console.log('🌐 Using Project ID:', 'jwfpjufheibxadrbghfv');
console.log('✅ Match:', decoded?.ref === 'jwfpjufheibxadrbghfv');


