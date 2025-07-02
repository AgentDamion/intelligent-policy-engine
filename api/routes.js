console.log('Starting to load api/routes.js');

const express = require('express');
const { PersistentAuditAgent } = require('../agents/audit-agent-db');

// ALL THREE AGENTIC AGENTS
const { processContext } = require('../agents/context-agent-agentic');
const { getAgenticPolicyAgent } = require('../agents/policy-agent-agentic');
const { getAgenticNegotiationAgent } = require('../agents/negotiation-agent-agentic');

const db = require('../database/connection');
const { checkOrganizationAccess, requireActionAuth } = require('./auth');

console.log('All imports loaded successfully');

const router = express.Router();

// Function to log admin actions to audit table
async function logAdminAction(adminUserId, action, target, reason, ipAddress, result) {
    try {
        const query = `
            INSERT INTO admin_audit_log 
            (admin_user_id, action, target, reason, ip_address, result) 
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, timestamp
        `;
        
        const values = [adminUserId, action, target, reason, ipAddress, JSON.stringify(result)];
        
        const result = await db.query(query, values);
        
        console.log(`[AUDIT DB] Admin action logged with ID: ${result.rows[0].id}`);
        return result.rows[0];
        
    } catch (error) {
        console.error('[AUDIT DB] Failed to log admin action:', error);
        // Don't throw error to avoid breaking the main action flow
        return null;
    }
}

// Context processing - AGENTIC AI
router.post('/process/context', async (req, res) => {
    try {
        req.user = { organization_id: 'demo-org', id: 'demo-user' };
        
        const { userMessage } = req.body;
        console.log('🤖 Processing context with AGENTIC AI:', userMessage);
        
        const result = await processContext(userMessage);
        
        result.apiMetadata = {
            processedAt: new Date().toISOString(),
            userId: req.user.id,
            organizationId: req.user.organization_id,
            endpoint: '/process/context',
            version: 'agentic-v3'
        };
        
        console.log('✅ Agentic context processing complete');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Agentic context processing error:', error);
        res.status(500).json({ 
            error: error.message,
            success: false,
            fallbackUsed: error.message.includes('LLM failed'),
            timestamp: new Date().toISOString()
        });
    }
});

// Policy processing - AGENTIC AI
router.post('/process/policy', async (req, res) => {
    try {
        req.user = { organization_id: 'demo-org', id: 'demo-user' };
        
        const { contextOutput } = req.body;
        console.log('🛡️ Processing policy with AGENTIC AI:', 
            contextOutput?.context?.inferredType || 'unknown context');
        
        const policyAgent = getAgenticPolicyAgent(req.user.organization_id);
        const result = await policyAgent.processPolicy(contextOutput);
        
        result.apiMetadata = {
            processedAt: new Date().toISOString(),
            userId: req.user.id,
            organizationId: req.user.organization_id,
            endpoint: '/process/policy',
            version: 'agentic-v3'
        };
        
        console.log('✅ Agentic policy processing complete');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Agentic policy processing error:', error);
        res.status(500).json({ 
            error: error.message,
            success: false,
            fallbackUsed: error.message.includes('LLM failed'),
            timestamp: new Date().toISOString()
        });
    }
});

// Negotiation processing - NOW AGENTIC AI!
router.post('/process/negotiation', async (req, res) => {
    try {
        req.user = { organization_id: 'demo-org', id: 'demo-user' };
        
        const { contextOutput, policyDecision } = req.body;
        console.log('🤝 Processing negotiation with AGENTIC AI:', 
            contextOutput?.context?.inferredType || 'unknown context');
        
        // Use the agentic negotiation agent
        const negotiationAgent = getAgenticNegotiationAgent(req.user.organization_id);
        const result = await negotiationAgent.processNegotiation(contextOutput, policyDecision);
        
        result.apiMetadata = {
            processedAt: new Date().toISOString(),
            userId: req.user.id,
            organizationId: req.user.organization_id,
            endpoint: '/process/negotiation',
            version: 'agentic-v3'
        };
        
        console.log('✅ Agentic negotiation processing complete');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Agentic negotiation processing error:', error);
        res.status(500).json({ 
            error: error.message,
            success: false,
            fallbackUsed: error.message.includes('LLM failed'),
            timestamp: new Date().toISOString()
        });
    }
});

