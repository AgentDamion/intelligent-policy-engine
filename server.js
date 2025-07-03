require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./api/routes');
const { authRouter } = require('./api/auth');

const app = express();

// CORS configuration for development (allow localhost origins, lovable.dev, and ngrok)
app.use(cors({
  origin: true,  // Allow ALL origins temporarily for testing
  credentials: true,
}));

app.use(express.json());
app.use(express.static('ui'));

// ADD SESSION MIDDLEWARE HERE (before your routes)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
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

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`aicomplyr.io backend running on http://${HOST}:${PORT}`);
});