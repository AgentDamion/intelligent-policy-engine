// Modern Authentication Hub Bridge
// Connects the frontend auth hub to the existing hierarchical auth system

const express = require('express');
const router = express.Router();
const hierarchicalAuth = require('./hierarchical-auth');
const db = require('../../database/connection');
const jwt = require('jsonwebtoken');

// ===== AUTHENTICATION ENDPOINTS =====

// Sign in endpoint (maps to hierarchical auth)
router.post('/auth/signin', async (req, res) => {
    try {
        const { email, password, useMagicLink, remember } = req.body;
        
        console.log(`[AUTH] Sign in attempt for: ${email}`);
        
        if (useMagicLink) {
            // TODO: Implement magic link flow
            return res.status(501).json({
                error: 'Magic link authentication not yet implemented'
            });
        }
        
        // Use existing hierarchical authentication
        const authResult = await hierarchicalAuth.authenticateUser(email, password);
        
        // Map to frontend auth hub session format
        const session = {
            userId: authResult.user.id,
            email: authResult.user.email,
            orgId: authResult.defaultContext?.enterpriseId,
            roles: [authResult.defaultContext?.role].filter(Boolean),
            token: authResult.token,
            mfaRequired: false // TODO: Implement MFA check
        };
        
        // Set session cookie if remember is true
        if (remember) {
            res.cookie('auth_token', authResult.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });
        }
        
        console.log(`[AUTH] Sign in successful for: ${email}`);
        res.json(session);
        
    } catch (error) {
        console.error('[AUTH] Sign in failed:', error.message);
        res.status(401).json({
            error: error.message || 'Invalid credentials'
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        
        // Get current user data
        const userResult = await db.query(`
            SELECT u.id, u.email, u.name 
            FROM users u 
            WHERE u.id = $1 AND u.is_active = true
        `, [decoded.userId]);
        
        if (!userResult.rows[0]) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        
        // Get current context
        const contexts = await hierarchicalAuth.getUserContexts(user.id);
        const currentContext = contexts.find(c => c.contextId === decoded.contextId) || contexts[0];
        
        const session = {
            userId: user.id,
            email: user.email,
            orgId: currentContext?.enterpriseId,
            roles: [currentContext?.role].filter(Boolean),
            token: token,
            mfaRequired: false // TODO: Check MFA status
        };
        
        res.json(session);
        
    } catch (error) {
        console.error('[AUTH] Session check failed:', error.message);
        res.status(401).json({ error: 'Invalid session' });
    }
});

// Logout endpoint
router.post('/auth/logout', (req, res) => {
    try {
        // Clear auth cookie
        res.clearCookie('auth_token');
        
        console.log('[AUTH] User logged out');
        res.json({ success: true });
        
    } catch (error) {
        console.error('[AUTH] Logout failed:', error.message);
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
        
        console.log(`[ORG] Creating organization: ${orgName}`);
        
        // Use existing hierarchical auth to create enterprise
        const enterpriseData = {
            name: orgName,
            type: orgType, // 'enterprise', 'partner', or 'both'
            region: region,
            email_domain: emailDomain,
            sso_enabled: enableSSO,
            sso_provider: ssoProvider,
            settings: {
                initialRoles: initialRoles
            }
        };
        
        // Create enterprise (this would need to be implemented in hierarchical-auth)
        const enterprise = await createEnterpriseViaAPI(enterpriseData);
        
        res.json({
            orgId: enterprise.id,
            next: 'mfa' // Always suggest MFA setup for new orgs
        });
        
    } catch (error) {
        console.error('[ORG] Organization creation failed:', error.message);
        res.status(400).json({
            error: error.message || 'Failed to create organization'
        });
    }
});

// Request access endpoint  
router.post('/org/request-access', async (req, res) => {
    try {
        const { email, inviteCode } = req.body;
        
        console.log(`[ORG] Access request from: ${email}`);
        
        // Store access request in database
        const result = await db.query(`
            INSERT INTO access_requests (email, invite_code, status, created_at)
            VALUES ($1, $2, 'pending', NOW())
            RETURNING id
        `, [email, inviteCode || null]);
        
        // TODO: Send notification to org admins
        // TODO: If invite code is valid, auto-approve
        
        res.json({
            success: true,
            message: 'Access request submitted successfully'
        });
        
    } catch (error) {
        console.error('[ORG] Access request failed:', error.message);
        res.status(400).json({
            error: error.message || 'Failed to submit access request'
        });
    }
});

// ===== SSO ENDPOINTS (Stubs) =====

// OAuth start endpoint
router.get('/oauth/start/:provider', (req, res) => {
    const { provider } = req.params;
    
    console.log(`[SSO] OAuth start for provider: ${provider}`);
    
    // TODO: Implement OAuth flows
    // For now, redirect to a placeholder
    res.redirect(`/auth?sso=${provider}&status=not_implemented`);
});

// OAuth callback endpoint
router.post('/oauth/callback/:provider', (req, res) => {
    const { provider } = req.params;
    const { code } = req.body;
    
    console.log(`[SSO] OAuth callback for provider: ${provider}`);
    
    // TODO: Implement OAuth callback handling
    res.status(501).json({
        error: `OAuth for ${provider} not yet implemented`
    });
});

// SAML start endpoint
router.get('/saml/start', (req, res) => {
    console.log('[SSO] SAML start');
    
    // TODO: Implement SAML SSO
    res.redirect('/auth?sso=saml&status=not_implemented');
});

// SAML callback endpoint
router.post('/saml/callback', (req, res) => {
    console.log('[SSO] SAML callback');
    
    // TODO: Implement SAML callback handling
    res.status(501).json({
        error: 'SAML SSO not yet implemented'
    });
});

// ===== ANALYTICS ENDPOINT =====

// Analytics tracking endpoint
router.post('/analytics/track', (req, res) => {
    try {
        const { name, properties } = req.body;
        
        console.log(`[ANALYTICS] Event: ${name}`, properties);
        
        // TODO: Implement proper analytics storage
        // For now, just log to console
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('[ANALYTICS] Tracking failed:', error.message);
        res.status(500).json({ error: 'Analytics tracking failed' });
    }
});

// ===== HELPER FUNCTIONS =====

// Create enterprise via existing system
async function createEnterpriseViaAPI(enterpriseData) {
    try {
        // Generate a unique slug for the enterprise
        const slug = enterpriseData.name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 100);
        
        const result = await db.query(`
            INSERT INTO enterprises (
                name, slug, type, region, email_domain, sso_enabled, 
                sso_provider, settings, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING *
        `, [
            enterpriseData.name,
            slug,
            enterpriseData.type,
            enterpriseData.region,
            enterpriseData.email_domain,
            enterpriseData.sso_enabled,
            enterpriseData.sso_provider,
            JSON.stringify(enterpriseData.settings)
        ]);
        
        return result.rows[0];
    } catch (error) {
        console.error('[ORG] Database error creating enterprise:', error.message);
        throw new Error('Failed to create enterprise in database');
    }
}

module.exports = router;