// THE ULTIMATE TEST: Full 3-Agent Agentic Workflow
router.post('/test/full-agentic', async (req, res) => {
    try {
        const { testMessage } = req.body;
        
        if (!testMessage) {
            return res.status(400).json({
                error: 'testMessage is required',
                example: { testMessage: "Need Midjourney for Pfizer and Novartis campaigns!" }
            });
        }
        
        console.log('🚀 Testing FULL AGENTIC WORKFLOW (3 AI agents) with:', testMessage);
        const startTime = Date.now();
        
        // Step 1: Context Analysis (AI Agent 1)
        console.log('🤖 Step 1: Context Analysis...');
        const contextResult = await processContext(testMessage);
        console.log('✅ Context analysis complete');
        
        // Step 2: Policy Analysis (AI Agent 2)
        console.log('🛡️ Step 2: Policy Analysis...');
        const policyAgent = getAgenticPolicyAgent('demo-org');
        const policyResult = await policyAgent.processPolicy(contextResult);
        console.log('✅ Policy analysis complete');
        
        // Step 3: Negotiation Analysis (AI Agent 3)
        console.log('🤝 Step 3: Negotiation Analysis...');
        const negotiationAgent = getAgenticNegotiationAgent('demo-org');
        const negotiationResult = await negotiationAgent.processNegotiation(contextResult, policyResult);
        console.log('✅ Negotiation analysis complete');
        
        const totalTime = Date.now() - startTime;
        
        console.log(`🎉 FULL AGENTIC WORKFLOW COMPLETE in ${totalTime}ms`);
        
        res.json({
            success: true,
            workflow: 'context-policy-negotiation',
            processingTime: `${totalTime}ms`,
            agentChain: [
                {
                    agent: 'context',
                    analysis: contextResult,
                    aiType: contextResult.processingMetadata?.agentType
                },
                {
                    agent: 'policy', 
                    decision: policyResult,
                    aiType: policyResult.processingMetadata?.agentType
                },
                {
                    agent: 'negotiation',
                    resolution: negotiationResult,
                    aiType: negotiationResult.processingMetadata?.agentType
                }
            ],
            finalDecision: {
                contextType: contextResult.context?.inferredType,
                policyStatus: policyResult.decision?.status,
                negotiationStatus: negotiationResult.final_decision?.status,
                conflictScore: negotiationResult.conflicts?.total_conflict_score,
                clientsDetected: negotiationResult.clients?.detected,
                escalationRequired: negotiationResult.escalation?.required
            },
            testMetadata: {
                timestamp: new Date().toISOString(),
                endpoint: '/test/full-agentic',
                inputMessage: testMessage,
                agentsUsed: ['agentic-context', 'agentic-policy', 'agentic-negotiation'],
                totalProcessingTime: totalTime
            }
        });
        
    } catch (error) {
        console.error('❌ Full agentic workflow test failed:', error);
        res.status(500).json({
            error: error.message,
            success: false,
            fallbackUsed: error.message.includes('LLM failed'),
            workflow: 'context-policy-negotiation',
            failure_point: 'unknown'
        });
    }
});

