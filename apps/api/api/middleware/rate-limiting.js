// api/middleware/rate-limiting.js
// Simple API Rate Limiting for B2B Security

const rateLimit = require('express-rate-limit');

// API Rate Limiting Middleware
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests, including successful ones
  
  // B2B-specific: Different limits for different user types
  keyGenerator: (req) => {
    const userRole = req.user?.role || 'anonymous';
    const orgId = req.user?.organizationId || 'no-org';
    return `${req.ip}-${userRole}-${orgId}`;
  },
  
  // Custom handler for B2B context
  handler: (req, res) => {
    const userRole = req.user?.role || 'anonymous';
    const limit = parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100;
    
    console.log(`[RATE_LIMIT] Blocked request from ${req.ip} (role: ${userRole}, org: ${req.user?.organizationId || 'none'})`);
    
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000),
      userRole: userRole,
      limit: limit,
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000
    });
  }
});

// AI-specific rate limiting (more restrictive)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for AI endpoints
  message: {
    error: 'AI service rate limit exceeded. Please try again later.',
    retryAfter: 60
  },
  keyGenerator: (req) => `${req.ip}-${req.user?.organizationId || 'anonymous'}-ai`,
  handler: (req, res) => {
    console.log(`[AI_RATE_LIMIT] Blocked AI request from ${req.ip}`);
    res.status(429).json({
      error: 'AI service rate limit exceeded',
      message: 'Too many AI requests, please try again later.',
      retryAfter: 60
    });
  }
});

// Health check endpoint (no rate limiting)
const healthCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Very high limit for health checks
  skipSuccessfulRequests: true
});

module.exports = {
  apiLimiter,
  aiLimiter,
  healthCheckLimiter
}; 