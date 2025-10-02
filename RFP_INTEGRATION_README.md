# RFP/RFI Agentic Integration

This document describes the complete integration of RFP/RFI processing into the existing agentic workflow, maintaining the Policy → Submissions → Audit → Meta-Loop spine while adding native RFP capabilities.

## 🎯 Core Principles

1. **RFP/RFI = Policy Operationalization**: Treat each RFP/RFI as a policy distribution event that collects structured evidence from partners
2. **Meta-Loop Learning**: Every distribution, response, gap, and evaluation feeds recursive intelligence and improves policy templates
3. **Agent Reuse**: Leverage existing Context/Policy/Negotiation/Audit agents with minimal additions
4. **Native Integration**: RFP/RFI feels native to the platform, not a bolt-on application

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Enterprise    │───▶│  Policy Agent    │───▶│ Policy Version  │
│   Publishes     │    │  (Operationalize)│    │  vX.Y + RFP     │
│   Policy vX.Y   │    │                  │    │  Template       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Distribution  │◀───│ Policy Distrib.  │───▶│ Target Workspace│
│   (RFP/RFI)     │    │   System         │    │   (Partner)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Partner       │───▶│ RFP Response    │───▶│ Agent           │
│   Uploads RFI   │    │   Editor        │    │ Orchestration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Compliance    │◀───│ Context Agent    │───▶│ Knowledge Agent │
│   Scoring       │    │ (Route/Classify) │    │ (Retrieve)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Negotiation    │◀───│ Document Agent   │───▶│ Audit Agent     │
│   Agent          │    │ (Generate)       │    │ (Log Events)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Meta-Loop     │◀───│ Final Submission│───▶│ Proof Center    │
│   Learning       │    │   & Scoring      │    │ Analytics       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🤖 Agent Responsibilities

### ContextAgent
- **Role**: Classifies incoming distributions (RFP, RFI, policy addendum)
- **Function**: Extracts intent/urgency and routes to appropriate sub-flows
- **Integration**: Existing agent with RFP-specific routing logic

### PolicyAgent  
- **Role**: Converts applicable policy/version into requirements profile + clause set
- **Function**: "Operationalizes policy" for distribution
- **Integration**: Existing agent with RFP template generation

### KnowledgeAgent (Document/Retrieval Agent)
- **Role**: Pulls model cards/evidence from shared KB and client-scoped KB
- **Function**: Retrieves relevant evidence for RFP questions
- **Integration**: Existing agent with RFP-specific retrieval filters

### ComplianceScoringAgent
- **Role**: Evaluates each answer against policy version's scoring profile
- **Function**: Returns gaps + recommendations
- **Integration**: Existing agent with RFP-specific scoring profiles

### NegotiationAgent
- **Role**: Proposes acceptable mitigations when gaps are flagged
- **Function**: Suggests alt-wording to preserve compliance while remaining competitive
- **Integration**: Existing agent with RFP-specific negotiation strategies

### AuditAgent
- **Role**: Writes immutable events for distribution, generation, edits, and final submit
- **Function**: Emits aggregates for Proof Center dashboards
- **Integration**: Existing agent with RFP-specific event types

## 📊 Data Model Extensions

### Minimal Schema Additions