// Test Context → Policy workflow (existing)
router.post('/test/context-policy', async (req, res) => {
    try {
        const { testMessage } = req.body;
        
        if (!testMessage) {
            return res.status(400).json({
                error: 'testMessage is required',
                example: { testMessage: "Need Midjourney for Pfizer and Novartis campaigns!" }
            });
        }
        
        console.log('🧪 Testing Context → Policy workflow with:', testMessage);
        
        // Step 1: Context Analysis (AI)
        const contextResult = await processContext(testMessage);
        console.log('✅ Context analysis complete');
        
        // Step 2: Policy Analysis (AI)
        const policyAgent = getAgenticPolicyAgent('demo-org');
        const policyResult = await policyAgent.processPolicy(contextResult);
        console.log('✅ Policy analysis complete');
        
        res.json({
            success: true,
            workflow: 'context-policy',
            contextAnalysis: contextResult,
            policyDecision: policyResult,
            testMetadata: {
                timestamp: new Date().toISOString(),
                endpoint: '/test/context-policy',
                inputMessage: testMessage,
                agentsUsed: ['agentic-context', 'agentic-policy']
            }
        });
        
    } catch (error) {
        console.error('❌ Context-Policy workflow test failed:', error);
        res.status(500).json({
            error: error.message,
            success: false,
            fallbackUsed: error.message.includes('LLM failed')
        });
    }
});

// Test individual agentic context agent
router.post('/test/agentic', async (req, res) => {
    try {
        const { testMessage } = req.body;
        
        if (!testMessage) {
            return res.status(400).json({
                error: 'testMessage is required',
                example: { testMessage: "Need urgent help with client presentation!" }
            });
        }
        
        console.log('🧪 Testing agentic context agent with:', testMessage);
        const result = await processContext(testMessage);
        
        res.json({
            success: true,
            agenticResponse: result,
            testMetadata: {
                timestamp: new Date().toISOString(),
                endpoint: '/test/agentic',
                inputMessage: testMessage
            }
        });
        
    } catch (error) {
        console.error('❌ Agentic test failed:', error);
        res.status(500).json({
            error: error.message,
            success: false,
            fallbackUsed: error.message.includes('LLM failed')
        });
    }
});

// Audit log for a session
router.get('/audit/:sessionId', checkOrganizationAccess, async (req, res) => {
    try {
        const auditAgent = new PersistentAuditAgent(req.user.organization_id, req.user.id);
        const auditLog = await auditAgent.getAuditLog(req.params.sessionId);
        res.json(auditLog);
    } catch (error) {
        console.error('Audit retrieval error:', error);
        res.status(500).json({ 
            error: error.message,
            success: false 
        });
    }
});

// Workspaces
router.get('/workspaces', checkOrganizationAccess, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM workspaces WHERE organization_id = $1', 
            [req.user.organization_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Workspaces retrieval error:', error);
        res.status(500).json({ 
            error: error.message,
            success: false 
        });
    }
});

// Policies
router.get('/policies', checkOrganizationAccess, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM policies WHERE organization_id = $1', 
            [req.user.organization_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Policies retrieval error:', error);
        res.status(500).json({ 
            error: error.message,
            success: false 
        });
    }
});

// Health check endpoint - NOW WITH TRIPLE AGENTIC AI
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'API is running with TRIPLE AGENTIC AI',
        version: 'agentic-v3',
        capabilities: {
            agenticContext: true,
            agenticPolicy: true,
            agenticNegotiation: true,
            fullAgenticWorkflow: true,
            auditTrail: true,
            authentication: true
        },
        endpoints: [
            'POST /api/process/context (🤖 AGENTIC)',
            'POST /api/process/policy (🛡️ AGENTIC)',
            'POST /api/process/negotiation (🤝 AGENTIC)',
            'POST /api/test/agentic (🧪 Context Only)',
            'POST /api/test/context-policy (🧪 Dual Workflow)',
            'POST /api/test/full-agentic (🚀 TRIPLE AI WORKFLOW)',
            'GET /api/audit/:sessionId',
            'GET /api/workspaces',
            'GET /api/policies'
        ],
        aiAgents: [
            'Context Agent (GPT-3.5-turbo)',
            'Policy Agent (GPT-3.5-turbo)', 
            'Negotiation Agent (GPT-3.5-turbo)'
        ]
    });
});

// Simple health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// --- AGENCY & CLIENT ORGANIZATION MANAGEMENT ---

