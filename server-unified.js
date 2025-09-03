import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import WebSocket from 'ws';
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

// THEN add your auth middleware
app.use(authenticateRequest);

// PROTECTED ROUTES (auth required)
app.get('/api/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

// Utility function for generating tokens
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// WebSocket with auth
const wss = new WebSocket.Server({ noServer: true });

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
  
  ws.send(JSON.stringify({ type: 'connected', userId: ws.userId }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Unified server running on port ${PORT}`);
  console.log(`🔐 Auth: Supabase (using your working functions!)`);
  console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
});

export { app, server, wss };
export { app, server, wss };