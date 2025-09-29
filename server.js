require('dotenv').config();
const express = require('express');
const http = require('http');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const WebSocket = require('ws');
const apiRoutes = require('./api/routes');
const { authRouter } = require('./api/auth');
const modernAuthBridge = require('./api/auth/mock-auth-bridge');
const policyTemplatesRouter = require('./api/policy-templates');
const dashboardRouter = require('./api/dashboard');
const hierarchicalRoutes = require('./api/routes/hierarchical-routes');
const enhancedOrchestrationRouter = require('./api/enhanced-orchestration');
const inviteRoutes = require('./api/invite');
const toolSubmissionRoutes = require('./api/tool-submission');
require('./core/feedback-loop');
const EventBus = require('./core/event-bus');

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server (this will handle both HTTP and WebSocket)
const server = http.createServer(app);

// HTTPS redirect middleware for production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  app.use((req, res, next) => {
    // Check if the request is coming through a proxy (common in production)
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    if (!isSecure) {
      // Redirect HTTP to HTTPS
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      return res.redirect(301, httpsUrl);
    }
    next();
  });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  },
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production, 1000 in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks and WebSocket connections
    return req.path === '/api/health' || req.path === '/ws';
  }
});

// Apply rate limiting to all requests
app.use(limiter);

// API-specific rate limiting (stricter for API endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 50 : 500, // Stricter limits for API endpoints
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// CORS configuration for Railway deployment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://aicomplyr.io', 'https://www.aicomplyr.io'] // Add your actual domains
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build (when you deploy)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'ui', 'build')));
} else {
  // In development, serve React build if it exists, otherwise serve public
  const buildPath = path.join(__dirname, 'ui', 'build');
  const publicPath = path.join(__dirname, 'ui', 'public');
  
  if (require('fs').existsSync(buildPath)) {
    app.use(express.static(buildPath));
  } else {
    app.use(express.static(publicPath));
  }
}

// Serve test-websocket.html from root directory
app.get('/test-websocket.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-websocket.html'));
});

// Session middleware with production security
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProduction, // Only use secure cookies in production
    httpOnly: true, // Prevent XSS attacks
    sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000
  }
}));

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
  clients.add(ws);
  
  // Send welcome message with connection info
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
            data: { stream: 'governance_events' }
          }));
          break;
          
        case 'subscribe_to_agents':
          ws.agentSubscribed = true;
          ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            data: { stream: 'agent_activity' }
          }));
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    clients.delete(ws);
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
};

// Function to broadcast to specific subscribers
const broadcastToSubscribers = (message, subscriptionType) => {
  const messageStr = JSON.stringify(message);
  let subscriberCount = 0;
  
  console.log(`🔍 Broadcasting ${message.type} to ${subscriptionType} subscribers...`);
  console.log(`🔍 Total clients: ${clients.size}`);
  console.log(`🔍 Message being sent: ${messageStr}`);
  
  clients.forEach(client => {
    console.log(`🔍 Client state: ${client.readyState}, ${subscriptionType}: ${client[subscriptionType]}`);
    if (client.readyState === WebSocket.OPEN && client[subscriptionType]) {
      console.log(`🔍 Sending message to client: ${messageStr}`);
      client.send(messageStr);
      subscriberCount++;
    }
  });
  
  console.log(`📢 Broadcasted ${message.type} to ${subscriberCount} subscribers`);
};

// Preserve existing EventBus functionality
EventBus.on('submission-state-changed', (event) => {
  broadcast({
    type: 'state-update',
    data: event
  });
});

EventBus.on('context-analysis-complete', (event) => {
  broadcast({
    type: 'routing-decision',
    data: {
      submissionId: event.input.submissionId,
      analysis: event.result.analysis,
      workflow: event.result.workflow,
      confidence: event.result.confidence
    }
  });
});

// Enhanced Health Check Endpoint
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    websocketClients: clients.size,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
    },
    database: {
      connected: !!process.env.DATABASE_URL,
      url: process.env.DATABASE_URL ? 'configured' : 'not configured'
    },
    services: {
      websocket: 'active',
      api: 'active',
      auth: 'active'
    }
  };
  
  res.status(200).json(healthCheck);
});

// Detailed system health check (for monitoring)
app.get('/api/health/detailed', (req, res) => {
  const detailedHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    application: {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      websocketClients: clients.size,
      activeConnections: clients.size
    },
    database: {
      connected: !!process.env.DATABASE_URL,
      url: process.env.DATABASE_URL ? 'configured' : 'not configured'
    },
    security: {
      helmet: 'enabled',
      rateLimiting: 'enabled',
      cors: 'configured',
      https: isProduction ? 'enabled' : 'disabled'
    }
  };
  
  res.status(200).json(detailedHealth);
});

