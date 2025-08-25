// AI Tool Governance API
// Comprehensive API for managing AI tool policies, usage tracking, and compliance

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { z } = require('zod');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const ToolPolicySchema = z.object({
    tool_id: z.string().uuid(),
    status: z.enum(['allowed', 'blocked', 'requires_review', 'conditional']),
    content_types: z.array(z.string()).optional(),
    prohibited_content_types: z.array(z.string()).optional(),
    mlr_required: z.boolean().optional(),
    mlr_criteria: z.object({}).optional(),
    approval_workflow: z.object({}).optional(),
    risk_assessment: z.object({}).optional(),
    mitigation_measures: z.array(z.string()).optional(),
    effective_date: z.string().datetime().optional(),
    expiration_date: z.string().datetime().optional()
});

const ToolUsageSchema = z.object({
    tool_id: z.string().uuid(),
    action: z.string(),
    content_type: z.string().optional(),
    content_classification: z.object({}).optional(),
    content_metadata: z.object({}).optional()
});

const AccessControlSchema = z.object({
    tool_id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    role: z.string().optional(),
    department: z.string().optional(),
    access_level: z.enum(['full', 'limited', 'supervised', 'blocked']),
    restrictions: z.object({}).optional(),
    valid_until: z.string().datetime().optional(),
    daily_limit: z.number().optional(),
    monthly_limit: z.number().optional()
});

// =====================================================
// MIDDLEWARE
// =====================================================

// Extract user and organization from auth
const extractAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get user's organization
        const { data: userData, error: userError } = await supabase
            .from('users_enhanced')
            .select('id, organization_id, role')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        req.user = {
            id: user.id,
            organization_id: userData.organization_id,
            role: userData.role
        };

        next();
    } catch (error) {
        console.error('Auth extraction error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

// Check admin privileges
const requireAdmin = (req, res, next) => {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient privileges' });
    }
    next();
};

// =====================================================
// AI TOOLS ENDPOINTS
// =====================================================

// Get all AI tools
router.get('/tools', extractAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ai_tools')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;

        res.json({ tools: data });
    } catch (error) {
        console.error('Error fetching AI tools:', error);
        res.status(500).json({ error: 'Failed to fetch AI tools' });
    }
});

// Get specific tool details with organization policy
router.get('/tools/:toolId', extractAuth, async (req, res) => {
    try {
        const { toolId } = req.params;

        // Get tool details
        const { data: tool, error: toolError } = await supabase
            .from('ai_tools')
            .select('*')
            .eq('id', toolId)
            .single();

        if (toolError) throw toolError;

        // Get organization's policy for this tool
        const { data: policy, error: policyError } = await supabase
            .from('tool_policies')
            .select('*')
            .eq('organization_id', req.user.organization_id)
            .eq('tool_id', toolId)
            .single();

        // Get user's access control if exists
        const { data: accessControl } = await supabase
            .from('tool_access_controls')
            .select('*')
            .eq('organization_id', req.user.organization_id)
            .eq('tool_id', toolId)
            .eq('user_id', req.user.id)
            .single();

        res.json({
            tool,
            policy: policy || null,
            accessControl: accessControl || null
        });
    } catch (error) {
        console.error('Error fetching tool details:', error);
        res.status(500).json({ error: 'Failed to fetch tool details' });
    }
});

// =====================================================
// POLICY MANAGEMENT ENDPOINTS
// =====================================================

// Get all policies for organization
router.get('/policies', extractAuth, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tool_policies')
            .select(`
                *,
                ai_tools (
                    id,
                    name,
                    category,
                    risk_level
                )
            `)
            .eq('organization_id', req.user.organization_id)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        res.json({ policies: data });
    } catch (error) {
        console.error('Error fetching policies:', error);
        res.status(500).json({ error: 'Failed to fetch policies' });
    }
});

