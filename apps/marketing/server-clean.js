// Clean server.js - JSON-first API with mock/real switching
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();

// ---------- Core middleware ----------
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://aicomplyr.io', 'https://www.aicomplyr.io']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Force JSON default for API responses
app.use('/api', (req, res, next) => {
  res.type('application/json');
  next();
});

// ---------- Health (first & fast) ----------
app.get('/api/health', (req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  mode: process.env.MOCK_MODE === '1' ? 'mock' : 'real',
  environment: process.env.NODE_ENV || 'development'
}));

// ---------- Mock vs Real router ----------
const MOCK_MODE = process.env.MOCK_MODE === '1';
console.log(`🔄 Starting server in ${MOCK_MODE ? 'MOCK' : 'REAL'} mode`);

const apiRouter = MOCK_MODE
  ? require('./api/mock.routes')   // JSON mocks (today)
  : require('./api/routes');       // DB-backed (later)

app.use('/api', apiRouter);

// ---------- Static app AFTER API ----------
const staticPath = path.join(__dirname, 'ui', 'build');
app.use(express.static(staticPath));

// ---------- API 404 -> JSON, not HTML ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found' }));

// ---------- SPA catch‑all LAST (non-API only) ----------
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('UI not built. Run: cd ui && npm run build');
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 AICOMPLYR Server running on port ${port}`);
  console.log(`📊 Mode: ${MOCK_MODE ? 'MOCK' : 'REAL'} API`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Static files: ${staticPath}`);
  if (MOCK_MODE) {
    console.log(`🧪 Mock API active - no database required`);
    console.log(`🔗 Test endpoint: http://localhost:${port}/api/debug/status`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏹️ SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⏹️ SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
