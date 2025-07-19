require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./api/routes');
const { authRouter } = require('./api/auth');
const policyTemplatesRouter = require('./api/policy-templates');
const dashboardRouter = require('./api/dashboard');
require('./core/feedback-loop');
const WebSocket = require('ws');
const EventBus = require('./core/event-bus');
const wss = new WebSocket.Server({ port: 3001 });
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

const app = express();

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

// CORS configuration - production-ready
const allowedOrigins = isProduction 
  ? [
      'https://aicomplyr.io',
      'https://www.aicomplyr.io',
      'https://app.aicomplyr.io'
    ]
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://lovable.dev',
      'https://*.ngrok.io'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In production, be more strict
      if (isProduction) {
        console.warn(`Blocked request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      } else {
        // In development, be more permissive
        callback(null, true);
      }
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.static('ui'));

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

// Serve main UI at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ui', 'index.html'));
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

// Auth and session
app.use('/auth', authRouter);
// Main API
app.use('/api', apiRoutes);
// Policy Templates
app.use('/api/policy-templates', policyTemplatesRouter);
// Test dashboard route - ADD THIS
app.get('/api/dashboard/test', (req, res) => {
    res.json({ message: 'Dashboard routing works!' });
  });
// Dashboard API
app.use('/api/dashboard', dashboardRouter);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const protocol = isProduction ? 'https' : 'http';
app.listen(PORT, HOST, () => {
    console.log(`aicomplyr.io backend running on ${protocol}://${HOST}:${PORT}`);
    if (isProduction) {
        console.log('🔒 HTTPS redirect enabled for production');
        console.log('🌐 CORS configured for production domains');
        console.log('🍪 Secure session cookies enabled');
    }
});