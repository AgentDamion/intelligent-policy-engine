import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    phase: 'foundation',
    week: 1,
    timestamp: new Date().toISOString(),
    message: 'Agent infrastructure preparing...'
  });
});

describe('GET /api/status', () => {
  it('should return status object', async () => {
    const server = createServer(app);
    const response = await request(server).get('/api/status');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('operational');
    expect(response.body.phase).toBe('foundation');
    expect(response.body.week).toBe(1);
    expect(response.body.message).toBeDefined();
  });
}); 