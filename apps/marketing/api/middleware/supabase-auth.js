// server/middleware/supabase-auth.js
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for server-side auth verification
);

/**
 * Main auth middleware - extracts and validates Supabase JWT
 */
const authenticateRequest = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      req.user = null;
      return next(); // Continue without auth (some routes may be public)
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      req.user = null;
      return next();
    }

    // Fetch full user context including enterprise associations
    const { data: context, error: contextError } = await supabase
      .rpc('get_user_context', { user_id: user.id });

    if (contextError) {
      console.error('Error fetching user context:', contextError);
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      ...context,
      // Primary enterprise from metadata (for backwards compatibility)
      enterprise_id: user.app_metadata?.enterprise_id,
      enterprise_role: user.app_metadata?.enterprise_role,
      // All enterprises they belong to
      enterprises: context?.enterprises || [],
      workspaces: context?.workspaces || []
    };

    // Set primary enterprise for tenant isolation
    req.enterprise_id = user.app_metadata?.enterprise_id;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Helper to extract token from various sources
 */
function extractToken(req) {
  // Check Authorization header first
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.substring(7);
  }
  
  // Check cookie (for SSR)
  if (req.cookies?.['sb-access-token']) {
    return req.cookies['sb-access-token'];
  }
  
  // Check query param (for WebSocket)
  if (req.query?.token) {
    return req.query.token;
  }
  
  return null;
}

/**
 * Middleware to require authentication
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * Middleware to require specific enterprise role
 */
const requireEnterpriseRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const allowedRoles = Array.isArray(role) ? role : [role];
    const userRole = req.user.enterprise_role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

/**
 * Middleware for enterprise tenant isolation
 */
const enforceEnterpriseTenant = (req, res, next) => {
  if (!req.user?.enterprise_id) {
    return res.status(403).json({ error: 'No enterprise context' });
  }
  
  // Ensure all queries are scoped to user's enterprise
  req.tenantFilter = { enterprise_id: req.user.enterprise_id };
  next();
};

module.exports = {
  supabase,
  authenticateRequest,
  requireAuth,
  requireEnterpriseRole,
  enforceEnterpriseTenant,
  extractToken
};
