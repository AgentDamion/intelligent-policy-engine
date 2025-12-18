import { serve } from "https://deno.land/std@0.207.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod Schemas
const TelemetryAtom = z.object({
  timestamp: z.string(),
  event_type: z.string(),
  severity: z.enum(['info', 'warning', 'violation', 'critical']).optional(),
  tool_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const RiskScoreOptions = z.object({
  region: z.string().optional(),
  toolId: z.string().optional(),
  timeWindow: z.string().optional(), // e.g., "24h", "7d", "30d"
});

const ApiSchema = z.object({
  atoms: z.array(TelemetryAtom),
  options: RiskScoreOptions.optional(),
});

interface RiskFactor {
  category: string;
  contribution: number;
  description: string;
}

interface RiskScore {
  total: number;
  breakdown: {
    frequency: number;
    severity: number;
    pattern: number;
    compliance: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
  metadata: {
    atomsAnalyzed: number;
    timeWindow: string;
    region?: string;
    toolId?: string;
  };
}

// Regional weighting multipliers
const REGIONAL_WEIGHTS: Record<string, number> = {
  'EU': 1.2,
  'US': 1.0,
  'APAC': 0.9,
  'other': 0.9,
};

// Severity weights
const SEVERITY_WEIGHTS = {
  'info': 0,
  'warning': 10,
  'violation': 25,
  'critical': 40,
};

// Calculate frequency risk (0-25 points)
function calculateFrequencyRisk(atoms: z.infer<typeof TelemetryAtom>[], timeWindow: string): number {
  const eventCount = atoms.length;
  
  // Parse time window
  const hours = timeWindow.includes('h') ? parseInt(timeWindow) : 
                timeWindow.includes('d') ? parseInt(timeWindow) * 24 : 24;
  
  // Calculate events per hour
  const eventsPerHour = eventCount / hours;
  
  // Threshold-based scoring
  if (eventsPerHour > 100) return 25;
  if (eventsPerHour > 50) return 20;
  if (eventsPerHour > 20) return 15;
  if (eventsPerHour > 10) return 10;
  if (eventsPerHour > 5) return 5;
  return 0;
}

// Calculate severity risk (0-40 points)
function calculateSeverityRisk(atoms: z.infer<typeof TelemetryAtom>[]): number {
  const severityCounts = {
    info: 0,
    warning: 0,
    violation: 0,
    critical: 0,
  };

  atoms.forEach(atom => {
    const severity = atom.severity || 'info';
    severityCounts[severity]++;
  });

  const totalEvents = atoms.length || 1;
  const weightedScore = 
    (severityCounts.critical * SEVERITY_WEIGHTS.critical +
     severityCounts.violation * SEVERITY_WEIGHTS.violation +
     severityCounts.warning * SEVERITY_WEIGHTS.warning) / totalEvents;

  return Math.min(Math.round(weightedScore), 40);
}

// Calculate pattern risk (0-20 points)
function calculatePatternRisk(atoms: z.infer<typeof TelemetryAtom>[]): number {
  if (atoms.length < 10) return 0;

  // Sort by timestamp
  const sorted = [...atoms].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Detect spikes: check if event rate increases significantly
  const timeWindows = 5;
  const chunkSize = Math.floor(sorted.length / timeWindows);
  const rates: number[] = [];

  for (let i = 0; i < timeWindows && i * chunkSize < sorted.length; i++) {
    const chunk = sorted.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length > 1) {
      const start = new Date(chunk[0].timestamp).getTime();
      const end = new Date(chunk[chunk.length - 1].timestamp).getTime();
      const hours = (end - start) / (1000 * 60 * 60) || 1;
      rates.push(chunk.length / hours);
    }
  }

  if (rates.length < 2) return 0;

  // Check for anomalies (rate > 2x average)
  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  const hasSpike = rates.some(rate => rate > avgRate * 2);
  
  // Check for increasing trend
  const isIncreasing = rates.every((rate, i) => i === 0 || rate >= rates[i - 1] * 0.8);

  let score = 0;
  if (hasSpike) score += 12;
  if (isIncreasing) score += 8;

  return Math.min(score, 20);
}

// Calculate compliance risk (0-15 points)
async function calculateComplianceRisk(
  supabase: any,
  toolId?: string,
  userId?: string
): Promise<number> {
  try {
    // Query historical compliance data
    let query = supabase
      .from('agent_activities')
      .select('details')
      .eq('agent', 'policy-engine')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (toolId) {
      query = query.eq('details->>tool_id', toolId);
    }

    const { data, error } = await query.limit(100);

    if (error || !data || data.length === 0) return 5; // Default moderate risk

    // Calculate approval rate
    const approvals = data.filter(d => 
      d.details?.verdict?.status === 'Approved'
    ).length;

    const approvalRate = approvals / data.length;

    // Score based on approval rate
    if (approvalRate > 0.9) return 0;
    if (approvalRate > 0.75) return 5;
    if (approvalRate > 0.5) return 10;
    return 15;

  } catch (err) {
    console.error('Error calculating compliance risk:', err);
    return 5;
  }
}

// Identify top risk factors
function identifyRiskFactors(
  breakdown: RiskScore['breakdown'],
  atoms: z.infer<typeof TelemetryAtom>[]
): RiskFactor[] {
  const factors: RiskFactor[] = [];

  if (breakdown.frequency > 15) {
    factors.push({
      category: 'frequency',
      contribution: breakdown.frequency,
      description: `High event volume detected (${atoms.length} events)`,
    });
  }

  if (breakdown.severity > 25) {
    const criticalCount = atoms.filter(a => a.severity === 'critical').length;
    factors.push({
      category: 'severity',
      contribution: breakdown.severity,
      description: `${criticalCount} critical violations detected`,
    });
  }

  if (breakdown.pattern > 10) {
    factors.push({
      category: 'pattern',
      contribution: breakdown.pattern,
      description: 'Anomalous usage patterns or spikes detected',
    });
  }

  if (breakdown.compliance > 10) {
    factors.push({
      category: 'compliance',
      contribution: breakdown.compliance,
      description: 'Poor historical compliance record',
    });
  }

  return factors.sort((a, b) => b.contribution - a.contribution).slice(0, 5);
}

// Generate recommendations
function generateRecommendations(score: number, factors: RiskFactor[]): string[] {
  const recommendations: string[] = [];

  if (score >= 81) {
    recommendations.push('CRITICAL: Escalate to security team immediately');
    recommendations.push('Suspend tool access pending investigation');
  } else if (score >= 61) {
    recommendations.push('HIGH: Require immediate policy review');
    recommendations.push('Implement additional monitoring and alerts');
  } else if (score >= 31) {
    recommendations.push('MEDIUM: Schedule policy compliance review');
    recommendations.push('Increase audit frequency for this tool');
  } else {
    recommendations.push('LOW: Continue standard monitoring');
  }

  factors.forEach(factor => {
    if (factor.category === 'frequency') {
      recommendations.push('Consider rate limiting or usage quotas');
    } else if (factor.category === 'severity') {
      recommendations.push('Review and strengthen approval workflows');
    } else if (factor.category === 'pattern') {
      recommendations.push('Investigate anomalous usage patterns');
    } else if (factor.category === 'compliance') {
      recommendations.push('Provide additional compliance training');
    }
  });

  return [...new Set(recommendations)].slice(0, 5);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { atoms, options = {} } = ApiSchema.parse(body);

    const timeWindow = options.timeWindow || '24h';
    const region = options.region || 'US';
    const regionalMultiplier = REGIONAL_WEIGHTS[region] || REGIONAL_WEIGHTS['other'];

    // Calculate risk components
    const frequencyRisk = calculateFrequencyRisk(atoms, timeWindow);
    const severityRisk = calculateSeverityRisk(atoms);
    const patternRisk = calculatePatternRisk(atoms);
    const complianceRisk = await calculateComplianceRisk(supabase, options.toolId, user.id);

    // Calculate total with regional weighting
    const baseTotal = frequencyRisk + severityRisk + patternRisk + complianceRisk;
    const total = Math.min(Math.round(baseTotal * regionalMultiplier), 100);

    // Determine risk level
    let riskLevel: RiskScore['riskLevel'];
    if (total >= 81) riskLevel = 'critical';
    else if (total >= 61) riskLevel = 'high';
    else if (total >= 31) riskLevel = 'medium';
    else riskLevel = 'low';

    const breakdown = {
      frequency: frequencyRisk,
      severity: severityRisk,
      pattern: patternRisk,
      compliance: complianceRisk,
    };

    const factors = identifyRiskFactors(breakdown, atoms);
    const recommendations = generateRecommendations(total, factors);

    const result: RiskScore = {
      total,
      breakdown,
      riskLevel,
      factors,
      recommendations,
      metadata: {
        atomsAnalyzed: atoms.length,
        timeWindow,
        region,
        toolId: options.toolId,
      },
    };

    // Log risk score calculation
    await supabase.from('agent_activities').insert({
      agent: 'orchestrator',
      action: 'score-risk',
      details: {
        result,
        user_id: user.id,
        timestamp: new Date().toISOString(),
      }
    });

    console.log('Risk score calculated:', {
      total,
      riskLevel,
      atomsAnalyzed: atoms.length
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Risk Scoring Error:", error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: 'Invalid input schema',
        details: error.issues
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
