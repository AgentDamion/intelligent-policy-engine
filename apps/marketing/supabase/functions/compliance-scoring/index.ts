import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { initSentry, captureException, captureMessage } from '../_shared/sentry.ts';
import { initLogger, logInfo, logError, logWarn, measureTime } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize monitoring
await initSentry();
initLogger();

interface ComplianceScoringRequest {
  toolName: string;
  useCase: string;
  contentType?: string;
  userRole?: string;
  enterpriseId: string;
  regulations?: string[];
}

interface ComplianceScoringResponse {
  complianceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  regulatoryAnalysis: {
    cfr21Part11: { compliant: boolean; issues: string[] };
    gdpr: { compliant: boolean; issues: string[] };
    mlr: { compliant: boolean; issues: string[] };
    dataIntegrity: { compliant: boolean; issues: string[] };
  };
  requiredControls: string[];
  recommendations: string[];
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const endTiming = measureTime('compliance-scoring');
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const requestData = await req.json() as ComplianceScoringRequest;
    await logInfo(`Analyzing ${requestData.toolName} for compliance`, {
      enterpriseId: requestData.enterpriseId,
      toolName: requestData.toolName,
      useCase: requestData.useCase,
    });

    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      await logError('LOVABLE_API_KEY not configured', new Error('Missing LOVABLE_API_KEY'));
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate comprehensive compliance analysis prompt
    const analysisPrompt = generateComplianceAnalysisPrompt(requestData);
    