// Agent status endpoint
app.get('/api/agents/status', (req, res) => {
  console.log('🔍 API endpoint called: /api/agents/status');
  console.log('🔍 Total WebSocket clients:', clients.size);
  
  const agentStatus = {
    contextAgent: { 
      status: 'active', 
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
  
  console.log('🔍 Sending API response');
  res.json({
    success: true,
    data: agentStatus,
    timestamp: new Date().toISOString()
  });
  
  console.log('🔍 About to call broadcastToSubscribers');
  console.log('🔍 Checking client subscriptions...');
  clients.forEach((client, index) => {
    console.log(`🔍 Client ${index}: readyState=${client.readyState}, agentSubscribed=${client.agentSubscribed}`);
  });
  
  // Broadcast agent update to WebSocket subscribers
  broadcastToSubscribers({
    type: 'agent_status_update',
    data: agentStatus,
    timestamp: new Date().toISOString()
  }, 'agentSubscribed');
  console.log('🔍 Finished calling broadcastToSubscribers');
});

// Governance events endpoint
app.get('/api/governance/events', (req, res) => {
  const { timeRange = '24h', eventType = 'all', severity = 'all' } = req.query;
  
  // Generate mock events (replace with real database queries)
  const events = generateMockGovernanceEvents(50, { timeRange, eventType, severity });
  
  res.json({
    success: true,
    data: events,
    filters: { timeRange, eventType, severity },
    timestamp: new Date().toISOString()
  });
});

// Policies endpoint
app.get('/api/policies', (req, res) => {
  const policies = [
    {
      id: 1,
      name: 'Social Media AI Content Policy',
      description: 'Guidelines for AI-generated social media content',
      status: 'active',
      lastUpdated: new Date().toISOString(),
      rules: ['No medical claims', 'FDA compliance required', 'Human review mandatory']
    },
    {
      id: 2,
      name: 'Image Generation Guidelines', 
      description: 'Rules for AI-generated visual content',
      status: 'active',
      lastUpdated: new Date().toISOString(),
      rules: ['Brand consistency', 'No misleading imagery', 'Copyright compliance']
    }
  ];
  
  res.json({
    success: true,
    data: policies,
    timestamp: new Date().toISOString()
  });
});

// Basic home route
app.get('/api', (req, res) => {
    // Dynamically list all registered routes
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) { // routes registered directly on the app
            const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase());
            routes.push(`${methods.join(', ')} ${middleware.route.path}`);
        } else if (middleware.name === 'router' && middleware.handle.stack) { // router middleware 
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase());
                    routes.push(`${methods.join(', ')} ${handler.route.path}`);
                }
            });
        }
    });
    res.json({ 
        message: 'aicomplyr.io API Server is running!',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: routes
    });
});

// Apply API rate limiting to all API routes
app.use('/api', apiLimiter);

// Modern Authentication Hub Bridge (PRIORITY - must come first)
app.use('/api', modernAuthBridge);
// Auth and session
app.use('/auth', authRouter);
// Main API
app.use('/api', apiRoutes);
// Policy Templates
app.use('/api/policy-templates', policyTemplatesRouter);
// Invite token resolution
app.use('/api/invite', inviteRoutes);
// Partner tool submission
app.use('/api/tool-submission', toolSubmissionRoutes);
// Hierarchical Multi-Tenant API (disabled for testing)
// app.use('/api', hierarchicalRoutes);
// Enhanced Orchestration
app.use('/api/enhanced-orchestration', enhancedOrchestrationRouter);
// Test dashboard route
app.get('/api/dashboard/test', (req, res) => {
    res.json({ message: 'Dashboard routing works!' });
});
// Dashboard API
app.use('/api/dashboard', dashboardRouter);

// Simulate real-time governance events
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
        ...eventTemplate,
        description: `${eventTemplate.title} - automated governance system activity`,
        agency: agencies[Math.floor(Math.random() * agencies.length)],
        user: users[Math.floor(Math.random() * users.length)],
        timestamp: new Date().toISOString()
      };
      
      broadcastToSubscribers({
        type: 'governance_event',
        data: event
      }, 'governanceSubscribed');
    }
  }, 15000); // Send new event every 15 seconds
};

// Start governance event simulation
simulateGovernanceEvents();

// Mock data generator
function generateMockGovernanceEvents(count, filters) {
  const events = [];
  const eventTypes = ['policy_decision', 'tool_submission', 'compliance_alert', 'risk_assessment', 'agent_action'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const agencies = ['Ogilvy Health', 'McCann Health', 'Havas Health', 'Razorfish Health'];
  
  for (let i = 0; i < count; i++) {
    const event = {
      id: Date.now() + i,
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      title: `Governance Event ${i + 1}`,
      description: `Mock governance event for testing - ${Date.now()}`,
      agency: agencies[Math.floor(Math.random() * agencies.length)],
      user: `User ${i + 1}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
    };
    events.push(event);
  }
  
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Serve React app for all other routes (AFTER API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'ui', 'build', 'index.html'));
  });
} else {
  // In development, serve React app
  app.get('*', (req, res) => {
    const buildPath = path.join(__dirname, 'ui', 'build', 'index.html');
    const publicPath = path.join(__dirname, 'ui', 'public', 'index.html');
    
    if (require('fs').existsSync(buildPath)) {
      res.sendFile(buildPath);
    } else {
      res.sendFile(publicPath);
    }
  });
}

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Unhandled Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const errorResponse = {
    error: isProduction ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  };

  if (!isProduction) {
    errorResponse.stack = err.stack;
    errorResponse.details = {
      url: req.url,
      method: req.method,
      ip: req.ip
    };
  }

  res.status(err.status || 500).json(errorResponse);
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The requested API endpoint ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/health',
      'GET /api/health/detailed',
      'GET /api/agents/status',
      'GET /api/governance/events',
      'GET /api/policies'
    ]
  });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AICOMPLYR Server running on port ${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server available at ws://localhost:${PORT}/ws`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected to PostgreSQL' : 'No database configured'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Static files: ${process.env.NODE_ENV === 'production' ? 'Serving React build' : 'Not serving (development mode)'}`);
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