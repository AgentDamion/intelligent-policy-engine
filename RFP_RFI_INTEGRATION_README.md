# RFP/RFI Agentic Integration

This document describes the complete RFP/RFI integration that builds on your existing Cursor agents, preserving the Policy→Submission→Audit→Meta-Loop architecture while adding native RFP/RFI capabilities.

## 🎯 Core Principles

1. **RFP/RFI = Policy Operationalization**: Treat each RFP/RFI as a policy distribution event that collects structured evidence from partners
2. **Meta-Loop Learning**: Every distribution, response, gap, and evaluation feeds recursive intelligence and improves policy templates
3. **Agent Reuse**: Leverage existing Context/Policy/Negotiation/Audit agents with minimal additions
4. **Native Integration**: RFP/RFI stays within the submissions spine, not as a bolt-on app

## 🏗️ Architecture Overview

### Agent Responsibilities

- **ContextAgent**: Classifies incoming distributions (RFP, RFI, policy addendum), extracts intent/urgency
- **PolicyAgent**: Converts applicable policy/version into requirements profile + clause set
- **KnowledgeAgent**: Pulls model cards/evidence from shared KB and client-scoped KB
- **ComplianceScoringAgent**: Evaluates answers against policy version's scoring profile
- **NegotiationAgent**: Proposes mitigations for compliance gaps
- **AuditAgent**: Writes immutable events for distribution, generation, edits, and final submit

### Data Flow

```
Enterprise publishes policy vX.Y → "Distribute as RFP/RFI"
↓
PolicyAgent emits RFP profile (sections, required evidence, weights)
↓
RFI/RFP Parser normalizes external documents to internal schema
↓
Partner opens RFP Response Editor
↓
useRFPAgentOrchestration breaks into unit tasks:
  Retrieval → draft → self-score → gap/negotiation → save/submit
↓
Each step logs to AuditAgent; telemetry rolls up to Proof Center
↓
Meta-Loop consumes results for continuous improvement
```

## 📁 File Structure

```
supabase/
├── functions/
│   ├── rfi_document_parser/index.ts     # PDF/XLSX parsing
│   └── rfp_score_response/index.ts      # Compliance scoring
├── migrations/
│   ├── 20251002_rfp_minimal.sql         # Core table extensions
│   ├── 20251002_rpc_badges.sql          # Urgency badges
│   └── 20251002_autosave_versioning.sql # Draft versioning
services/
└── rfpOrchestrator.ts                   # UI-side agent coordination
test-rfp-integration.js                  # Comprehensive test suite
```

## 🚀 Quick Start

### 1. Deploy Edge Functions

```bash
# Deploy the document parser
supabase functions deploy rfi_document_parser

# Deploy the scoring function
supabase functions deploy rfp_score_response
```

### 2. Run Migrations

```bash
# Apply database migrations
supabase db push
```

### 3. Test Integration

```bash
# Run comprehensive test suite
node test-rfp-integration.js
```

## 📊 Database Schema

### Core Extensions

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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Extend submissions table
ALTER TABLE submissions ADD COLUMN submission_type TEXT DEFAULT 'standard';
ALTER TABLE submissions ADD COLUMN draft_version INT DEFAULT 0;
ALTER TABLE submissions ADD COLUMN draft_updated_at TIMESTAMPTZ;
```

### RLS Policies

```sql
-- Partner can view distributions targeted to their workspace
CREATE POLICY "agency: read assigned distributions"
ON policy_distributions FOR SELECT
USING (target_workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

-- Partner can create rfp_response
CREATE POLICY "agency: create rfp response"
ON submissions FOR INSERT
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  AND submission_type = 'rfp_response'
);
```

## 🔧 API Usage

### Parse RFI Document

```typescript
import { parseRFIDocument } from './services/rfpOrchestrator';

const file = event.target.files[0];
const result = await parseRFIDocument(file, workspaceId, distributionId);
// Returns: { ok: true, insertedIds: string[], result: ParseResult }
```

### Score RFP Response

```typescript
import { scoreRFPResponse } from './services/rfpOrchestrator';

const result = await scoreRFPResponse(submissionId);
// Returns: { ok: true, breakdown: ScoreBreakdown }
```

### Get Urgency Badges

```typescript
import { getRFPBadges } from './services/rfpOrchestrator';

const badges = await getRFPBadges(workspaceId);
// Returns: { new_count: number, due_soon_count: number, overdue_count: number }
```

### Autosave with Versioning

```typescript
import { saveRFPResponseDraft } from './services/rfpOrchestrator';