```sql
-- Optional: Persist parsed external RFI questions
CREATE TABLE rfp_question_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID REFERENCES policy_distributions(id),
  section TEXT,
  question_number INT,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('free_text','multiple_choice','yes_no','matrix')),
  required_evidence JSONB DEFAULT '[]'::jsonb,
  is_mandatory BOOLEAN DEFAULT true,
  ai_classification JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend existing tables
ALTER TABLE policies ADD COLUMN rfp_template_data JSONB;
ALTER TABLE policy_versions ADD COLUMN compliance_scoring_profile JSONB;
ALTER TABLE policy_distributions ADD COLUMN target_workspace_id UUID;
ALTER TABLE policy_distributions ADD COLUMN response_deadline TIMESTAMPTZ;
ALTER TABLE policy_distributions ADD COLUMN submission_status TEXT DEFAULT 'pending';

-- Unified submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  policy_version_id UUID REFERENCES policy_versions(id),
  distribution_id UUID REFERENCES policy_distributions(id),
  submission_type TEXT DEFAULT 'standard' CHECK (submission_type IN ('standard', 'rfp_response')),
  rfp_response_data JSONB,
  compliance_score INT,
  compliance_breakdown JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  draft_version INT DEFAULT 0,
  draft_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## ⚡ Edge Functions

### rfi_document_parser
- **Purpose**: Parse uploaded PDFs/XLSX into normalized RFP questions
- **Input**: Base64 file content, MIME type, workspace ID, distribution ID
- **Output**: Normalized questions array matching internal RFP schema
- **Security**: Runs as security definer with workspace validation

### rfp_score_response
- **Purpose**: Server-side scoring using ComplianceScoringAgent
- **Input**: Submission ID
- **Output**: Compliance score + breakdown + gaps
- **Security**: Service role with submission ownership validation

## 🔧 RPC Functions

### rpc_get_rfp_badges(workspace)
- **Purpose**: Get urgency badge counts (timezone-safe)
- **Returns**: `{new_count, due_soon_count, overdue_count}`
- **Performance**: Optimized with proper indexing

### bump_draft_version(submission_id, payload, if_match_version)
- **Purpose**: Autosave with version conflict detection
- **Returns**: Success or version conflict error
- **Features**: Prevents silent overwrites in multi-editor scenarios

### rpc_get_rfp_distributions(workspace)
- **Purpose**: Get RFP distributions with urgency levels
- **Returns**: Distribution details with computed urgency and days remaining

### rpc_get_submission_progress(distribution_id)
- **Purpose**: Get submission progress and completion stats
- **Returns**: Progress metrics and question completion status

## 🎨 UI Integration

### useRFPAgentOrchestration Hook
```javascript
const {
  loading,
  error,
  orchestrateRfpAnswer,
  parseRfiDocument,
  scoreRfpResponse,
  getUrgencyBadges,
  saveDraft,
  getRfpDistributions,
  getSubmissionProgress
} = useRFPAgentOrchestration();
```

### RFPResponseEditor Component
- **Features**: Question-by-question response generation
- **Integration**: Uses agent orchestration for intelligent answer generation
- **UX**: Real-time compliance scoring, evidence references, suggestions
- **Autosave**: Version-controlled draft saving with conflict detection

## 🔒 Security & RLS

### Row Level Security Policies
- **Partner Access**: Can view distributions targeted to their workspace
- **Submission Management**: Can create/update own RFP responses
- **Enterprise Access**: Can manage all submissions in their workspaces
- **Audit Trail**: All actions logged with immutable events

### Security Definer Functions
- **Edge Functions**: Run with service role but validate workspace ownership
- **RPC Functions**: Security definer with proper access controls
- **Data Isolation**: Enterprise-scoped data access throughout

## 📈 Performance Optimizations

### Database Indexes
```sql
-- Performance indexes for scale
CREATE INDEX idx_pd_target_deadline ON policy_distributions (target_workspace_id, response_deadline);
CREATE INDEX idx_submissions_workspace_type_status ON submissions (workspace_id, submission_type, status);
CREATE INDEX idx_rfp_questions_distribution ON rfp_question_library (distribution_id);
```

### Caching Strategy
- **Agent Results**: Cache agent responses for identical questions
- **Evidence Retrieval**: Cache knowledge base lookups
- **Compliance Scoring**: Cache scoring profiles and results

## 🚀 Deployment Guide

### 1. Database Migration
```bash
# Apply migrations
supabase db push

# Verify schema
psql $DATABASE_URL -c "\d submissions"
psql $DATABASE_URL -c "\d rfp_question_library"
```

### 2. Edge Functions Deployment
```bash
# Deploy edge functions
supabase functions deploy rfi_document_parser
supabase functions deploy rfp_score_response

