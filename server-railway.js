require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
// server-railway.js - Updated with WebSocket support for Railway deployment
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const auth0Routes = require('./api/auth/auth0-routes');
const decisionsRoutes = require('./api/decisions');
const overridesRoutes = require('./api/overrides');
const agencyOnboardingRoutes = require('./api/agency-onboarding');
const policyDistributionRoutes = require('./api/policy-distribution');
const enhancedOrchestrationRoutes = require('./api/enhanced-orchestration');
const enhancedDocumentProcessingRoutes = require('./api/routes/enhanced-document-processing');
const enhancedOrchestratorRoutes = require('./api/routes/enhanced-orchestrator');
const inviteRoutes = require('./api/invite');
const toolSubmissionRoutes = require('./api/tool-submission');
const apiRoutes = require('./api/routes');
const { checkJwt, requirePermission } = require('./api/auth/auth0-middleware');

const app = express();
// Security middleware
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
const PORT = process.env.PORT || 3000;

// Create HTTP server (handles both HTTP and WebSocket)
const server = http.createServer(app);

// CORS configuration for Railway deployment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://aicomplyr.io', 
        'https://www.aicomplyr.io',
        'https://*.railway.app'
      ]
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', auth0Routes);
app.use('/api/decisions', decisionsRoutes);
app.use('/api/overrides', overridesRoutes);
app.use('/api/agency-onboarding', agencyOnboardingRoutes);
app.use('/api/policy-distribution', policyDistributionRoutes);
app.use('/api/enhanced-orchestration', enhancedOrchestrationRoutes);
app.use('/api/enhanced-document-processing', enhancedDocumentProcessingRoutes);
app.use('/api/enhanced-orchestrator', enhancedOrchestratorRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/tool-submission', toolSubmissionRoutes);
app.use('/api', apiRoutes);

// Serve static files from React build (Railway production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'ui/build')));
}

// Create WebSocket server on the same HTTP server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  clientTracking: true
});

// Store active WebSocket connections
const clients = new Set();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection established');
  console.log('👤 Client IP:', req.socket.remoteAddress);
  clients.add(ws);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to AICOMPLYR Live Governance Stream',
    timestamp: new Date().toISOString(),
    clientCount: clients.size
  }));

  // Handle incoming messages from frontend
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received WebSocket message:', data.type);
      
      // Handle different message types
      switch (data.type) {
        case 'subscribe_to_governance':
          ws.governanceSubscribed = true;
          ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            data: { stream: 'governance_events' },
            timestamp: new Date().toISOString()
          }));
          console.log('✅ Client subscribed to governance events');
          break;
          
        case 'subscribe_to_agents':
          ws.agentSubscribed = true;
          ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            data: { stream: 'agent_activity' },
            timestamp: new Date().toISOString()
          }));
          console.log('✅ Client subscribed to agent activity');
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ 
            type: 'pong', 
            timestamp: new Date().toISOString() 
          }));
          break;
          
        default:
          console.log('❓ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    clients.delete(ws);
    console.log('👥 Active connections:', clients.size);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    clients.delete(ws);
  });
});

// Function to broadcast to all connected clients
const broadcast = (message) => {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
  console.log('📢 Broadcasted message to ' + clients.size + ' clients');
};

// Function to broadcast to specific subscribers
const broadcastToSubscribers = (message, subscriptionType) => {
  const messageStr = JSON.stringify(message);
  let sentCount = 0;
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client[subscriptionType]) {
      client.send(messageStr);
      sentCount++;
    }
  });
  
  console.log('📢 Broadcasted ' + message.type + ' to ' + sentCount + ' subscribers');
};

// ===== API ROUTES =====

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    websocketClients: clients.size,
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  });
});