    // Call Lovable AI for regulatory analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a pharmaceutical compliance expert specializing in AI tool regulatory analysis. Provide detailed, structured analysis for each regulation.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const error = new Error(`AI analysis failed: ${aiResponse.status}`);
      await logError('AI analysis request failed', error, {
        status: aiResponse.status,
        enterpriseId: requestData.enterpriseId,
      });
      throw error;
    }

    const aiResult = await aiResponse.json();
    const rawAnalysis = aiResult.choices[0].message.content;

    // Process AI analysis into structured response
    const complianceResult = processComplianceAnalysis(rawAnalysis, requestData);

    // Store compliance analysis in database
    await supabaseClient.from('ai_agent_decisions').insert({
      agent: 'ComplianceScoringAgent',
      action: 'compliance_analysis',
      outcome: complianceResult.riskLevel === 'LOW' ? 'APPROVED' : 
               complianceResult.riskLevel === 'CRITICAL' ? 'REJECTED' : 'HUMAN_IN_LOOP',
      risk: complianceResult.riskLevel,
      enterprise_id: requestData.enterpriseId,
      details: {
        tool_name: requestData.toolName,
        use_case: requestData.useCase,
        compliance_score: complianceResult.complianceScore,
        regulatory_analysis: complianceResult.regulatoryAnalysis,
        required_controls: complianceResult.requiredControls,
        ai_analysis: rawAnalysis
      }
    });

    await logInfo('Compliance analysis completed', {
      enterpriseId: requestData.enterpriseId,
      toolName: requestData.toolName,
      complianceScore: complianceResult.complianceScore,
      riskLevel: complianceResult.riskLevel,
    });
    
    await endTiming();

    return new Response(JSON.stringify(complianceResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    await logError('Compliance scoring error', error instanceof Error ? error : new Error(String(error)), {
      function: 'compliance-scoring',
    });
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      function: 'compliance-scoring',
    });
    
    // Return fallback response
    const fallbackResponse: ComplianceScoringResponse = {
      complianceScore: 50,
      riskLevel: 'HIGH',
      regulatoryAnalysis: {
        cfr21Part11: { compliant: false, issues: ['Analysis failed - manual review required'] },
        gdpr: { compliant: false, issues: ['Analysis failed - manual review required'] },
        mlr: { compliant: false, issues: ['Analysis failed - manual review required'] },
        dataIntegrity: { compliant: false, issues: ['Analysis failed - manual review required'] }
      },
      requiredControls: ['manual_review', 'legal_consultation'],
      recommendations: ['Manual compliance review required due to analysis failure'],
      confidence: 0.1
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateComplianceAnalysisPrompt(request: ComplianceScoringRequest): string {
  return `Analyze this AI tool for pharmaceutical compliance:

**Tool Information:**
- Name: ${request.toolName}
- Use Case: ${request.useCase}
- Content Type: ${request.contentType || 'Not specified'}
- User Role: ${request.userRole || 'Not specified'}

**Required Regulatory Analysis:**

1. **21 CFR Part 11 (Electronic Records/Electronic Signatures)**
   - Does this tool handle electronic records that need FDA validation?
   - Are electronic signatures required and supported?
   - Is there proper audit trail capability?
   - Can the system prevent unauthorized access?

2. **GDPR/Privacy Compliance**
   - How does the tool handle personal data?
   - What data processing purposes are declared?
   - Are there adequate privacy controls?
   - Is there data subject rights support?

3. **MLR (Medical Legal Review) Requirements**
   - Does content require medical/legal review before use?
   - Are there claims validation requirements?
   - How are promotional materials controlled?
   - What approval workflows are needed?

4. **Data Integrity Controls**
   - Are there ALCOA+ controls (Attributable, Legible, Contemporaneous, Original, Accurate)?
   - How is data versioning handled?
   - What backup and recovery capabilities exist?
   - Are there change control procedures?

**Output Format:**
For each regulation, provide:
- Compliance status (compliant/non-compliant/partial)
- Specific issues or risks identified
- Required controls or mitigations
- Compliance score contribution (0-25 points each)

**Overall Assessment:**
- Total compliance score (0-100)
- Risk level classification
- Priority recommendations
- Required implementation controls`;
}

function processComplianceAnalysis(
  rawAnalysis: string, 
  request: ComplianceScoringRequest
): ComplianceScoringResponse {
  
  // Extract compliance scores and issues using pattern matching
  const cfrCompliance = analyzeCFRCompliance(rawAnalysis);
  const gdprCompliance = analyzeGDPRCompliance(rawAnalysis);
  const mlrCompliance = analyzeMLRCompliance(rawAnalysis);
  const dataIntegrityCompliance = analyzeDataIntegrityCompliance(rawAnalysis);

  // Calculate overall compliance score
  const complianceScore = Math.round(
    (cfrCompliance.score + gdprCompliance.score + mlrCompliance.score + dataIntegrityCompliance.score) / 4
  );

  // Determine risk level
  const riskLevel = determineRiskLevel(complianceScore, rawAnalysis);

  // Extract required controls and recommendations
  const requiredControls = extractRequiredControls(rawAnalysis);
  const recommendations = extractRecommendations(rawAnalysis);

  // Calculate confidence based on analysis quality
  const confidence = calculateAnalysisConfidence(rawAnalysis, request);

  return {
    complianceScore,
    riskLevel,
    regulatoryAnalysis: {
      cfr21Part11: cfrCompliance,
      gdpr: gdprCompliance,
      mlr: mlrCompliance,
      dataIntegrity: dataIntegrityCompliance
    },
    requiredControls,
    recommendations,
    confidence
  };
}

function analyzeCFRCompliance(analysis: string) {
  const cfrSection = extractSection(analysis, 'cfr|21 cfr|electronic record');
  const issues = extractIssues(cfrSection);
  const score = calculateSectionScore(cfrSection, ['audit trail', 'validation', 'signature']);
  
  return {
    compliant: score >= 70,
    issues: issues.length > 0 ? issues : score < 70 ? ['CFR compliance requirements not fully met'] : [],
    score
  };
}

function analyzeGDPRCompliance(analysis: string) {
  const gdprSection = extractSection(analysis, 'gdpr|privacy|personal data');
  const issues = extractIssues(gdprSection);
  const score = calculateSectionScore(gdprSection, ['privacy', 'consent', 'data subject']);
  
  return {
    compliant: score >= 70,
    issues: issues.length > 0 ? issues : score < 70 ? ['GDPR privacy requirements need attention'] : [],
    score
  };
}

function analyzeMLRCompliance(analysis: string) {
  const mlrSection = extractSection(analysis, 'mlr|medical legal|review|promotional');
  const issues = extractIssues(mlrSection);
  const score = calculateSectionScore(mlrSection, ['review', 'approval', 'medical']);
  
  return {
    compliant: score >= 70,
    issues: issues.length > 0 ? issues : score < 70 ? ['MLR review process requirements not satisfied'] : [],
    score
  };
}

function analyzeDataIntegrityCompliance(analysis: string) {
  const dataSection = extractSection(analysis, 'data integrity|alcoa|backup|versioning');
  const issues = extractIssues(dataSection);
  const score = calculateSectionScore(dataSection, ['integrity', 'backup', 'version']);
  
  return {
    compliant: score >= 70,
    issues: issues.length > 0 ? issues : score < 70 ? ['Data integrity controls require enhancement'] : [],
    score
  };
}

function extractSection(analysis: string, keywords: string): string {
  const keywordRegex = new RegExp(`(${keywords}).*?(?=\\n\\n|$)`, 'gis');
  const matches = analysis.match(keywordRegex);
  return matches ? matches.join(' ') : '';
}

function extractIssues(section: string): string[] {
  const issuePatterns = [
    /issue[s]?[:\-\s]*([^\.]+)/gi,
    /risk[s]?[:\-\s]*([^\.]+)/gi,
    /concern[s]?[:\-\s]*([^\.]+)/gi,
    /non[-\s]?compliant[:\-\s]*([^\.]+)/gi
  ];
  
  const issues: string[] = [];
  issuePatterns.forEach(pattern => {
    const matches = section.match(pattern);
    if (matches) {
      issues.push(...matches.map(m => m.replace(/^(issue|risk|concern|non-compliant)[s]?[:\-\s]*/i, '').trim()));
    }
  });
  
  return issues.filter(issue => issue.length > 10).slice(0, 3); // Top 3 most significant issues
}

function calculateSectionScore(section: string, positiveKeywords: string[]): number {
  if (!section) return 30; // Default score for missing analysis
  
  let score = 50; // Base score
  
  // Positive indicators
  positiveKeywords.forEach(keyword => {
    if (section.toLowerCase().includes(keyword)) score += 10;
  });
  
  // Negative indicators
  const negativeKeywords = ['non-compliant', 'missing', 'inadequate', 'risk', 'issue'];
  negativeKeywords.forEach(keyword => {
    if (section.toLowerCase().includes(keyword)) score -= 15;
  });
  
  // Positive compliance indicators
  if (section.toLowerCase().includes('compliant')) score += 20;
  if (section.toLowerCase().includes('adequate')) score += 15;
  if (section.toLowerCase().includes('meets requirements')) score += 25;
  
  return Math.max(0, Math.min(100, score));
}

function determineRiskLevel(score: number, analysis: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score < 30 || analysis.toLowerCase().includes('critical')) return 'CRITICAL';
  if (score < 50 || analysis.toLowerCase().includes('high risk')) return 'HIGH';
  if (score < 75 || analysis.toLowerCase().includes('medium risk')) return 'MEDIUM';
  return 'LOW';
}