try {
  await saveRFPResponseDraft(submissionId, payload, currentVersion);
} catch (error) {
  if (error.message === 'VERSION_CONFLICT') {
    // Handle version conflict - prompt user to merge changes
  }
}
```

## 🤖 Agent Orchestration

### Complete RFP Answer Generation

```typescript
import { useRFPAgentOrchestration } from './services/rfpOrchestrator';

const result = await useRFPAgentOrchestration({
  question: {
    id: 'q1',
    question_text: 'Describe your AI governance framework',
    section: 'Governance',
    question_type: 'free_text',
    required_evidence: [{ type: 'document', hint: 'Governance policy' }],
    is_mandatory: true
  },
  workspaceId: 'workspace-123',
  enterpriseId: 'enterprise-456',
  policyVersionId: 'policy-v1.2'
});

// Returns:
// {
//   draft: "Our AI governance framework includes...",
//   evidenceRefs: [...],
//   evaluation: { score: 88, gaps: [...], breakdown: {...} },
//   suggestions: [...],
//   context: {...}
// }
```

## 🔒 Security & Scale

### Row Level Security (RLS)
- All tables have RLS enabled
- Edge functions run as security definer but filter by workspace_id/distribution_id
- Partners can only access their assigned distributions and responses

### Performance Indexes
```sql
-- Optimize for common queries
CREATE INDEX idx_pd_target_deadline ON policy_distributions (target_workspace_id, response_deadline);
CREATE INDEX idx_submissions_workspace_type_status ON submissions (workspace_id, submission_type, status);
```

### Autosave Versioning
- Prevents silent overwrites in multi-editor scenarios
- Uses optimistic locking with version numbers
- Handles version conflicts gracefully

## 🧪 Testing

### Run Test Suite

```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run tests
node test-rfp-integration.js
```

### Test Coverage

- ✅ Database setup and schema validation
- ✅ Edge function deployment and execution
- ✅ RPC function functionality
- ✅ Agent orchestration structure
- ✅ End-to-end workflow validation

## 🎨 UI Integration

### Information Architecture
- Show RFP as subgroup under "Requests & Submissions"
- Reinforce shared submission spine
- Add RFP Evidence tiles to Enterprise dashboard

### Proof Lens Integration
- RFP Evidence tiles alongside Policy/Audit metrics
- Response submission counts, gap classes, average time to close
- Feed Proof Center narrative

## 🔄 Meta-Loop Integration

### Continuous Learning
- Recurring gaps → Policy Engine recommendations
- Recurring slow steps → UX/process suggestions  
- Recurring evidence types → KB prompts/templates

### Analytics Feed
- Distribution patterns
- Response quality trends
- Compliance score distributions
- Time-to-completion metrics

## 🚨 Troubleshooting

### Common Issues

1. **Edge Function Deployment Fails**
   ```bash
   # Check Supabase CLI version
   supabase --version
   
   # Redeploy with verbose logging
   supabase functions deploy rfi_document_parser --debug
   ```

2. **RLS Policy Errors**
   ```sql
   -- Check if policies exist
   SELECT * FROM pg_policies WHERE tablename = 'submissions';
   
   -- Verify user permissions
   SELECT * FROM workspace_members WHERE user_id = auth.uid();
   ```

3. **Version Conflicts in Autosave**
   ```typescript
   // Handle gracefully in UI
   try {
     await saveRFPResponseDraft(submissionId, payload, currentVersion);
   } catch (error) {
     if (error.message === 'VERSION_CONFLICT') {
       // Show merge dialog to user
       showMergeDialog(localChanges, serverChanges);
     }
   }
   ```

## 📈 Performance Considerations

### Optimization Strategies
- Use indexes for common query patterns
- Implement pagination for large result sets
- Cache policy templates and scoring profiles
- Batch audit events for better performance

### Monitoring
- Track edge function execution times
- Monitor database query performance
- Alert on high error rates
- Track user engagement metrics

## 🔮 Future Enhancements

### Planned Features
- Advanced document parsing with OCR
- Real-time collaboration on responses
- AI-powered response suggestions
- Integration with external RFP platforms
- Advanced analytics and reporting

### Extension Points
- Custom scoring profiles per industry
- Pluggable document parsers
- Custom audit event handlers
- Integration with external compliance tools

---

## 📞 Support

For questions or issues with the RFP/RFI integration:

1. Check the test suite output for specific failures
2. Review the Supabase logs for edge function errors
3. Verify RLS policies are correctly configured
4. Ensure all required environment variables are set

The integration is designed to be robust and self-healing, with comprehensive error handling and graceful degradation when services are unavailable.