// auth0-config.js
require('dotenv').config();

const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || 'your-domain.auth0.com',
  clientId: process.env.AUTH0_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || 'your-client-secret',
  audience: process.env.AUTH0_AUDIENCE || 'https://api.aicomplyr.io',
  issuer: process.env.AUTH0_ISSUER || `https://${process.env.AUTH0_DOMAIN}/`,
  callbackUrl: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback',
  logoutUrl: process.env.AUTH0_LOGOUT_URL || 'http://localhost:3000',
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  sessionSecret: process.env.SESSION_SECRET || 'aicomplyr-auth0-secret',
  roles: {
    admin: 'admin',
    superAdmin: 'super-admin',
    user: 'user',
    enterprise: 'enterprise',
    agency: 'agency'
  },
  permissions: {
    'audit:read': ['admin', 'super-admin', 'user'],
    'audit:write': ['admin', 'super-admin'],
    'audit:export': ['admin', 'super-admin'],
    'policy:read': ['admin', 'super-admin', 'user'],
    'policy:write': ['admin', 'super-admin'],
    'policy:delete': ['super-admin'],
    'user:read': ['admin', 'super-admin'],
    'user:write': ['admin', 'super-admin'],
    'user:delete': ['super-admin'],
    'org:read': ['admin', 'super-admin'],
    'org:write': ['admin', 'super-admin'],
    'org:delete': ['super-admin'],
    'system:admin': ['super-admin'],
    'system:monitor': ['admin', 'super-admin']
  }
};

module.exports = { config: auth0Config };