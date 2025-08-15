const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

// Environment variables with proper defaults
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables:');
  console.error('SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('organizations_enhanced')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message 
      });
    }
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: NODE_ENV,
      database: 'connected'
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      error: err.message 
    });
  }
});

// Basic API endpoint
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Supabase server is running',
    port: PORT,
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// ENTERPRISE API ENDPOINTS - PRODUCTION READY
// =====================================================

// 1. CHANGE MANAGEMENT SYSTEM
// GET all change requests for an organization
app.get('/api/change-requests', async (req, res) => {
  try {
    const { organization_id, status, request_type, impact_level, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('change_requests')
      .select(`
        *,
        requester:users_enhanced!change_requests_requester_id_fkey(id, email, first_name, last_name),
        organization:organizations_enhanced!change_requests_organization_id_fkey(id, name)
      `);
    
    if (organization_id) query = query.eq('organization_id', organization_id);
    if (status) query = query.eq('status', status);
    if (request_type) query = query.eq('request_type', request_type);
    if (impact_level) query = query.eq('impact_level', impact_level);
    
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || data.length
      }
    });
  } catch (error) {
    console.error('Error fetching change requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST new change request
app.post('/api/change-requests', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('change_requests')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating change request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update change request
app.put('/api/change-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('change_requests')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating change request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. INCIDENT & CRISIS MANAGEMENT
// GET all incidents for an organization
app.get('/api/incidents', async (req, res) => {
  try {
    const { organization_id, status, severity, priority, incident_type, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('incidents')
      .select(`
        *,
        reported_by:users_enhanced!incidents_reported_by_fkey(id, email, first_name, last_name),
        assigned_to:users_enhanced!incidents_assigned_to_fkey(id, email, first_name, last_name),
        organization:organizations_enhanced!incidents_organization_id_fkey(id, name)
      `);
    
    if (organization_id) query = query.eq('organization_id', organization_id);
    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);
    if (priority) query = query.eq('priority', priority);
    if (incident_type) query = query.eq('incident_type', incident_type);
    
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || data.length
      }
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST new incident
app.post('/api/incidents', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update incident
app.put('/api/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('incidents')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. QUALITY MANAGEMENT SYSTEM (QMS)
// GET all SOP documents for an organization
app.get('/api/sop-documents', async (req, res) => {
  try {
    const { organization_id, status, document_type, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('sop_documents')
      .select(`
        *,
        approver:users_enhanced!sop_documents_approver_id_fkey(id, email, first_name, last_name),
        reviewer:users_enhanced!sop_documents_reviewer_id_fkey(id, email, first_name, last_name),
        organization:organizations_enhanced!sop_documents_organization_id_fkey(id, name)
      `);
    
    if (organization_id) query = query.eq('organization_id', organization_id);
    if (status) query = query.eq('status', status);
    if (document_type) query = query.eq('document_type', document_type);
    
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || data.length
      }
    });
  } catch (error) {
    console.error('Error fetching SOP documents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST new SOP document
app.post('/api/sop-documents', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sop_documents')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating SOP document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update SOP document
app.put('/api/sop-documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('sop_documents')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating SOP document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. VENDOR RISK MANAGEMENT
// GET all vendors for an organization
app.get('/api/vendors', async (req, res) => {
  try {
    const { organization_id, risk_level, compliance_status, vendor_type, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('vendors')
      .select(`
        *,
        contract:contracts!vendors_contract_id_fkey(id, contract_number, title),
        organization:organizations_enhanced!vendors_organization_id_fkey(id, name)
      `);
    
    if (organization_id) query = query.eq('organization_id', organization_id);
    if (risk_level) query = query.eq('risk_level', risk_level);
    if (compliance_status) query = query.eq('compliance_status', compliance_status);
    if (vendor_type) query = query.eq('vendor_type', vendor_type);
    
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || data.length
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST new vendor
app.post('/api/vendors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update vendor
app.put('/api/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('vendors')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. DISASTER RECOVERY & BUSINESS CONTINUITY
// GET all DR plans for an organization
app.get('/api/disaster-recovery-plans', async (req, res) => {
  try {
    const { organization_id, plan_type, status, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('disaster_recovery_plans')
      .select(`
        *,
        approver:users_enhanced!disaster_recovery_plans_approver_id_fkey(id, email, first_name, last_name),
        organization:organizations_enhanced!disaster_recovery_plans_organization_id_fkey(id, name)
      `);
    
    if (organization_id) query = query.eq('organization_id', organization_id);
    if (plan_type) query = query.eq('plan_type', plan_type);
    if (status) query = query.eq('status', status);
    
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || data.length
      }
    });
  } catch (error) {
    console.error('Error fetching DR plans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST new DR plan
app.post('/api/disaster-recovery-plans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('disaster_recovery_plans')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating DR plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update DR plan
app.put('/api/disaster-recovery-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('disaster_recovery_plans')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating DR plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. ENTERPRISE ONBOARDING & ACCESS MANAGEMENT
// GET all onboarding records for an organization
app.get('/api/enterprise-onboarding', async (req, res) => {
  try {
    const { organization_id, status, onboarding_type, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('enterprise_onboarding')
      .select(`
        *,
        user:users_enhanced!enterprise_onboarding_user_id_fkey(id, email, first_name, last_name),
        organization:organizations_enhanced!enterprise_onboarding_organization_id_fkey(id, name)
      `);
    
    if (organization_id) query = query.eq('organization_id', organization_id);
    if (status) query = query.eq('status', status);
    if (onboarding_type) query = query.eq('onboarding_type', onboarding_type);
    
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || data.length
      }
    });
  } catch (error) {
    console.error('Error fetching onboarding records:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST new onboarding record
app.post('/api/enterprise-onboarding', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enterprise_onboarding')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating onboarding record:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update onboarding record
app.put('/api/enterprise-onboarding/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('enterprise_onboarding')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating onboarding record:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. GLOBAL COMPLIANCE TRACKING
// GET all compliance requirements for an organization
app.get('/api/compliance-requirements', async (req, res) => {
  try {
    const { organization_id, jurisdiction, regulation_type, status, risk_level, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('compliance_requirements')
      .select(`
        *,
        responsible_party:users_enhanced!compliance_requirements_responsible_party_fkey(id, email, first_name, last_name),
        organization:organizations_enhanced!compliance_requirements_organization_id_fkey(id, name)
      `);
    
    if (organization_id) query = query.eq('organization_id', organization_id);
    if (jurisdiction) query = query.eq('jurisdiction', jurisdiction);
    if (regulation_type) query = query.eq('regulation_type', regulation_type);
    if (status) query = query.eq('status', status);
    if (risk_level) query = query.eq('risk_level', risk_level);
    
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('compliance_deadline', { ascending: true });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || data.length
      }
    });
  } catch (error) {
    console.error('Error fetching compliance requirements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST new compliance requirement
app.post('/api/compliance-requirements', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('compliance_requirements')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating compliance requirement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update compliance requirement
app.put('/api/compliance-requirements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('compliance_requirements')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating compliance requirement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// ENTERPRISE DASHBOARD ENDPOINTS
// =====================================================

// GET enterprise dashboard summary
app.get('/api/enterprise/dashboard', async (req, res) => {
  try {
    const { organization_id } = req.query;
    
    if (!organization_id) {
      return res.status(400).json({ success: false, error: 'organization_id is required' });
    }
    
    // Get counts for all enterprise tables
    const [
      changeRequestsCount,
      incidentsCount,
      sopDocumentsCount,
      vendorsCount,
      drPlansCount,
      onboardingCount,
      complianceCount
    ] = await Promise.all([
      supabase.from('change_requests').select('count', { count: 'exact', head: true }).eq('organization_id', organization_id),
      supabase.from('incidents').select('count', { count: 'exact', head: true }).eq('organization_id', organization_id),
      supabase.from('sop_documents').select('count', { count: 'exact', head: true }).eq('organization_id', organization_id),
      supabase.from('vendors').select('count', { count: 'exact', head: true }).eq('organization_id', organization_id),
      supabase.from('disaster_recovery_plans').select('count', { count: 'exact', head: true }).eq('organization_id', organization_id),
      supabase.from('enterprise_onboarding').select('count', { count: 'exact', head: true }).eq('organization_id', organization_id),
      supabase.from('compliance_requirements').select('count', { count: 'exact', head: true }).eq('organization_id', organization_id)
    ]);
    
    // Get high-priority items
    const [
      criticalChanges,
      highPriorityIncidents,
      upcomingComplianceDeadlines
    ] = await Promise.all([
      supabase.from('change_requests')
        .select('id, title, impact_level, status, created_at')
        .eq('organization_id', organization_id)
        .in('impact_level', ['high', 'critical'])
        .eq('status', 'submitted')
        .limit(5),
      supabase.from('incidents')
        .select('id, title, severity, priority, status, created_at')
        .eq('organization_id', organization_id)
        .in('priority', ['high', 'urgent'])
        .eq('status', 'open')
        .limit(5),
      supabase.from('compliance_requirements')
        .select('id, regulation_name, compliance_deadline, status, risk_level')
        .eq('organization_id', organization_id)
        .eq('status', 'in_progress')
        .gte('compliance_deadline', new Date().toISOString())
        .order('compliance_deadline', { ascending: true })
        .limit(5)
    ]);
    
    res.json({
      success: true,
      data: {
        counts: {
          changeRequests: changeRequestsCount.count || 0,
          incidents: incidentsCount.count || 0,
          sopDocuments: sopDocumentsCount.count || 0,
          vendors: vendorsCount.count || 0,
          drPlans: drPlansCount.count || 0,
          onboarding: onboardingCount.count || 0,
          compliance: complianceCount.count || 0
        },
        criticalItems: {
          changeRequests: criticalChanges.data || [],
          incidents: highPriorityIncidents.data || [],
          complianceDeadlines: upcomingComplianceDeadlines.data || []
        }
      }
    });
  } catch (error) {
    console.error('Error fetching enterprise dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// UTILITY ENDPOINTS
// =====================================================

// GET available options for dropdowns and filters
app.get('/api/enterprise/options', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        changeRequestTypes: ['policy', 'contract', 'system', 'process', 'procedure'],
        impactLevels: ['low', 'medium', 'high', 'critical'],
        changeStatuses: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'implemented', 'closed'],
        incidentTypes: ['security', 'performance', 'compliance', 'data', 'system', 'process', 'quality'],
        incidentSeverities: ['low', 'medium', 'high', 'critical'],
        incidentPriorities: ['low', 'medium', 'high', 'urgent'],
        incidentStatuses: ['open', 'investigating', 'mitigating', 'resolved', 'closed', 'escalated'],
        documentTypes: ['sop', 'policy', 'procedure', 'work_instruction', 'form', 'template'],
        documentStatuses: ['draft', 'review', 'approved', 'effective', 'obsolete', 'archived'],
        vendorTypes: ['technology', 'consulting', 'legal', 'audit', 'cloud', 'software', 'hardware'],
        vendorRiskLevels: ['low', 'medium', 'high', 'critical'],
        vendorComplianceStatuses: ['pending', 'compliant', 'non_compliant', 'conditional', 'suspended'],
        dataAccessLevels: ['none', 'read_only', 'limited', 'full'],
        planTypes: ['dr', 'bcp', 'incident_response', 'crisis_management'],
        planStatuses: ['draft', 'review', 'approved', 'active', 'under_revision'],
        onboardingTypes: ['new_hire', 'contractor', 'vendor', 'partner', 'auditor'],
        onboardingStatuses: ['pending', 'in_progress', 'completed', 'failed', 'on_hold'],
        jurisdictions: ['US', 'EU', 'UK', 'Canada', 'Australia', 'Japan', 'China', 'India', 'Brazil', 'Global'],
        regulationTypes: ['fda', 'ema', 'hipaa', 'gdpr', 'ccpa', 'sox', 'gxp', 'iso'],
        complianceStatuses: ['pending', 'in_progress', 'compliant', 'non_compliant', 'exempt'],
        riskLevels: ['low', 'medium', 'high', 'critical']
      }
    });
  } catch (error) {
    console.error('Error fetching enterprise options:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Supabase server started successfully!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API status: http://localhost:${PORT}/api/status`);
  console.log('✅ No Railway dependencies detected');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