// Create or update policy
router.post('/policies', extractAuth, requireAdmin, async (req, res) => {
    try {
        const validatedData = ToolPolicySchema.parse(req.body);

        // Check if policy exists
        const { data: existing } = await supabase
            .from('tool_policies')
            .select('id')
            .eq('organization_id', req.user.organization_id)
            .eq('tool_id', validatedData.tool_id)
            .single();

        const policyData = {
            ...validatedData,
            organization_id: req.user.organization_id,
            updated_by: req.user.id,
            updated_at: new Date().toISOString()
        };

        let result;
        if (existing) {
            // Update existing policy
            const { data, error } = await supabase
                .from('tool_policies')
                .update(policyData)
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            result = data;

            // Log governance event
            await logGovernanceEvent({
                organization_id: req.user.organization_id,
                event_type: 'policy_updated',
                user_id: req.user.id,
                tool_id: validatedData.tool_id,
                policy_id: existing.id,
                details: { changes: validatedData }
            });
        } else {
            // Create new policy
            policyData.created_by = req.user.id;
            
            const { data, error } = await supabase
                .from('tool_policies')
                .insert(policyData)
                .select()
                .single();

            if (error) throw error;
            result = data;

            // Log governance event
            await logGovernanceEvent({
                organization_id: req.user.organization_id,
                event_type: 'policy_created',
                user_id: req.user.id,
                tool_id: validatedData.tool_id,
                policy_id: data.id,
                details: validatedData
            });
        }

        res.json({ policy: result });
    } catch (error) {
        console.error('Error saving policy:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid policy data', details: error.errors });
        } else {
            res.status(500).json({ error: 'Failed to save policy' });
        }
    }
});

// Delete policy
router.delete('/policies/:policyId', extractAuth, requireAdmin, async (req, res) => {
    try {
        const { policyId } = req.params;

        // Get policy details for logging
        const { data: policy } = await supabase
            .from('tool_policies')
            .select('tool_id')
            .eq('id', policyId)
            .eq('organization_id', req.user.organization_id)
            .single();

        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        // Delete policy
        const { error } = await supabase
            .from('tool_policies')
            .delete()
            .eq('id', policyId)
            .eq('organization_id', req.user.organization_id);

        if (error) throw error;

        // Log governance event
        await logGovernanceEvent({
            organization_id: req.user.organization_id,
            event_type: 'policy_updated',
            user_id: req.user.id,
            tool_id: policy.tool_id,
            policy_id: policyId,
            details: { action: 'deleted' }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting policy:', error);
        res.status(500).json({ error: 'Failed to delete policy' });
    }
});

// =====================================================
// USAGE TRACKING ENDPOINTS
// =====================================================

// Check policy and log usage
router.post('/usage/check', extractAuth, async (req, res) => {
    try {
        const validatedData = ToolUsageSchema.parse(req.body);

        // Check policy compliance
        const { data: complianceResult, error: complianceError } = await supabase
            .rpc('check_tool_policy_compliance', {
                p_organization_id: req.user.organization_id,
                p_tool_id: validatedData.tool_id,
                p_content_type: validatedData.content_type,
                p_user_id: req.user.id
            });

        if (complianceError) throw complianceError;

        // Log usage
        const usageLog = {
            organization_id: req.user.organization_id,
            user_id: req.user.id,
            tool_id: validatedData.tool_id,
            action: validatedData.action,
            content_type: validatedData.content_type,
            content_classification: validatedData.content_classification,
            content_metadata: validatedData.content_metadata,
            passed_policy_check: complianceResult.allowed,
            status: complianceResult.status,
            policy_violations: complianceResult.reason ? [complianceResult.reason] : [],
            mlr_status: complianceResult.mlr_required ? 'pending' : 'not_required',
            session_id: req.headers['x-session-id'],
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        };

        const { data: logEntry, error: logError } = await supabase
            .from('tool_usage_logs')
            .insert(usageLog)
            .select()
            .single();

        if (logError) throw logError;

        // If MLR required, add to review queue
        if (complianceResult.mlr_required) {
            const { error: queueError } = await supabase
                .from('mlr_review_queue')
                .insert({
                    organization_id: req.user.organization_id,
                    usage_log_id: logEntry.id,
                    requested_by: req.user.id,
                    priority: 'medium',
                    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours SLA
                });

            if (queueError) console.error('Error adding to MLR queue:', queueError);
        }

        // Log governance event if blocked
        if (!complianceResult.allowed) {
            await logGovernanceEvent({
                organization_id: req.user.organization_id,
                event_type: 'tool_blocked',
                user_id: req.user.id,
                tool_id: validatedData.tool_id,
                usage_log_id: logEntry.id,
                severity: 'warning',
                status: complianceResult.status,
                reason: complianceResult.reason
            });
        }

        res.json({
            allowed: complianceResult.allowed,
            status: complianceResult.status,
            reason: complianceResult.reason,
            usage_log_id: logEntry.id,
            mlr_required: complianceResult.mlr_required
        });
    } catch (error) {
        console.error('Error checking usage:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid usage data', details: error.errors });
        } else {
            res.status(500).json({ error: 'Failed to check usage' });
        }
    }
});

