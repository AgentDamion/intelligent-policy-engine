console.log('Loading api/auth.js');

const express = require('express');
const session = require('express-session');
const db = require('../database/connection');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.use(session({
    secret: process.env.SESSION_SECRET || 'aicomplyr_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware: check organization access
const checkOrganizationAccess = async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await db.query(`
        SELECT u.*, o.name as org_name, o.id as organization_id
        FROM users u
        JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = $1
    `, [req.session.userId]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Unauthorized' });
    req.user = result.rows[0];
    next();
};

// Admin authentication middleware
const requireAdminAuth = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Authorization header required with Bearer token' 
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        
        // Check if user has admin role
        if (!decoded.role || decoded.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Admin privileges required' 
            });
        }

        // Add user info to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            organizationId: decoded.organizationId
        };

        console.log(`[AUTH] Admin access granted for user: ${req.user.email}`);
        next();
        
    } catch (error) {
        console.error('[AUTH] Admin authentication failed:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        } else {
            return res.status(500).json({ error: 'Authentication error' });
        }
    }
};

// Super-admin authentication middleware
const requireSuperAdminAuth = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Authorization header required with Bearer token' 
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        
        // Check if user has super-admin role
        if (!decoded.role || decoded.role !== 'super-admin') {
            return res.status(403).json({ 
                error: 'Super-admin privileges required' 
            });
        }

        // Add user info to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            organizationId: decoded.organizationId
        };

        console.log(`[AUTH] Super-admin access granted for user: ${req.user.email}`);
        next();
        
    } catch (error) {
        console.error('[AUTH] Super-admin authentication failed:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        } else {
            return res.status(500).json({ error: 'Authentication error' });
        }
    }
};

// Action-level authorization middleware
const requireActionAuth = (action) => {
    return async (req, res, next) => {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ 
                    error: 'Authorization header required with Bearer token' 
                });
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
            
            // Define action permissions
            const actionPermissions = {
                // Regular admin actions
                'restart_agent': ['admin', 'super-admin'],
                'clear_cache': ['admin', 'super-admin'],
                'backup_database': ['admin', 'super-admin'],
                'suspend_user': ['admin', 'super-admin'],
                'reset_password': ['admin', 'super-admin'],
                'grant_admin': ['admin', 'super-admin'],
                
                // Super-admin only actions
                'suspend_client': ['super-admin'],
                'force_sync': ['super-admin']
            };
            
            // Check if action exists and user has permission
            if (!actionPermissions[action]) {
                return res.status(400).json({ 
                    error: `Unknown action: ${action}` 
                });
            }
            
            if (!actionPermissions[action].includes(decoded.role)) {
                return res.status(403).json({ 
                    error: `Insufficient privileges for action: ${action}. Required roles: ${actionPermissions[action].join(', ')}` 
                });
            }

            // Add user info to request
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                organizationId: decoded.organizationId
            };

            console.log(`[AUTH] Action '${action}' authorized for user: ${req.user.email} (role: ${req.user.role})`);
            next();
            
        } catch (error) {
            console.error('[AUTH] Action authorization failed:', error.message);
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            } else {
                return res.status(500).json({ error: 'Authentication error' });
            }
        }
    };
};

console.log('requireActionAuth function defined');

// Login route (password check is a placeholder)
router.post('/login', async (req, res) => {
    const { email } = req.body;
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.userId = result.rows[0].id;
    res.json({ success: true, user: result.rows[0] });
});

module.exports = { 
    authRouter: router,
    requireAdminAuth,
    requireSuperAdminAuth,
    requireActionAuth,
    checkOrganizationAccess: (req, res, next) => {
        // Your existing organization access check
        next();
    }
}; 