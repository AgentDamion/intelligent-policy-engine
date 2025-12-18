// tests/auth-migration.test.js
const request = require('supertest');
const { app } = require('../server-unified');
const { supabase } = require('../api/middleware/supabase-auth');

describe('Supabase Auth Migration', () => {
  let testUser;
  let authToken;
  
  beforeAll(async () => {
    // Create test user
    const { data, error } = await supabase.auth.signUp({
      email: 'test@aicomplyr.io',
      password: 'TestPassword123!',
      options: {
        data: {
          enterprise_id: 'test-enterprise',
          enterprise_role: 'admin'
        }
      }
    });
    
    testUser = data.user;
    authToken = data.session.access_token;
  });
  
  afterAll(async () => {
    // Cleanup
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });
  
  test('Health check works without auth', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
  
  test('Protected route requires auth', async () => {
    const res = await request(app).get('/api/policies');
    expect(res.status).toBe(401);
  });
  
  test('Protected route works with valid token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@aicomplyr.io');
    expect(res.body.user.enterprise_id).toBe('test-enterprise');
  });
  
  test('WebSocket rejects without auth', (done) => {
    const ws = new WebSocket('ws://localhost:3001/ws');
    
    ws.on('error', () => {
      done(); // Expected to fail
    });
    
    ws.on('open', () => {
      done(new Error('Should not connect without auth'));
    });
  });
  
  test('WebSocket accepts with valid token', (done) => {
    const ws = new WebSocket(`ws://localhost:3001/ws?token=${authToken}`);
    
    ws.on('open', () => {
      done(); // Success
    });
    
    ws.on('error', (err) => {
      done(err);
    });
  });
});