// 1. Get list of client organizations for an agency
try {
    router.get('/agency/:agencyId/clients', async (req, res) => {
        console.log('GET /agency/:agencyId/clients called');
        try {
            const { agencyId } = req.params;
            console.log('AgencyId param:', agencyId);
            // Step 1: Get the agency's organization_id
            let agencyOrgId;
            try {
                const agencyRes = await db.query('SELECT organization_id FROM agencies WHERE id = $1', [agencyId]);
                if (!agencyRes.rows.length) {
                    console.log('Agency not found for id:', agencyId);
                    return res.status(404).json({ error: 'Agency not found' });
                }
                agencyOrgId = agencyRes.rows[0].organization_id;
                console.log('Agency organization_id:', agencyOrgId);
            } catch (err) {
                console.error('Error querying agencies table:', err);
                return res.status(500).json({ error: 'Error querying agencies table' });
            }
            // Step 2 & 3: Find client orgs via relationships
            try {
                const result = await db.query(
                    `SELECT o.*
                     FROM relationships r
                     JOIN organizations o ON o.id = r.target_id
                     WHERE r.source_id = $1
                       AND r.source_type = 'organization'
                       AND r.target_type = 'organization'
                       AND r.relationship_type = 'client'`,
                    [agencyOrgId]
                );
                console.log('Client organizations found:', result.rows.length);
                res.json(result.rows);
            } catch (err) {
                console.error('Error querying relationships/orgs:', err);
                res.status(500).json({ error: 'Error querying relationships/orgs' });
            }
        } catch (error) {
            console.error('Error in GET /agency/:agencyId/clients handler:', error);
            res.status(500).json({ error: error.message });
        }
    });
    console.log('Agency route GET /agency/:agencyId/clients loaded');
} catch (err) {
    console.error('Error registering agency route GET /agency/:agencyId/clients:', err);
}