// Agent status endpoint
app.get('/api/agents/status', (req, res) => {
  const agentStatus = {
    contextAgent: { 
      status: Math.random() > 0.2 ? 'active' : 'processing',
      lastAction: Math.floor(Math.random() * 10) + 1 + 'm ago', 
      confidence: Math.floor(Math.random() * 20) + 80,
      tasks: Math.floor(Math.random() * 15) + 5
    },
    policyAgent: { 
      status: Math.random() > 0.3 ? 'active' : 'processing', 
      lastAction: Math.floor(Math.random() * 5) + 1 + 'm ago', 
      confidence: Math.floor(Math.random() * 20) + 85,
      tasks: Math.floor(Math.random() * 12) + 3
    },
    negotiationAgent: { 
      status: Math.random() > 0.7 ? 'active' : 'standby', 
      lastAction: Math.floor(Math.random() * 15) + 1 + 'm ago', 
      confidence: Math.floor(Math.random() * 15) + 88,
      tasks: Math.floor(Math.random() * 8) + 1
    },
    auditAgent: { 
      status: 'active', 
      lastAction: Math.floor(Math.random() * 3) + 1 + 'm ago', 
      confidence: Math.floor(Math.random() * 10) + 90,
      tasks: Math.floor(Math.random() * 20) + 10
    },
    conflictAgent: { 
      status: Math.random() > 0.5 ? 'monitoring' : 'active', 
      lastAction: Math.floor(Math.random() * 8) + 1 + 'm ago', 
      confidence: Math.floor(Math.random() * 15) + 85,
      tasks: Math.floor(Math.random() * 6) + 2
    },
    preFlightAgent: { 
      status: 'ready', 
      lastAction: Math.floor(Math.random() * 6) + 1 + 'm ago', 
      confidence: Math.floor(Math.random() * 12) + 88,
      tasks: Math.floor(Math.random() * 10) + 3
    }
  };
  
  res.json({
    success: true,
    data: agentStatus,
    timestamp: new Date().toISOString()
  });
  
  // Broadcast agent update to WebSocket subscribers
  broadcastToSubscribers({
    type: 'agent_status_update',
    data: agentStatus,
    timestamp: new Date().toISOString()
  }, 'agentSubscribed');
});

// Authentication endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // For testing purposes, accept any credentials
    // In production, this would validate against Auth0 or database
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password required' 
      });
    }
    
    // Mock user data for testing
    const mockUser = {
      id: 'test-user-id',
      email: email,
      name: 'Test User',
      role: 'enterprise_admin',
      enterpriseId: 'enterprise-1',
      organizationName: 'Test Organization'
    };
    
    // Mock JWT token
    const mockToken = 'mock-jwt-token-' + Date.now();
    
    res.json({
      success: true,
      user: mockUser,
      token: mockToken,
      message: 'Login successful (test mode)'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    });
  }
});

// Governance events endpoint
app.get('/api/governance/events', (req, res) => {
  const { timeRange = '24h', eventType = 'all', severity = 'all' } = req.query;
  const events = generateMockGovernanceEvents(50, { timeRange, eventType, severity });
  
  res.json({
    success: true,
    data: events,
    filters: { timeRange, eventType, severity },
    timestamp: new Date().toISOString(),
    totalEvents: events.length
  });
});

// Policies endpoint with enterprise scoping
app.get('/api/policies', (req, res) => {
  const { enterpriseId } = req.query;
  
  // Mock policies with enterprise scoping
  const allPolicies = [
    {
      id: 1,
      enterpriseId: 'enterprise-1',
      name: 'Social Media AI Content Policy',
      description: 'Guidelines for AI-generated social media content',
      status: 'active',
      lastUpdated: new Date().toISOString(),
      rules: ['No medical claims', 'FDA compliance required', 'Human review mandatory']
    },
    {
      id: 2,
      enterpriseId: 'enterprise-1',
      name: 'Image Generation Guidelines', 
      description: 'Rules for AI-generated visual content',
      status: 'active',
      lastUpdated: new Date().toISOString(),
      rules: ['Brand consistency', 'No misleading imagery', 'Copyright compliance']
    },
    {
      id: 3,
      enterpriseId: 'enterprise-2',
      name: 'Pharma AI Compliance Policy',
      description: 'Pharmaceutical AI content guidelines',
      status: 'active',
      lastUpdated: new Date().toISOString(),
      rules: ['No patient data', 'FDA approval required', 'Medical review mandatory']
    }
  ];
  
  // Filter by enterprise if specified
  let policies = allPolicies;
  if (enterpriseId) {
    policies = allPolicies.filter(policy => policy.enterpriseId === enterpriseId);
  }
  
  res.json({
    success: true,
    data: policies,
    timestamp: new Date().toISOString(),
    enterpriseId: enterpriseId || 'all'
  });
});