function extractRequiredControls(analysis: string): string[] {
  const controlPatterns = [
    /control[s]?[:\-\s]*([^\.]+)/gi,
    /require[d|s]?[:\-\s]*([^\.]+)/gi,
    /implement[:\-\s]*([^\.]+)/gi,
    /mitigation[s]?[:\-\s]*([^\.]+)/gi
  ];
  
  const controls: string[] = [];
  controlPatterns.forEach(pattern => {
    const matches = analysis.match(pattern);
    if (matches) {
      controls.push(...matches.map(m => m.replace(/^(control|require|implement|mitigation)[s|d]?[:\-\s]*/i, '').trim()));
    }
  });
  
  // Add default controls based on keywords
  if (analysis.toLowerCase().includes('audit')) controls.push('audit_trail_required');
  if (analysis.toLowerCase().includes('approval')) controls.push('approval_workflow');
  if (analysis.toLowerCase().includes('review')) controls.push('manual_review');
  if (analysis.toLowerCase().includes('validation')) controls.push('validation_testing');
  
  return [...new Set(controls.filter(c => c.length > 5))].slice(0, 5);
}

function extractRecommendations(analysis: string): string[] {
  const recommendationPatterns = [
    /recommend[s|ed]?[:\-\s]*([^\.]+)/gi,
    /suggest[s|ed]?[:\-\s]*([^\.]+)/gi,
    /should[:\-\s]*([^\.]+)/gi
  ];
  
  const recommendations: string[] = [];
  recommendationPatterns.forEach(pattern => {
    const matches = analysis.match(pattern);
    if (matches) {
      recommendations.push(...matches.map(m => m.replace(/^(recommend|suggest|should)[s|ed]?[:\-\s]*/i, '').trim()));
    }
  });
  
  return [...new Set(recommendations.filter(r => r.length > 10))].slice(0, 3);
}

function calculateAnalysisConfidence(analysis: string, request: ComplianceScoringRequest): number {
  let confidence = 0.7; // Base confidence
  
  // Increase confidence based on analysis depth
  if (analysis.length > 1000) confidence += 0.1;
  if (analysis.toLowerCase().includes('cfr')) confidence += 0.05;
  if (analysis.toLowerCase().includes('gdpr')) confidence += 0.05;
  if (analysis.toLowerCase().includes('mlr')) confidence += 0.05;
  
  // Decrease confidence for generic responses
  if (analysis.length < 500) confidence -= 0.2;
  if (!request.contentType || request.contentType === 'Not specified') confidence -= 0.1;
  
  return Math.max(0.1, Math.min(0.95, confidence));
}