// Get usage history
router.get('/usage/history', extractAuth, async (req, res) => {
    try {
        const { 
            start_date,
            end_date,
            tool_id,
            user_id,
            status,
            limit = 100,
            offset = 0
        } = req.query;

        let query = supabase
            .from('tool_usage_logs')
            .select(`
                *,
                ai_tools (
                    id,
                    name,
                    category
                ),
                users_enhanced (
                    id,
                    email,
                    first_name,
                    last_name
                )
            `)
            .eq('organization_id', req.user.organization_id)
            .order('timestamp', { ascending: false })
            .limit(limit)
            .range(offset, offset + limit - 1);

        // Apply filters
        if (start_date) query = query.gte('timestamp', start_date);
        if (end_date) query = query.lte('timestamp', end_date);
        if (tool_id) query = query.eq('tool_id', tool_id);
        if (user_id && (req.user.role === 'admin' || user_id === req.user.id)) {
            query = query.eq('user_id', user_id);
        }
        if (status) query = query.eq('status', status);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            usage_logs: data,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching usage history:', error);
        res.status(500).json({ error: 'Failed to fetch usage history' });
    }
});

// =====================================================
// ACCESS CONTROL ENDPOINTS
// =====================================================

// Get access controls for organization
router.get('/access-controls', extractAuth, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tool_access_controls')
            .select(`
                *,
                ai_tools (
                    id,
                    name,
                    category
                ),
                users_enhanced (
                    id,
                    email,
                    first_name,
                    last_name
                )
            `)
            .eq('organization_id', req.user.organization_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ access_controls: data });
    } catch (error) {
        console.error('Error fetching access controls:', error);
        res.status(500).json({ error: 'Failed to fetch access controls' });
    }
});

// Create or update access control
router.post('/access-controls', extractAuth, requireAdmin, async (req, res) => {
    try {
        const validatedData = AccessControlSchema.parse(req.body);

        const accessControlData = {
            ...validatedData,
            organization_id: req.user.organization_id,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('tool_access_controls')
            .upsert(accessControlData, {
                onConflict: 'organization_id,tool_id,user_id,role,department'
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ access_control: data });
    } catch (error) {
        console.error('Error saving access control:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid access control data', details: error.errors });
        } else {
            res.status(500).json({ error: 'Failed to save access control' });
        }
    }
});

// =====================================================
// MLR MANAGEMENT ENDPOINTS
// =====================================================

// Get MLR review queue
router.get('/mlr/queue', extractAuth, async (req, res) => {
    try {
        // Check if user is an MLR reviewer (could be based on role or specific flag)
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized for MLR reviews' });
        }

        const { status = 'pending' } = req.query;

        let query = supabase
            .from('mlr_review_queue')
            .select(`
                *,
                tool_usage_logs (
                    *,
                    ai_tools (
                        id,
                        name,
                        category
                    ),
                    users_enhanced (
                        id,
                        email,
                        first_name,
                        last_name
                    )
                )
            `)
            .eq('organization_id', req.user.organization_id)
            .order('priority', { ascending: false })
            .order('requested_at', { ascending: true });

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ review_queue: data });
    } catch (error) {
        console.error('Error fetching MLR queue:', error);
        res.status(500).json({ error: 'Failed to fetch MLR queue' });
    }
});