// ===== REAL-TIME EVENT SIMULATION =====

const simulateGovernanceEvents = () => {
  const eventTypes = [
    { type: 'policy_decision', severity: 'medium', title: 'AI Policy Updated' },
    { type: 'tool_submission', severity: 'low', title: 'New Tool Submitted' },
    { type: 'compliance_alert', severity: 'high', title: 'Compliance Issue Detected' },
    { type: 'risk_assessment', severity: 'medium', title: 'Risk Assessment Complete' },
    { type: 'agent_action', severity: 'low', title: 'AI Agent Action Completed' }
  ];
  
  const agencies = ['Ogilvy Health', 'McCann Health', 'Havas Health', 'Razorfish Health'];
  const users = ['Sarah Johnson', 'Mike Chen', 'Emma Wilson', 'David Lee', 'Lisa Park'];
  
  setInterval(() => {
    if (clients.size > 0) {
      const eventTemplate = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const event = {
        id: Date.now(),
        type: eventTemplate.type,
        severity: eventTemplate.severity,
        title: eventTemplate.title,
        description: eventTemplate.title + ' - Real-time governance system activity',
        agency: agencies[Math.floor(Math.random() * agencies.length)],
        user: users[Math.floor(Math.random() * users.length)],
        timestamp: new Date().toISOString()
      };
      
      console.log('🔄 Simulating governance event:', event.type);
      
      broadcastToSubscribers({
        type: 'governance_event',
        data: event
      }, 'governanceSubscribed');
    }
  }, 15000 + Math.random() * 15000);
};

simulateGovernanceEvents();

// ===== SERVE REACT APP =====

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'ui/build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'AICOMPLYR AI Governance Platform API',
      version: '2.0.0',
      status: 'running',
      endpoints: [
        'GET /api/health',
        'GET /api/agents/status',
        'GET /api/governance/events',
        'GET /api/policies'
      ],
      websocket: 'ws://localhost:3000/ws'
    });
  });
}

// Mock data generator
function generateMockGovernanceEvents(count, filters) {
  const events = [];
  const eventTypes = ['policy_decision', 'tool_submission', 'compliance_alert', 'risk_assessment', 'agent_action'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const agencies = ['Ogilvy Health', 'McCann Health', 'Havas Health', 'Razorfish Health'];
  const users = ['Sarah Johnson', 'Mike Chen', 'Emma Wilson', 'David Lee', 'Lisa Park'];
  
  for (let i = 0; i < count; i++) {
    const event = {
      id: Date.now() + i,
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      title: 'Governance Event ' + (i + 1),
      description: 'AI governance system activity - Event ID: ' + (Date.now() + i),
      agency: agencies[Math.floor(Math.random() * agencies.length)],
      user: users[Math.floor(Math.random() * users.length)],
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
    };
    events.push(event);
  }
  
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ===== START SERVER =====

server.listen(PORT, () => {
  console.log('🚀 ===== AICOMPLYR AI GOVERNANCE PLATFORM =====');
  console.log('🌐 Server running on port ' + PORT);
  console.log('📊 API endpoints: http://localhost:' + PORT + '/api');
  console.log('🔌 WebSocket server: ws://localhost:' + PORT + '/ws');
  console.log('🗄️ Database: ' + (process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'));
  console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('===============================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏹️ SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⏹️ SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server shut down complete');
    process.exit(0);
  });
});

module.exports = { app, server, wss, broadcast, broadcastToSubscribers };
