// api/auth/auth0-middleware.js
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const { config } = require('../../auth0-config.cjs');

// JWT validation middleware
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: config.jwksUri
  }),
  audience: config.audience,
  issuer: config.issuer,
  algorithms: ['RS256']
});

// Role-based authorization middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRoles = req.user[`${config.audience}/roles`] || [];
    if (!userRoles.includes(role)) {
      return res.status(403).json({ error: `Role '${role}' required` });
    }
    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userPermissions = req.user[`${config.audience}/permissions`] || [];
    const userRoles = req.user[`${config.audience}/roles`] || [];
    // Check direct permission
    if (userPermissions.includes(permission)) {
      return next();
    }
    // Check role-based permission
    const allowedRoles = config.permissions[permission] || [];
    const hasRolePermission = userRoles.some(role => allowedRoles.includes(role));
    if (!hasRolePermission) {
      return res.status(403).json({ error: `Permission '${permission}' required` });
    }
    next();
  };
};

// Organization scoping middleware
const requireOrganizationAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const userOrgId = req.user[`${config.audience}/org_id`];
  if (!userOrgId) {
    return res.status(403).json({ error: 'Organization access required' });
  }
  req.user.organizationId = userOrgId;
  next();
};

module.exports = {
  checkJwt,
  requireRole,
  requirePermission,
  requireOrganizationAccess
};