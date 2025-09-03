// Basic intelligent system server - NOT a traditional policy engine
// Week 1: Foundation only - no agents or policy logic yet

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import winston from 'winston';

const PORT = process.env.PORT || 3001; // Different from existing policy engine

// Winston logger setup
const logCategories = {
  'system.startup': 'System initialization',
  'system.health': 'Health checks',
  'agent.context': 'Context intelligence (Week 5)',
  'agent.policy': 'Policy understanding (Week 6)',
  'agent.negotiation': 'Negotiation activities (Week 8)',
  'agent.learning': 'Learning pipeline (Week 9)',
  'infrastructure.orchestrator': 'Agent orchestration (Week 4)'
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Status endpoint
app.get('/api/status', (req, res) => {
  logger.info('[system.health] Status endpoint hit', { category: 'system.health' });
  res.json({
    status: 'operational',
    phase: 'foundation',
    week: 1,
    timestamp: new Date().toISOString(),
    message: 'Agent infrastructure preparing...'
  });
});

// Socket.io setup for future agent communication
io.on('connection', (socket) => {
  logger.info('Socket.io client connected', { category: 'system.health' });
  // No agent logic yet
});

httpServer.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`, { category: 'system.startup' });
  logger.info('Dashboard will be available at http://localhost:5173', { category: 'system.startup' });
  logger.info('WebSocket ready for agent communication', { category: 'system.startup' });
}); 
});