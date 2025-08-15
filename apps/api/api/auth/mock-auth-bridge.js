// Mock Authentication Hub Bridge for Testing
// This provides working endpoints without requiring database setup

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Mock data store (replace with database later)
const mockUsers = new Map();
const mockOrganizations = new Map();
const mockAccessRequests = new Map();

// Mock JWT secret
const JWT_SECRET = 'test-jwt-secret-12345';

// ===== AUTHENTICATION ENDPOINTS =====

// Sign in endpoint (mock authentication)
router.post('/auth/signin', async (req, res) => {
    try {
        const { email, password, useMagicLink, remember } = req.body;
        
        console.log(`[MOCK AUTH] Sign in attempt for: ${email}`);
        
        if (useMagicLink) {
            return res.status(501).json({
                error: 'Magic link authentication not yet implemented'
            });
        }
        
        // Mock authentication - accept any email with password "test123"
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }
        
        if (password !== 'test123') {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }
        
        // Create mock user if doesn't exist
        if (!mockUsers.has(email)) {
            mockUsers.set(email, {
                id: `user_${Date.now()}`,
                email: email,
                name: email.split('@')[0],
                createdAt: new Date().toISOString()
            });
        }
        
        const user = mockUsers.get(email);
        
        // Generate JWT token
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            contextId: 'mock_context_123'
        }, JWT_SECRET, { expiresIn: '24h' });
        
        // Mock session format
        const session = {
            userId: user.id,
            email: user.email,
            orgId: 'mock_org_123',
            roles: ['admin'],
            token: token,
            mfaRequired: false
        };
        
        // Set session cookie if remember is true
        if (remember) {
            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: false, // Set to true in production
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });
        }
        
        console.log(`[MOCK AUTH] Sign in successful for: ${email}`);
        res.json(session);
        
    } catch (error) {
        console.error('[MOCK AUTH] Sign in failed:', error.message);
        res.status(500).json({
            error: 'Authentication failed'
        });
    }
});

// Check session endpoint
router.get('/auth/session', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies.auth_token;
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Return mock session
        const session = {
            userId: decoded.userId,
            email: decoded.email,
            orgId: 'mock_org_123',
            roles: ['admin'],
            token: token,
            mfaRequired: false
        };
        
        res.json(session);
        
    } catch (error) {
        console.error('[MOCK AUTH] Session check failed:', error.message);
        res.status(401).json({ error: 'Invalid session' });
    }
});

// Logout endpoint
router.post('/auth/logout', (req, res) => {
    try {
        res.clearCookie('auth_token');
        console.log('[MOCK AUTH] User logged out');
        res.json({ success: true });
    } catch (error) {
        console.error('[MOCK AUTH] Logout failed:', error.message);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// ===== ORGANIZATION ENDPOINTS =====

// Create organization endpoint
router.post('/org/create', async (req, res) => {
    try {
        const { 
            orgName, 
            region, 
            emailDomain, 
            enableSSO, 
            ssoProvider, 
            orgType, 
            initialRoles 
        } = req.body;
        
        console.log(`[MOCK ORG] Creating organization: ${orgName}`);
        
        // Generate mock organization
        const orgId = `org_${Date.now()}`;
        const organization = {
            id: orgId,
            name: orgName,
            type: orgType,
            region: region,
            emailDomain: emailDomain,
            ssoEnabled: enableSSO,
            ssoProvider: ssoProvider,
            initialRoles: initialRoles,
            createdAt: new Date().toISOString()
        };
        
        mockOrganizations.set(orgId, organization);
        
        console.log(`[MOCK ORG] Organization created: ${orgId}`);
        res.json({
            orgId: orgId,
            next: 'mfa' // Always suggest MFA setup for new orgs
        });
        
    } catch (error) {
        console.error('[MOCK ORG] Organization creation failed:', error.message);
        res.status(400).json({
            error: 'Failed to create organization'
        });
    }
});

// Request access endpoint  
router.post('/org/request-access', async (req, res) => {
    try {
        const { email, inviteCode } = req.body;
        
        console.log(`[MOCK ORG] Access request from: ${email}`);
        
        // Store mock access request
        const requestId = `req_${Date.now()}`;
        mockAccessRequests.set(requestId, {
            id: requestId,
            email: email,
            inviteCode: inviteCode,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        
        console.log(`[MOCK ORG] Access request stored: ${requestId}`);
        res.json({
            success: true,
            message: 'Access request submitted successfully'
        });
        
    } catch (error) {
        console.error('[MOCK ORG] Access request failed:', error.message);
        res.status(400).json({
            error: 'Failed to submit access request'
        });
    }
});

// ===== SSO ENDPOINTS (Stubs) =====

router.get('/oauth/start/:provider', (req, res) => {
    const { provider } = req.params;
    console.log(`[MOCK SSO] OAuth start for provider: ${provider}`);
    res.redirect(`/auth?sso=${provider}&status=mock_implementation`);
});

router.post('/oauth/callback/:provider', (req, res) => {
    const { provider } = req.params;
    console.log(`[MOCK SSO] OAuth callback for provider: ${provider}`);
    res.status(501).json({
        error: `OAuth for ${provider} not yet implemented (mock mode)`
    });
});

router.get('/saml/start', (req, res) => {
    console.log('[MOCK SSO] SAML start');
    res.redirect('/auth?sso=saml&status=mock_implementation');
});

router.post('/saml/callback', (req, res) => {
    console.log('[MOCK SSO] SAML callback');
    res.status(501).json({
        error: 'SAML SSO not yet implemented (mock mode)'
    });
});

// ===== ANALYTICS ENDPOINT =====

router.post('/analytics/track', (req, res) => {
    try {
        const { name, properties } = req.body;
        console.log(`[MOCK ANALYTICS] Event: ${name}`, properties);
        res.json({ success: true });
    } catch (error) {
        console.error('[MOCK ANALYTICS] Tracking failed:', error.message);
        res.status(500).json({ error: 'Analytics tracking failed' });
    }
});

// ===== DEBUG ENDPOINTS =====

// Get mock data for debugging
router.get('/debug/mock-data', (req, res) => {
    res.json({
        users: Array.from(mockUsers.entries()),
        organizations: Array.from(mockOrganizations.entries()),
        accessRequests: Array.from(mockAccessRequests.entries())
    });
});

console.log('[MOCK AUTH] Mock Authentication Bridge loaded - no database required');

module.exports = router;