# Test functions
curl -X POST https://your-project.functions.supabase.co/rfi_document_parser \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"file_b64":"...","file_mime":"application/pdf","workspace_id":"..."}'
```

### 3. Agent System Integration
```bash
# Ensure agent registry includes RFP capabilities
node agents/agent-registry.js

# Test orchestration
node test-rfp-integration.js
```

### 4. UI Integration
```bash
# Install React hook
npm install @supabase/supabase-js

# Import and use in components
import useRFPAgentOrchestration from './hooks/useRFPAgentOrchestration';
```

## 🧪 Testing

### Integration Test Suite
```bash
# Run comprehensive test suite
node test-rfp-integration.js

# Test specific components
npm test -- --grep "RFP"
```

### Test Coverage
- ✅ Database schema validation
- ✅ RLS policy enforcement
- ✅ RPC function correctness
- ✅ Edge function integration
- ✅ Agent orchestration flow
- ✅ UI component integration
- ✅ End-to-end workflow

## 📊 Monitoring & Analytics

### Proof Center Integration
- **RFP Evidence Tiles**: Response submission metrics
- **Gap Analysis**: Common compliance gaps across distributions
- **Time Metrics**: Average time to close RFP responses
- **Agent Performance**: Orchestration success rates and timing

### Meta-Loop Learning
- **Recurring Gaps**: → Policy Engine recommendations
- **Slow Steps**: → UX/process optimization suggestions  
- **Evidence Types**: → KB prompts and template improvements
- **Response Patterns**: → Policy template refinements

## 🔄 Workflow Examples

### Enterprise Publishes Policy → RFP Distribution
1. Enterprise publishes policy v2.1
2. PolicyAgent generates RFP template from policy
3. Distribution created with target workspaces
4. Partners receive notifications with deadlines

### Partner Responds to RFP
1. Partner uploads external RFI (optional)
2. rfi_document_parser normalizes questions
3. Partner opens RFP Response Editor
4. useRFPAgentOrchestration coordinates agent workflow:
   - ContextAgent routes question
   - KnowledgeAgent retrieves evidence
   - DocumentAgent generates draft
   - ComplianceScoringAgent evaluates
   - NegotiationAgent suggests improvements
   - AuditAgent logs activity
5. Partner reviews, edits, and submits
6. Final scoring and audit trail creation

### Meta-Loop Learning
1. System analyzes response patterns
2. Identifies recurring compliance gaps
3. Recommends policy template improvements
4. Updates scoring profiles based on outcomes
5. Enhances agent prompts and knowledge retrieval

## 🎯 Success Metrics

### Technical Metrics
- **Agent Orchestration Success Rate**: >95%
- **Response Generation Time**: <30 seconds per question
- **Compliance Scoring Accuracy**: Validated against manual review
- **System Uptime**: 99.9% availability

### Business Metrics
- **RFP Response Completion Rate**: >80%
- **Compliance Score Improvement**: Average 15% increase
- **Time to Response**: 50% reduction vs manual process
- **Partner Satisfaction**: >4.5/5 rating

## 🔮 Future Enhancements

### Phase 2: Advanced Features
- **Multi-language Support**: RFP processing in multiple languages
- **Advanced Document Parsing**: Support for complex RFP formats
- **Real-time Collaboration**: Multi-user RFP response editing
- **AI-Powered Negotiation**: Automated gap resolution suggestions

### Phase 3: Enterprise Features
- **Custom Scoring Profiles**: Enterprise-specific compliance criteria
- **Advanced Analytics**: Predictive compliance modeling
- **Integration APIs**: Third-party RFP system integration
- **Workflow Automation**: Automated RFP distribution and collection

---

## 📞 Support

For questions or issues with the RFP/RFI integration:

1. **Technical Issues**: Check the test suite output and agent logs
2. **Integration Questions**: Review the agent orchestration flow
3. **Performance Issues**: Monitor database indexes and RPC function performance
4. **Security Concerns**: Validate RLS policies and edge function security

The integration maintains the existing agentic architecture while adding powerful RFP/RFI capabilities that feel native to the platform.