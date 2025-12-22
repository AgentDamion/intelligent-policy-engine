import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ingest-key',
};

const laneRules = [
  { lane: 'governance_compliance', regex: /HITL|human.{0,20}review|MLR|claims?|substantiation|audit|retention|provenance|disclosure|attestation|legal.{0,20}review/i, weight: 1.0 },
  { lane: 'governance_compliance', regex: /regulatory|compliance|FDA|GDPR|HIPAA|must.{0,20}review|approval.{0,20}workflow/i, weight: 0.8 },
  { lane: 'security_access', regex: /API.{0,10}key|MFA|multi.?factor|SSO|single.?sign.?on|vault|secrets?|PHI|PII|egress|DLP|encryption|KMS|residency/i, weight: 1.0 },
  { lane: 'security_access', regex: /access.{0,20}control|authentication|authorization|security|credential|password|token|certificate/i, weight: 0.8 },
  { lane: 'integration_scalability', regex: /UAT|user.{0,10}acceptance|connector|integration|PromoMats|DAM|version.{0,10}pinning|rate.?limit|queue|rollback|canary/i, weight: 1.0 },
  { lane: 'integration_scalability', regex: /API|endpoint|webhook|deployment|scaling|performance|latency|SLA|uptime/i, weight: 0.8 },
  { lane: 'business_ops', regex: /KPI|RACI|training|budget|procurement|vendor|market|brand|process|workflow|onboarding/i, weight: 1.0 },
  { lane: 'business_ops', regex: /business.{0,20}(requirement|objective)|stakeholder|project.{0,20}management|cost|ROI/i, weight: 0.8 },
];

interface Clause {
  id: string;
  ref?: string;
  title?: string;
  text: string;
  lane?: string;
  lane_confidence?: number;
  controls?: string[];
  evidence?: string[];
  tags?: string[];
}

interface CanonicalPolicy {
  policy: {
    policy_id: string;
    title: string;
    version: string;
    status: 'draft' | 'approved' | 'deprecated';
    owner?: string;
    effective_date?: string;
    review_cycle_months?: number;
    tool_identity?: any;
    classification?: any;
    regionality?: any;
    allowed_use_cases?: string[];
    prohibited_use_cases?: string[];
    retention?: any;
  };
  clauses: Clause[];
}

function classifyClause(text: string): { lane: string; confidence: number; rationale: string[] } {
  const scores: Record<string, number> = {
    governance_compliance: 0,
    security_access: 0,
    integration_scalability: 0,
    business_ops: 0
  };
  const rationale: string[] = [];

  for (const rule of laneRules) {
    if (rule.regex.test(text)) {
      scores[rule.lane] += rule.weight;
      rationale.push(`Matched ${rule.lane}: ${rule.regex.source.substring(0, 50)}...`);
    }
  }

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [lane, score] = entries[0];
  const confidence = Math.min(0.95, score / 2.5);

  return { lane, confidence, rationale };
}

function parseMarkdownWithFrontMatter(content: string, filename: string): CanonicalPolicy {
  const lines = content.split('\n');
  let metadata: any = {};
  let inFrontMatter = false;
  let yamlLines: string[] = [];
  let bodyLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      inFrontMatter = !inFrontMatter;
      continue;
    }
    if (inFrontMatter) {
      yamlLines.push(line);
    } else {
      bodyLines.push(line);
    }
  }

  for (const line of yamlLines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      metadata[match[1]] = match[2].trim();
    }
  }

  const clauses: Clause[] = [];
  let inClauseCatalog = false;
  
  for (const line of bodyLines) {
    if (/##?\s*Clause\s+Catalog/i.test(line)) {
      inClauseCatalog = true;
      continue;
    }
    
    if (inClauseCatalog && line.trim().startsWith('-')) {
      const clauseText = line.replace(/^-\s*/, '').trim();
      if (clauseText) {
        const { lane, confidence } = classifyClause(clauseText);
        clauses.push({
          id: `${metadata.policy_id || filename}-clause-${clauses.length + 1}`,
          text: clauseText,
          lane,
          lane_confidence: confidence
        });
      }
    }
  }

  return {
    policy: {
      policy_id: metadata.policy_id || filename.replace(/\.\w+$/, ''),
      title: metadata.title || 'Untitled Policy',
      version: metadata.version || '1.0',
      status: metadata.status || 'draft',
      owner: metadata.owner,
      effective_date: metadata.effective_date,
      review_cycle_months: metadata.review_cycle_months ? parseInt(metadata.review_cycle_months) : undefined
    },
    clauses
  };
}

