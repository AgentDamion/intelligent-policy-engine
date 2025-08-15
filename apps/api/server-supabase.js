// server-supabase.js - Updated to use Supabase instead of Railway
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Import routes
const auth0Routes = require('./api/auth/auth0-routes');
const decisionsRoutes = require('./api/decisions');
const overridesRoutes = require('./api/overrides');
const agencyOnboardingRoutes = require('./api/agency-onboarding');
const policyDistributionRoutes = require('./api/policy-distribution');
const enhancedOrchestrationRoutes = require('./api/enhanced-orchestration');
const apiRoutes = require('./api/routes');
const { checkJwt, requirePermission } = require('./api/auth/auth0-middleware');

const app = express();

// Security middleware
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

const PORT = process.env.PORT || 3001; // Use different port to avoid conflicts

// Create HTTP server (handles both HTTP and WebSocket)
const server = http.createServer(app);

// CORS configuration for Supabase deployment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://aicomplyr.io', 
        'https://www.aicomplyr.io',
        'https://app.aicomplyr.io'
      ]
    : ['http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Add Supabase client to request object for routes to use
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Routes
app.use('/api/auth', auth0Routes);
app.use('/api/decisions', decisionsRoutes);
app.use('/api/overrides', overridesRoutes);
app.use('/api/agency-onboarding', agencyOnboardingRoutes);
app.use('/api/policy-distribution', policyDistributionRoutes);
app.use('/api/enhanced-orchestration', enhancedOrchestrationRoutes);
app.use('/api', apiRoutes);

// Serve static files from React build
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
    message: 'Connected to AICOMPLYR Live Governance Stream (Supabase)',
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
          ws.agentsSubscribed = true;
          ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            data: { stream: 'agent_events' },
            timestamp: new Date().toISOString()
          }));
          console.log('✅ Client subscribed to agent events');
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
      console.error('❌ Error parsing WebSocket message:', error);
    }
  });

  // Handle client disconnect
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

// Broadcast function for all connected clients
const broadcast = (message) => {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
};

// Broadcast to specific subscription types
const broadcastToSubscribers = (message, subscriptionType) => {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      if (subscriptionType === 'governance' && client.governanceSubscribed) {
        client.send(messageStr);
      } else if (subscriptionType === 'agents' && client.agentsSubscribed) {
        client.send(messageStr);
      }
    }
  });
};

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('organizations_enhanced')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      supabase_project: supabaseUrl.split('//')[1].split('.')[0]
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test Supabase connection endpoint
app.get('/api/test-supabase', async (req, res) => {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('organizations_enhanced')
      .select('*')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Supabase connection successful',
      tables_accessible: true,
      sample_data: data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simulate governance events for demo
const simulateGovernanceEvents = () => {
  setInterval(() => {
    const event = generateMockGovernanceEvents(1, {})[0];
    broadcastToSubscribers({
      type: 'governance_event',
      data: event,
      timestamp: new Date().toISOString()
    }, 'governance');
  }, 10000); // Every 10 seconds
};

// Generate mock governance events
function generateMockGovernanceEvents(count, filters) {
  const events = [];
  const eventTypes = ['policy_update', 'compliance_alert', 'risk_assessment', 'audit_finding'];
  const severities = ['low', 'medium', 'high', 'critical'];
  
  for (let i = 0; i < count; i++) {
    events.push({
      id: `event_${Date.now()}_${i}`,
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: `Mock governance event ${i + 1}`,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'demo_system',
        organization_id: 'demo_org_123'
      }
    });
  }
  
  return events;
}

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 AICOMPLYR Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server available at ws://localhost:${PORT}/ws`);
  console.log(`🌐 HTTP server available at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Supabase test: http://localhost:${PORT}/api/test-supabase`);
  
  // Start demo event simulation
  simulateGovernanceEvents();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
