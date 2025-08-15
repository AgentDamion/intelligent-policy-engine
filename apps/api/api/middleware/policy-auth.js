const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'aicomplyr',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user data to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user data from database
    const userResult = await pool.query(`
      SELECT u.*, o.name as organization_name, o.industry, o.compliance_tier
      FROM users_enhanced u
      JOIN organizations_enhanced o ON u.organization_id = o.id
      WHERE u.id = $1 AND u.is_active = true
    `, [decoded.user_id]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
    
    const user = userResult.rows[0];
    
    // Attach user data to request
    req.user = {
      user_id: user.id,
      organization_id: user.organization_id,
      organization_name: user.organization_name,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      permissions: user.permissions || {},
      industry: user.industry,
      compliance_tier: user.compliance_tier
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required_roles: roles,
        user_role: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Permission-based Authorization Middleware
 * Checks if user has specific permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userPermissions = req.user.permissions || {};
    
    if (!userPermissions[permission]) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required_permission: permission
      });
    }
    
    next();
  };
};

/**
 * Organization Access Control Middleware
 * Ensures user can only access their organization's data
 */
const requireOrganizationAccess = (entityType) => {
  return async (req, res, next) => {
    try {
      const { organization_id } = req.user;
      const entityId = req.params.id;
      
      if (!entityId) {
        return res.status(400).json({ 
          error: 'Entity ID required',
          code: 'MISSING_ENTITY_ID'
        });
      }
      
      // Check if entity belongs to user's organization
      const result = await pool.query(`
        SELECT id FROM ${entityType}_enhanced 
        WHERE id = $1 AND organization_id = $2
      `, [entityId, organization_id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: `${entityType} not found or access denied`,
          code: 'ENTITY_NOT_FOUND'
        });
      }
      
      next();
    } catch (error) {
      console.error('Organization access check error:', error);
      res.status(500).json({ 
        error: 'Access control check failed',
        code: 'ACCESS_CHECK_ERROR'
      });
    }
  };
};

/**
 * Audit Logging Middleware
 * Logs all API actions for compliance tracking
 */
const auditLog = (action, entityType = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      setTimeout(async () => {
        try {
          const { organization_id, user_id } = req.user;
          const entityId = req.params.id || null;
          
          let details = {};
          
          // Add request-specific details
          if (req.method === 'POST' || req.method === 'PUT') {
            details = {
              method: req.method,
              endpoint: req.originalUrl,
              user_agent: req.get('User-Agent'),
              ip_address: req.ip
            };
            
            // Add relevant request body data (excluding sensitive fields)
            if (req.body) {
              const sanitizedBody = { ...req.body };
              delete sanitizedBody.password;
              delete sanitizedBody.token;
              details.request_data = sanitizedBody;
            }
          }
          
          await pool.query(`
            INSERT INTO audit_logs_enhanced (
              organization_id, user_id, action, entity_type, entity_id, 
              details, ip_address, user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            organization_id, user_id, action, entityType, entityId,
            JSON.stringify(details), req.ip, req.get('User-Agent')
          ]);
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      }, 0);
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Rate Limiting Middleware
 * Prevents API abuse
 */
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.user ? req.user.user_id : req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    if (requests.has(key)) {
      requests.set(key, requests.get(key).filter(time => time > windowStart));
    } else {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: Math.ceil(windowMs / 1000)
      });
    }
    
    userRequests.push(now);
    next();
  };
};

/**
 * Input Validation Middleware
 * Validates request body and query parameters
 */
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

/**
 * Error Handling Middleware
 * Standardizes error responses
 */
const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);
  
  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE'
    });
  }
  
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Referenced resource not found',
      code: 'FOREIGN_KEY_VIOLATION'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  // Default error
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing
 */
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * Request Logging Middleware
 * Logs all incoming requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireOrganizationAccess,
  auditLog,
  rateLimit,
  validateInput,
  errorHandler,
  corsMiddleware,
  requestLogger
};
