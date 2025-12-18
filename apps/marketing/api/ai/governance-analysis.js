import dotenv from 'dotenv';
import { AIRouter } from './router.js';

// Load environment variables
dotenv.config();

const aiRouter = new AIRouter();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    requestType,
    content, 
    clientId,
    agencyId,
    riskLevel = 'HIGH',
    requestId,
    metadata = {}
  } = req.body;

  // Validate required fields
  if (!requestType || !content || !clientId) {
    return res.status(400).json({ 
      error: 'Missing required fields: requestType, content, clientId' 
    });
  }

  try {
    // Prepare governance analysis prompt
    const governancePrompt = createGovernancePrompt(requestType, content, metadata);

    // Get AI analysis
    const aiResult = await aiRouter.analyzeWithFallback(
      governancePrompt,
      'compliance_analysis',
      riskLevel
    );

    // Parse the governance decision
    const governanceDecision = parseGovernanceDecision(aiResult.analysis);

    // Determine if human review is required
    const requiresHumanReview = shouldRequireHumanReview(
      governanceDecision.recommendation,
      aiResult.confidence,
      riskLevel
    );

    // Prepare response
    const response = {
      requestId: requestId || generateRequestId(),
      decision: {
        recommendation: governanceDecision.recommendation,
        riskLevel: governanceDecision.riskLevel,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        concerns: governanceDecision.concerns,
        requirements: governanceDecision.requirements
      },
      aiProvider: aiResult.provider,
      requiresHumanReview,
      timestamp: new Date().toISOString(),
      status: requiresHumanReview ? 'pending_review' : 'auto_processed'
    };

    // TODO: Log to database (we'll implement this next)
    console.log('Governance decision generated:', response.decision.recommendation);

    res.status(200).json(response);

  } catch (error) {
    console.error('AI governance analysis failed:', error);
    
    // Fallback to human review when AI fails
    res.status(200).json({
      requestId: requestId || generateRequestId(),
      decision: {
        recommendation: 'MANUAL_REVIEW_REQUIRED',
        riskLevel: 'HIGH',
        confidence: 0,
        reasoning: 'AI analysis unavailable - manual review required',
        concerns: ['AI system temporarily unavailable'],
        requirements: ['Full manual compliance review required']
      },
      aiProvider: 'manual',
      requiresHumanReview: true,
      timestamp: new Date().toISOString(),
      status: 'ai_failure_manual_review'
    });
  }
}

function createGovernancePrompt(requestType, content, metadata) {
  const basePrompt = 'GOVERNANCE ANALYSIS REQUIRED for pharmaceutical enterprise AI usage:';
  
  const contextPrompt = {
    'agency_tool_request': 'AGENCY AI TOOL REQUEST: External agency requests approval to use AI tool.',
    'ai_content_submission': 'AI-GENERATED CONTENT SUBMISSION: Agency submits AI-created content for approval.',
    'vendor_audit': 'VENDOR AI USAGE AUDIT: Review of vendor AI tool usage for compliance.',
    'policy_violation_check': 'POLICY VIOLATION CHECK: Evaluate potential policy violations in AI usage.'
  };

  const analysisRequirements = 'Evaluate from pharmaceutical regulatory compliance perspective. Provide: 1) RECOMMENDATION (APPROVE/CONDITIONAL/REJECT/MANUAL_REVIEW_REQUIRED) 2) RISK_LEVEL (LOW/MEDIUM/HIGH/CRITICAL) 3) SPECIFIC_CONCERNS (list) 4) REQUIREMENTS (list of conditions/mitigations) 5) DETAILED_REASONING';

  return basePrompt + ' ' + (contextPrompt[requestType] || contextPrompt['policy_violation_check']) + ' CONTENT: ' + content + ' ' + analysisRequirements;
}

function parseGovernanceDecision(analysisText) {
  // Extract structured decision from AI response
  const recommendationMatch = analysisText.match(/RECOMMENDATION[:\s]+(APPROVE|CONDITIONAL|REJECT|MANUAL_REVIEW_REQUIRED)/i);
  const riskLevelMatch = analysisText.match(/RISK[_\s]*LEVEL[:\s]+(LOW|MEDIUM|HIGH|CRITICAL)/i);
  
  return {
    recommendation: recommendationMatch ? recommendationMatch[1].toUpperCase() : 'MANUAL_REVIEW_REQUIRED',
    riskLevel: riskLevelMatch ? riskLevelMatch[1].toUpperCase() : 'HIGH',
    concerns: extractListItems(analysisText, 'CONCERNS|Key Concerns'),
    requirements: extractListItems(analysisText, 'REQUIREMENTS|Recommendations')
  };
}

function extractListItems(text, sectionPattern) {
  const regex = new RegExp(sectionPattern + '[:\\s]*([\\s\\S]*?)(?=\\n\\n|\\n[A-Z][A-Z]|$)', 'i');
  const match = text.match(regex);
  
  // Safety check - if no match found, return empty array
  if (!match || !match[1]) return [];
  
  return match[1]
    .split(/\n|[0-9]+\.|[-•]/)  // Fixed the escaped characters
    .map(item => item.trim())
    .filter(item => item.length > 10)
    .slice(0, 5); // Limit to top 5 items
}

function shouldRequireHumanReview(recommendation, confidence, riskLevel) {
  // Always require human review for high-stakes decisions
  if (recommendation === 'REJECT' || recommendation === 'MANUAL_REVIEW_REQUIRED') return true;
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') return true;
  if (confidence < 0.7) return true;
  if (recommendation === 'CONDITIONAL') return true; // Conditional approvals need human oversight
  
  return false;
}

function generateRequestId() {
  return 'gov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}
