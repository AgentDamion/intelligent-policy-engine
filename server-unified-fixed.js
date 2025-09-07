import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import http from 'http';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https:", process.env.SUPABASE_URL],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api', limiter);

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Move these routes BEFORE the authenticateRequest middleware
app.use(express.json());

// PUBLIC ROUTES (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    auth: 'supabase',
    message: 'Server is working!'
  });
});

// Add your invite routes here (before auth middleware)
app.post('/api/invite', async (req, res) => {
  try {
    const { email, workspaceId, role } = req.body;
    
    // Create invite in Supabase
    const { data, error } = await supabase
      .from('invitation_keys')
      .insert({
        email,
        workspace_id: workspaceId,
        role,
        token: generateToken(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })
      .select()
      .single();
      
    if (error) return res.status(400).json({ error });
    
    res.json({ 
      inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${data.token}` 
    });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

app.get('/api/invite/:token', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invitation_keys')
      .select('*, workspace:workspaces(*)')
      .eq('token', req.params.token)
      .single();
      
    if (error || !data) {
      return res.status(404).json({ error: 'Invalid invite' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Get invite error:', error);
    res.status(500).json({ error: 'Failed to get invitation' });
  }
});

// Authentication middleware
async function authenticateRequest(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// THEN add your auth middleware
app.use(authenticateRequest);

// PROTECTED ROUTES (auth required)
app.get('/api/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

// Agent Activity API Endpoints
// POST /api/agent/activity - Primary ingestion endpoint
app.post('/api/agent/activity', async (req, res) => {
  try {
    const { agent, action, status, details, workspace_id, enterprise_id } = req.body;
    
    // Validate required fields
    if (!agent || !action) {
      return res.status(400).json({ 
        error: 'Missing required fields: agent and action are required' 
      });
    }
    
    const { data, error } = await supabase
      .from('agent_activities')
      .insert({
        agent,
        action,
        status: status || 'success',
        details: details || {},
        workspace_id,
        enterprise_id,
        user_id: req.user.id
      })
      .select()
      .single();
      
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save agent activity' });
    }
    
    // Broadcast to WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'agent_activity',
          data: data
        }));
      }
    });
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Agent activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/agent/activity - Feed endpoint for dashboards
app.get('/api/agent/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const { data, error } = await supabase
      .from('agent_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch agent activities' });
    }
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('agent_activities')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Count error:', countError);
    }
    
    res.json({ 
      activities: data || [], 
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get agent activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Conflict Analysis API
app.post('/api/analyze-conflicts', async (req, res) => {
  try {
    const { policies } = req.body;
    
    // Validate input
    if (!policies || !Array.isArray(policies) || policies.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 policies required for conflict analysis',
        received: policies ? policies.length : 0
      });
    }

    // For now, return a mock conflict report
    // TODO: Integrate with your ConflictDetectionAgent
    const conflictReport = {
      conflicts: [
        {
          id: 'conflict-1',
          type: 'policy_overlap',
          severity: 'medium',
          description: 'Policies have overlapping requirements that may cause conflicts',
          affected_policies: policies.slice(0, 2).map(p => p.id || p.name),
          recommendation: 'Review and consolidate overlapping policy sections'
        }
      ],
      overallSeverity: 'medium',
      summary: `Analyzed ${policies.length} policies and found 1 potential conflict`,
      timestamp: new Date().toISOString()
    };
    
    // Log the activity
    await supabase
      .from('agent_activities')
      .insert({
        agent: 'Conflict Detection Agent',
        action: 'Analyzed Policies',
        status: 'success',
        details: {
          policiesAnalyzed: policies.length,
          conflictsFound: conflictReport.conflicts.length,
          severity: conflictReport.overallSeverity
        },
        user_id: req.user.id
      });
    
    res.json({
      success: true,
      data: conflictReport,
      explanation: `Analyzed ${policies.length} policies for conflicts`
    });
    
  } catch (error) {
    console.error('Conflict analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze policy conflicts',
      details: error.message 
    });
  }
});

// System Status API
app.get('/api/status', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('agent_activities')
      .select('count')
      .limit(1);
    
    const databaseStatus = error ? 'disconnected' : 'connected';
    
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      version: '1.0.0-beta'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Utility function for generating tokens
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// WebSocket with auth - Fixed import
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (request, socket, head) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    
    request.user = user;
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } catch (error) {
    socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  ws.userId = req.user.id;
  console.log(`WebSocket connected: ${ws.userId}`);
  
  // Send connection confirmation
  ws.send(JSON.stringify({ 
    type: 'connected', 
    userId: ws.userId,
    timestamp: new Date().toISOString()
  }));
  
  // Subscribe to real-time updates for this user
  const subscription = supabase
    .channel(`agent_activities_${ws.userId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'agent_activities',
        filter: `user_id=eq.${ws.userId}`
      },
      (payload) => {
        console.log('Real-time activity update:', payload.new);
        ws.send(JSON.stringify({
          type: 'agent_activity',
          data: payload.new,
          timestamp: new Date().toISOString()
        }));
      }
    )
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_agent_decisions',
        filter: `user_id=eq.${ws.userId}`
      },
      (payload) => {
        console.log('Real-time decision update:', payload.new);
        ws.send(JSON.stringify({
          type: 'agent_decision',
          data: payload.new,
          timestamp: new Date().toISOString()
        }));
      }
    )
    .subscribe();
    
  // Store subscription for cleanup
  ws.subscription = subscription;
  
  // Handle WebSocket close
  ws.on('close', () => {
    console.log(`WebSocket disconnected: ${ws.userId}`);
    if (ws.subscription) {
      ws.subscription.unsubscribe();
    }
  });
  
  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for user ${ws.userId}:`, error);
    if (ws.subscription) {
      ws.subscription.unsubscribe();
    }
  });
  
  // Send periodic heartbeat
  const heartbeat = setInterval(() => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      }));
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // 30 seconds
  
  ws.heartbeat = heartbeat;
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Unified server running on port ${PORT}`);
  console.log(`🔐 Auth: Supabase (using your working functions!)`);
  console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   POST /api/agent/activity - Agent activity ingestion`);
  console.log(`   GET  /api/agent/activity - Agent activity feed`);
  console.log(`   POST /api/analyze-conflicts - Conflict analysis`);
  console.log(`   GET  /api/status - System health check`);
  console.log(`   GET  /api/me - User profile`);
});

export { app, server, wss };