function parseJsonPolicy(content: string, filename: string): CanonicalPolicy {
  const data = JSON.parse(content);
  
  if (data.policy && data.clauses) {
    data.clauses = data.clauses.map((clause: Clause) => {
      if (!clause.lane || !clause.lane_confidence) {
        const { lane, confidence } = classifyClause(clause.text);
        return { ...clause, lane, lane_confidence: confidence };
      }
      return clause;
    });
    return data;
  }

  return {
    policy: {
      policy_id: data.id || filename.replace(/\.\w+$/, ''),
      title: data.name || data.title || 'Untitled Policy',
      version: data.version || '1.0',
      status: data.status || 'draft',
      owner: data.owner
    },
    clauses: (data.clauses || data.rules || []).map((c: any, idx: number) => {
      const text = c.text || c.description || c.requirement || '';
      const { lane, confidence } = classifyClause(text);
      return {
        id: c.id || `${data.id}-clause-${idx + 1}`,
        ref: c.ref || c.reference,
        title: c.title || c.name,
        text,
        lane,
        lane_confidence: confidence,
        controls: c.controls,
        evidence: c.evidence,
        tags: c.tags
      };
    })
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth: Allow JWT bearer token OR X-Ingest-Key header for automation/demo
    const authHeader = req.headers.get('Authorization');
    const ingestKey = req.headers.get('X-Ingest-Key');
    const expectedIngestKey = Deno.env.get('AGENT_INGEST_KEY');

    let user: any = null;

    // Try JWT auth first
    if (authHeader) {
      const { data: authData, error: userError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (!userError && authData?.user) {
        user = authData.user;
      }
    }

    // Fallback to ingest key if JWT failed
    if (!user) {
      if (ingestKey && expectedIngestKey && ingestKey === expectedIngestKey) {
        console.log('Using AGENT_INGEST_KEY authentication for policy ingestion');
      } else {
        throw new Error('Unauthorized: Valid JWT or X-Ingest-Key required');
      }
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const enterpriseId = formData.get('enterprise_id') as string;

    if (!file || !enterpriseId) {
      throw new Error('Missing file or enterprise_id');
    }

    // Verify user access to enterprise (skip if using ingest key)
    if (user) {
      const { data: membership } = await supabase
        .from('enterprise_members')
        .select('role')
        .eq('enterprise_id', enterpriseId)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        throw new Error('Access denied to this enterprise');
      }
    } else {
      console.log('Skipping membership check: using AGENT_INGEST_KEY auth');
    }

    // Create parse job
    const { data: job, error: jobError } = await supabase
      .from('policy_parse_jobs')
      .insert({
        enterprise_id: enterpriseId,
        source_filename: file.name,
        source_mime: file.type,
        status: 'uploaded'
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Read file content
    const content = await file.text();
    let canonical: CanonicalPolicy;

    // Route to appropriate adapter
    const mime = file.type || '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (mime.includes('markdown') || ext === 'md') {
      canonical = parseMarkdownWithFrontMatter(content, file.name);
    } else if (mime.includes('json') || ext === 'json') {
      canonical = parseJsonPolicy(content, file.name);
    } else {
      throw new Error(`Unsupported file type: ${mime || ext}. Supported: markdown, json`);
    }

    // Update job status
    await supabase
      .from('policy_parse_jobs')
      .update({ 
        status: 'normalized',
        policy_id: canonical.policy.policy_id 
      })
      .eq('id', job.id);

    // Upsert policy
    const { error: policyError } = await supabase
      .from('policy_master')
      .upsert({
        id: canonical.policy.policy_id,
        enterprise_id: enterpriseId,
        ...canonical.policy
      });

    if (policyError) throw policyError;

    // Upsert clauses
    const needsReview: any[] = [];
    
    for (const clause of canonical.clauses) {
      const { error: clauseError } = await supabase
        .from('policy_clauses')
        .upsert({
          ...clause,
          policy_id: canonical.policy.policy_id,
          enterprise_id: enterpriseId
        });

      if (clauseError) throw clauseError;

      // Queue for HITL review if confidence is low
      if (clause.lane_confidence && clause.lane_confidence < 0.7) {
        needsReview.push({
          policy_id: canonical.policy.policy_id,
          clause_id: clause.id,
          enterprise_id: enterpriseId,
          lane_suggested: clause.lane,
          lane_confidence: clause.lane_confidence,
          reason: 'low_confidence'
        });
      }
    }

    // Add to review queue if needed
    if (needsReview.length > 0) {
      await supabase.from('clause_review_queue').insert(needsReview);
      
      await supabase
        .from('policy_parse_jobs')
        .update({ status: 'needs_review' })
        .eq('id', job.id);
    } else {
      await supabase
        .from('policy_parse_jobs')
        .update({ status: 'committed', completed_at: new Date().toISOString() })
        .eq('id', job.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        policy_id: canonical.policy.policy_id,
        clauses_count: canonical.clauses.length,
        needs_review: needsReview.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ingest-policy:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