// 2. Submit projects for specific clients
try {
    router.post('/agency/:agencyId/client/:clientId/projects', async (req, res) => {
        try {
            const { agencyId, clientId } = req.params;
            const { name, description, metadata } = req.body;
            // Insert new project for the client organization
            const result = await db.query(
                `INSERT INTO projects (name, organization_id, description, metadata)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [name, clientId, description || '', metadata || {}]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error submitting project:', error);
            res.status(500).json({ error: error.message });
        }
    });
    console.log('Agency route POST /agency/:agencyId/client/:clientId/projects loaded');
} catch (err) {
    console.error('Error registering agency route POST /agency/:agencyId/client/:clientId/projects:', err);
}

// 3. Detect conflicts between competing organizations using competitive_group
try {
    router.post('/agency/:agencyId/conflicts', async (req, res) => {
        try {
            const { agencyId } = req.params;
            const { organizationIds } = req.body; // Array of org IDs to check
            if (!Array.isArray(organizationIds) || organizationIds.length < 2) {
                return res.status(400).json({ error: 'organizationIds (array, min 2) required' });
            }
            // Get competitive_group for each org
            const result = await db.query(
                `SELECT id, name, competitive_group FROM organizations WHERE id = ANY($1)`,
                [organizationIds]
            );
            // Group by competitive_group
            const groupMap = {};
            for (const org of result.rows) {
                if (!groupMap[org.competitive_group]) groupMap[org.competitive_group] = [];
                groupMap[org.competitive_group].push(org);
            }
            // Find conflicts: groups with >1 org
            const conflicts = Object.entries(groupMap)
                .filter(([group, orgs]) => group && orgs.length > 1)
                .map(([group, orgs]) => ({ competitive_group: group, organizations: orgs }));
            res.json({ conflicts });
        } catch (error) {
            console.error('Error detecting conflicts:', error);
            res.status(500).json({ error: error.message });
        }
    });
    console.log('Agency route POST /agency/:agencyId/conflicts loaded');
} catch (err) {
    console.error('Error registering agency route POST /agency/:agencyId/conflicts:', err);
}

// 4. Full 3-agent workflow for any organizations (not hardcoded)
try {
    router.post('/agency/:agencyId/clients/:clientIds/agentic-workflow', async (req, res) => {
        try {
            const { agencyId, clientIds } = req.params;
            const { userMessage } = req.body;
            const clientIdList = clientIds.split(',');
            if (!userMessage || !Array.isArray(clientIdList) || clientIdList.length === 0) {
                return res.status(400).json({ error: 'userMessage and at least one clientId required' });
            }
            // Step 1: Context Analysis
            const contextResult = await processContext(userMessage);
            // Step 2: Policy Analysis (use first client for org context)
            const policyAgent = getAgenticPolicyAgent(clientIdList[0]);
            const policyResult = await policyAgent.processPolicy(contextResult);
            // Step 3: Negotiation Analysis (pass all client orgs)
            const negotiationAgent = getAgenticNegotiationAgent(agencyId);
            // Pass all client orgs as context for negotiation
            contextResult.clients = clientIdList;
            const negotiationResult = await negotiationAgent.processNegotiation(contextResult, policyResult);
            res.json({
                success: true,
                context: contextResult,
                policy: policyResult,
                negotiation: negotiationResult
            });
        } catch (error) {
            console.error('Error in agentic workflow:', error);
            res.status(500).json({ error: error.message });
        }
    });
    console.log('Agency route POST /agency/:agencyId/clients/:clientIds/agentic-workflow loaded');
} catch (err) {
    console.error('Error registering agency route POST /agency/:agencyId/clients/:clientIds/agentic-workflow:', err);
}

// Debug route to inspect relationships and organizations
router.get('/debug/relationships', async (req, res) => {
    try {
        // 1. All relationships
        const allRelRes = await db.query('SELECT * FROM relationships');
        // 2. Relationships for specific agency org_id
        const agencyOrgId = '587b2176-3605-4c58-9abd-44a0fe7f3857';
        const agencyRelRes = await db.query('SELECT * FROM relationships WHERE source_id = $1', [agencyOrgId]);
        // 3. All organizations and their IDs
        const orgsRes = await db.query('SELECT id, name, type, competitive_group FROM organizations');
        res.json({
            allRelationships: allRelRes.rows,
            agencyRelationships: agencyRelRes.rows,
            organizations: orgsRes.rows
        });
    } catch (err) {
        console.error('Error in /api/debug/relationships:', err);
        res.status(500).json({ error: err.message });
    }
});

// Debug route to find agency IDs for specific organization_ids
router.get('/debug/agency-ids-for-orgs', async (req, res) => {
    try {
        const orgIds = [
            'e8c78168-44f3-477b-8dc9-90c6fb6fe68b',
            '93714ac3-cc05-4fcd-9654-b2bba404600c'
        ];
        const agenciesRes = await db.query(
            'SELECT id, name, organization_id FROM agencies WHERE organization_id = ANY($1)',
            [orgIds]
        );
        res.json({ agencies: agenciesRes.rows });
    } catch (err) {
        console.error('Error in /api/debug/agency-ids-for-orgs:', err);
        res.status(500).json({ error: err.message });
    }
});

// Debug route to inspect agencies table existence, structure, and data
router.get('/debug/agencies-table', async (req, res) => {
    try {
        // 1. List all tables
        const tablesRes = await db.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
        `);
        const tableNames = tablesRes.rows.map(r => r.table_name);
        // 2. If agencies table exists, show structure and rows
        let agenciesColumns = null;
        let agenciesRows = null;
        if (tableNames.includes('agencies')) {
            const columnsRes = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'agencies'
            `);
            agenciesColumns = columnsRes.rows;
            const rowsRes = await db.query('SELECT * FROM agencies');
            agenciesRows = rowsRes.rows;
        }
        res.json({
            tables: tableNames,
            agenciesColumns,
            agenciesRows
        });
    } catch (err) {
        console.error('Error in /api/debug/agencies-table:', err);
        res.status(500).json({ error: err.message });
    }
});

// Debug route to view admin audit logs
console.log('🔍 Admin route GET /debug/admin-audit-logs loaded');
router.get('/debug/admin-audit-logs', async (req, res) => {
    try {
        const { limit = 50, offset = 0, admin_user_id, action, start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                id,
                admin_user_id,
                action,
                target,
                reason,
                timestamp,
                ip_address,
                result,
                created_at
            FROM admin_audit_log
            WHERE 1=1
        `;
        
        const values = [];
        let paramCount = 0;
        
        // Add filters
        if (admin_user_id) {
            paramCount++;
            query += ` AND admin_user_id = $${paramCount}`;
            values.push(admin_user_id);
        }
        
        if (action) {
            paramCount++;
            query += ` AND action = $${paramCount}`;
            values.push(action);
        }
        
        if (start_date) {
            paramCount++;
            query += ` AND timestamp >= $${paramCount}`;
            values.push(start_date);
        }
        
        if (end_date) {
            paramCount++;
            query += ` AND timestamp <= $${paramCount}`;
            values.push(end_date);
        }
        
        // Add ordering and pagination
        query += ` ORDER BY timestamp DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, values);
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM admin_audit_log
            WHERE 1=1
        `;
        
        const countValues = [];
        let countParamCount = 0;
        
        if (admin_user_id) {
            countParamCount++;
            countQuery += ` AND admin_user_id = $${countParamCount}`;
            countValues.push(admin_user_id);
        }
        
        if (action) {
            countParamCount++;
            countQuery += ` AND action = $${countParamCount}`;
            countValues.push(action);
        }
        
        if (start_date) {
            countParamCount++;
            countQuery += ` AND timestamp >= $${countParamCount}`;
            countValues.push(start_date);
        }
        
        if (end_date) {
            countParamCount++;
            countQuery += ` AND timestamp <= $${countParamCount}`;
            countValues.push(end_date);
        }
        
        const countResult = await db.query(countQuery, countValues);
        const total = parseInt(countResult.rows[0].total);
        
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: (parseInt(offset) + parseInt(limit)) < total
            },
            filters: {
                admin_user_id,
                action,
                start_date,
                end_date
            }
        });
        
    } catch (error) {
        console.error('Error fetching admin audit logs:', error);
        res.status(500).json({ 
            error: 'Failed to fetch admin audit logs',
            details: error.message 
        });
    }
});

