require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const http = require('http');
const apiRoutes = require('./api/routes');
const { authRouter } = require('./api/auth');
const policyTemplatesRouter = require('./api/policy-templates');
const dashboardRouter = require('./api/dashboard');
require('./core/feedback-loop');
const WebSocket = require('ws');
const EventBus = require('./core/event-bus');

const app = express();

// Railway-specific configuration
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
const isProduction = process.env.NODE_ENV === 'production' || isRailway;
const PORT = process.env.PORT || 3000;

console.log('🚂 Railway Environment:', isRailway ? 'YES' : 'NO');
console.log(' Production Mode:', isProduction ? 'YES' : 'NO');
console.log(' Port:', PORT);

// CORS for Railway
const allowedOrigins = isProduction 
  ? [
      'https://aicomplyr.io',
      'https://www.aicomplyr.io',
      'https://app.aicomplyr.io',
      'https://*.railway.app',
      'https://*.up.railway.app'
    ]
  : [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:8080'
    ];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace('*', '')))) {
      callback(null, true);
    } else {
      console.warn(`Blocked request from: ${origin}`);
      callback(null, true); // Allow in development
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.static('ui'));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'railway-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Serve main UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

// Health check for Railway
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        environment: isRailway ? 'railway' : 'local',
        production: isProduction,
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// API routes
app.use('/auth', authRouter);
app.use('/api', apiRoutes);
app.use('/api/policy-templates', policyTemplatesRouter);
app.use('/api/dashboard', dashboardRouter);

// Create HTTP server
const server = http.createServer(app);

// Railway-compatible WebSocket setup
let wss;
try {
  // In Railway, WebSocket must be on same port as HTTP
  wss = new WebSocket.Server({ server });
  console.log('✅ WebSocket server attached to HTTP server');
  
  wss.on('connection', (ws) => {
    console.log('🔌 WebSocket client connected');
    
    ws.on('message', (message) => {
      console.log('📨 WebSocket message received:', message.toString());
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
    });
  });
  
  // Event handlers
  EventBus.on('submission-state-changed', (event) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'state-update',
          data: event
        }));
      }
    });
  });

  EventBus.on('context-analysis-complete', (event) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'routing-decision',
          data: {
            submissionId: event.input.submissionId,
            analysis: event.result.analysis,
            workflow: event.result.workflow,
            confidence: event.result.confidence
          }
        }));
      }
    });
  });
  
} catch (error) {
  console.error('❌ WebSocket setup failed:', error.message);
  wss = null;
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ aicomplyr.io running on port ${PORT}`);
    console.log(`🌐 HTTP: http://localhost:${PORT}`);
    console.log(` WebSocket: ${wss ? 'enabled' : 'disabled'}`);
    if (isRailway) {
        console.log(' Railway deployment detected');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Railway shutdown signal received');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Manual shutdown signal received');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});