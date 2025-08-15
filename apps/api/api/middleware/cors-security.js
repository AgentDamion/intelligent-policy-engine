// api/middleware/cors-security.js
// CORS Security Middleware for B2B Multi-Tenant Security

const cors = require('cors');

// Parse allowed origins from environment variable
const getAllowedOrigins = () => {
  const origins = process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000';
  return origins.split(',').map(origin => origin.trim());
};

// Parse allowed methods from environment variable
const getAllowedMethods = () => {
  const methods = process.env.CORS_ALLOWED_METHODS || 'GET,POST,PUT,DELETE,OPTIONS';
  return methods.split(',').map(method => method.trim());
};

// Parse allowed headers from environment variable
const getAllowedHeaders = () => {
  const headers = process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization,X-Requested-With';
  return headers.split(',').map(header => header.trim());
};

// CORS configuration for B2B security
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      console.log('[CORS] Request with no origin allowed (mobile app, Postman, etc.)');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log(`[CORS] ✅ Origin allowed: ${origin}`);
      return callback(null, true);
    }
    
    // Block unauthorized origin
    console.log(`[CORS] 🚫 Origin blocked: ${origin}`);
    console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  
  methods: getAllowedMethods(),
  allowedHeaders: getAllowedHeaders(),
  credentials: true, // Allow cookies and authorization headers
  maxAge: 86400, // Cache preflight requests for 24 hours
  
  // Custom error handler for CORS violations
  optionsSuccessStatus: 200,
  
  // Log CORS violations for security monitoring
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

// Additional CORS security middleware for logging
const corsSecurityMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin) {
    console.log(`[CORS_SECURITY] Request from origin: ${origin}`);
  }
  
  // Apply CORS middleware
  corsMiddleware(req, res, next);
};

// Function to add new allowed domain for enterprise customers
const addAllowedDomain = (domain) => {
  const currentOrigins = getAllowedOrigins();
  
  if (!currentOrigins.includes(domain)) {
    const newOrigins = [...currentOrigins, domain];
    const newOriginsString = newOrigins.join(',');
    
    console.log(`[CORS] Adding new allowed domain: ${domain}`);
    console.log(`[CORS] New origins list: ${newOriginsString}`);
    
    // Note: In production, you'd want to update the environment variable
    // This is just for demonstration
    return newOriginsString;
  }
  
  console.log(`[CORS] Domain ${domain} already in allowed list`);
  return currentOrigins.join(',');
};

// Function to remove allowed domain
const removeAllowedDomain = (domain) => {
  const currentOrigins = getAllowedOrigins();
  const filteredOrigins = currentOrigins.filter(origin => origin !== domain);
  
  console.log(`[CORS] Removing domain: ${domain}`);
  console.log(`[CORS] Updated origins list: ${filteredOrigins.join(',')}`);
  
  return filteredOrigins.join(',');
};

// Function to list all allowed domains
const listAllowedDomains = () => {
  const origins = getAllowedOrigins();
  console.log(`[CORS] Currently allowed domains: ${origins.join(', ')}`);
  return origins;
};

module.exports = {
  corsMiddleware,
  corsSecurityMiddleware,
  addAllowedDomain,
  removeAllowedDomain,
  listAllowedDomains,
  getAllowedOrigins
}; 