// Admin actions endpoint with action-level authorization
console.log('🔧 Admin route POST /admin/actions loaded');
router.post('/admin/actions', async (req, res) => {
    try {
        const { action, target, reason } = req.body;
        
        // Get IP address from request
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
        
        // Validate required fields first
        if (!action || !target || !reason) {
            return res.status(400).json({ 
                error: 'Missing required fields: action, target, reason' 
            });
        }
        
        // Apply action-level authorization middleware
        const actionAuthMiddleware = requireActionAuth(action);
        actionAuthMiddleware(req, res, async () => {
            try {
                console.log(`[ADMIN ACTION] ${req.user.email} (${req.user.role}) executed ${action} on ${target}: ${reason}`);
                
                // Validate action type
                const validActions = ['restart_agent', 'clear_cache', 'backup_database', 'suspend_user', 'reset_password', 'grant_admin', 'suspend_client', 'force_sync'];
                if (!validActions.includes(action)) {
                    return res.status(400).json({ 
                        error: `Invalid action. Must be one of: ${validActions.join(', ')}` 
                    });
                }
                
                let result;
                
                switch (action) {
                    case 'restart_agent':
                        // Simulate agent restart
                        result = {
                            status: 'success',
                            message: `Agent ${target} restart initiated`,
                            action: action,
                            target: target,
                            reason: reason,
                            timestamp: new Date().toISOString(),
                            details: {
                                agent_status: 'restarting',
                                estimated_downtime: '30 seconds'
                            }
                        };
                        break;
                        
                    case 'clear_cache':
                        // Simulate cache clearing
                        result = {
                            status: 'success',
                            message: `Cache ${target} cleared successfully`,
                            action: action,
                            target: target,
                            reason: reason,
                            timestamp: new Date().toISOString(),
                            details: {
                                cache_size_before: '2.3MB',
                                cache_size_after: '0MB',
                                items_cleared: 156
                            }
                        };
                        break;
                        
                    case 'backup_database':
                        // Simulate database backup
                        result = {
                            status: 'success',
                            message: `Database backup ${target} initiated`,
                            action: action,
                            target: target,
                            reason: reason,
                            timestamp: new Date().toISOString(),
                            details: {
                                backup_type: target,
                                estimated_duration: '5 minutes',
                                backup_location: '/backups/2024-01-20-14-30-00.sql'
                            }
                        };
                        break;
                        
                    case 'suspend_user':
                        // Simulate user suspension
                        result = {
                            status: 'success',
                            message: `User ${target} suspended`,
                            action: action,
                            target: target,
                            reason: reason,
                            timestamp: new Date().toISOString(),
                            details: {
                                user_status: 'suspended',
                                suspension_duration: 'indefinite',
                                admin_notified: true,
                                session_terminated: true
                            }
                        };
                        break;
                        
                    case 'reset_password':
                        // Simulate password reset
                        result = {
                            status: 'success',
                            message: `Password reset initiated for ${target}`,
                            action: action,
                            target: target,
                            reason: reason,
                            timestamp: new Date().toISOString(),
                            details: {
                                reset_method: 'email',
                                reset_link_sent: true,
                                link_expires_in: '24 hours',
                                user_notified: true
                            }
                        };
                        break;
                        
                    case 'grant_admin':
                        // Simulate admin role grant
                        result = {
                            status: 'success',
                            message: `Admin privileges granted to user ${target}`,
                            action: action,
                            target: target,
                            reason: reason,
                            timestamp: new Date().toISOString(),
                            details: {
                                new_role: 'admin',
                                permissions_granted: ['user_management', 'system_config', 'audit_access'],
                                user_notified: true,
                                requires_reauthorization: true
                            }
                        };
                        break;
                        
                    case 'suspend_client':
                        // Simulate client organization suspension (super-admin only)
                        result = {
                            status: 'success',
                            message: `Client organization ${target} suspended`,
                            action: action,
                            target: target,
                            reason: reason,
                            timestamp: new Date().toISOString(),
                            details: {
                                org_status: 'suspended',
                                suspension_duration: 'until_payment',
                                services_affected: ['api_access', 'agentic_ai', 'compliance_workflow'],
                                users_notified: true,
                                billing_contact_alerted: true
                            }
                        };
                        break;
                        
                    case 'force_sync':
                        // Simulate agency data synchronization (super-admin only)
                        result = {
                            status: 'success',
                            message: `Force sync initiated for agency ${target}`,
                            action: action,
                            target: target,
                            reason: reason,
                            timestamp: new Date().toISOString(),
                            details: {
                                sync_type: 'full_agency_sync',
                                data_sources: ['organizations', 'relationships', 'projects', 'users'],
                                estimated_duration: '10 minutes',
                                conflicts_resolved: 0,
                                records_updated: 0
                            }
                        };
                        break;
                        
                    default:
                        return res.status(400).json({ error: 'Unknown action' });
                }
                
                // Log admin action to database
                await logAdminAction(
                    req.user.id,
                    action,
                    target,
                    reason,
                    ipAddress,
                    result
                );
                
                // Log admin action for audit trail with admin user info and role
                console.log(`[AUDIT] Admin action completed by ${req.user.email} (${req.user.role}):`, result);
                
                res.status(200).json(result);
                
            } catch (error) {
                console.error('Error executing admin action:', error);
                res.status(500).json({ 
                    error: 'Failed to execute admin action',
                    details: error.message 
                });
            }
        });
        
    } catch (error) {
        console.error('Error in admin actions endpoint:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

module.exports = router;