// Update MLR review
router.put('/mlr/queue/:reviewId', extractAuth, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { decision, review_notes, modifications } = req.body;

        if (!['approved', 'rejected', 'modified'].includes(decision)) {
            return res.status(400).json({ error: 'Invalid decision' });
        }

        // Update review queue
        const { data: review, error: reviewError } = await supabase
            .from('mlr_review_queue')
            .update({
                status: 'completed',
                decision,
                review_notes,
                modifications,
                assigned_to: req.user.id,
                completed_at: new Date().toISOString()
            })
            .eq('id', reviewId)
            .eq('organization_id', req.user.organization_id)
            .select()
            .single();

        if (reviewError) throw reviewError;

        // Update usage log
        const { error: usageError } = await supabase
            .from('tool_usage_logs')
            .update({
                mlr_status: decision === 'rejected' ? 'rejected' : 'approved',
                mlr_reviewer_id: req.user.id,
                mlr_review_date: new Date().toISOString(),
                mlr_comments: review_notes,
                status: decision === 'approved' ? 'approved' : 'blocked'
            })
            .eq('id', review.usage_log_id);

        if (usageError) throw usageError;

        // Log governance event
        await logGovernanceEvent({
            organization_id: req.user.organization_id,
            event_type: 'mlr_completed',
            user_id: req.user.id,
            usage_log_id: review.usage_log_id,
            mlr_reviewer_id: req.user.id,
            mlr_decision: decision,
            details: { review_notes, modifications }
        });

        res.json({ success: true, review });
    } catch (error) {
        console.error('Error updating MLR review:', error);
        res.status(500).json({ error: 'Failed to update MLR review' });
    }
});

// =====================================================
// ANALYTICS ENDPOINTS
// =====================================================

// Get governance metrics
router.get('/analytics/metrics', extractAuth, requireAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Get usage statistics
        const { data: usageStats, error: usageError } = await supabase
            .rpc('get_tool_usage_stats', {
                p_organization_id: req.user.organization_id,
                p_start_date: start_date,
                p_end_date: end_date
            });

        if (usageError) throw usageError;

        // Get policy compliance metrics
        const { data: complianceMetrics, error: complianceError } = await supabase
            .from('tool_usage_logs')
            .select('status, passed_policy_check')
            .eq('organization_id', req.user.organization_id);

        if (complianceError) throw complianceError;

        const metrics = {
            total_usage: complianceMetrics.length,
            approved: complianceMetrics.filter(m => m.status === 'approved').length,
            blocked: complianceMetrics.filter(m => m.status === 'blocked').length,
            pending_review: complianceMetrics.filter(m => m.status === 'pending_review').length,
            mlr_required: complianceMetrics.filter(m => m.status === 'mlr_required').length,
            compliance_rate: complianceMetrics.length > 0 
                ? (complianceMetrics.filter(m => m.passed_policy_check).length / complianceMetrics.length * 100).toFixed(2)
                : 0,
            usage_by_tool: usageStats?.usage_by_tool || [],
            usage_by_status: usageStats?.usage_by_status || [],
            usage_trend: usageStats?.usage_trend || []
        };

        res.json({ metrics });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// Get governance events
router.get('/analytics/events', extractAuth, requireAdmin, async (req, res) => {
    try {
        const { 
            event_type,
            severity,
            start_date,
            end_date,
            limit = 100,
            offset = 0
        } = req.query;

        let query = supabase
            .from('ai_governance_events')
            .select(`
                *,
                users_enhanced (
                    id,
                    email,
                    first_name,
                    last_name
                ),
                ai_tools (
                    id,
                    name,
                    category
                )
            `)
            .eq('organization_id', req.user.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit)
            .range(offset, offset + limit - 1);

        // Apply filters
        if (event_type) query = query.eq('event_type', event_type);
        if (severity) query = query.eq('severity', severity);
        if (start_date) query = query.gte('created_at', start_date);
        if (end_date) query = query.lte('created_at', end_date);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            events: data,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching governance events:', error);
        res.status(500).json({ error: 'Failed to fetch governance events' });
    }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Log governance event
async function logGovernanceEvent(eventData) {
    try {
        const { error } = await supabase
            .from('ai_governance_events')
            .insert({
                ...eventData,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error logging governance event:', error);
        }
    } catch (error) {
        console.error('Error in logGovernanceEvent:', error);
    }
}

// Export router
module.exports = router;