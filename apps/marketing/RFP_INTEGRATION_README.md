# RFP/RFI Agentic Integration

This document describes the complete RFP/RFI integration that adds powerful document parsing and agent orchestration capabilities to the intelligent policy engine while maintaining the existing architecture.

## Overview

The RFP integration is designed to be **agent-first** and **native to the platform**. It reuses existing agents, maintains the Policy → Submissions → Audit → Meta-Loop spine, and adds just the missing document parser capability to transform third-party RFIs into first-class, agent-answerable units.

## Architecture

### Core Components

1. **Edge Functions** - Server-side processing
2. **Database Schema** - Minimal extensions to existing tables
3. **RPC Functions** - Timezone-safe operations and conflict detection
4. **Agent Orchestration** - Coordinates existing agents
5. **React Integration** - UI components and hooks

### Agent Responsibilities

- **ContextAgent**: Routes and classifies RFP questions
- **PolicyAgent**: Converts policies into RFP requirements profiles
- **KnowledgeAgent**: Retrieves evidence from shared KB
- **ComplianceScoringAgent**: Evaluates answers against policy profiles
- **NegotiationAgent**: Proposes mitigations for compliance gaps
- **AuditAgent**: Logs all RFP activities for Meta-Loop learning

## Files Created

### Edge Functions
- `supabase/functions/rfi_document_parser/index.ts` - Parses uploaded PDFs/XLSX into normalized RFP questions
- `supabase/functions/rfp_score_response/index.ts` - Server-side scoring using ComplianceScoringAgent

### Database Migrations
- `supabase/migrations/20250102000000_rfp_minimal.sql` - Minimal schema extensions
- `supabase/migrations/20250102000001_rpc_badges.sql` - RPC functions for badges and management

### Services & Integration
- `services/rfpOrchestrator.js` - RFPOrchestrator service that coordinates existing agents
- `src/hooks/useRFPAgentOrchestration.js` - React hook for UI integration
- `src/components/RFPResponseEditor.jsx` - RFPResponseEditor component demonstrating the integration

## Key Features

### 🤖 Agent-First Design
- Reuses existing Context/Policy/Negotiation/Audit agents
- No duplicate intelligence in UI
- Maintains the Policy → Submissions → Audit → Meta-Loop spine

### 🔒 Security & Scale
- Row Level Security throughout
- Performance indexes for scale
- Version conflict detection for multi-editor scenarios
- Enterprise-scoped data isolation

### 📊 Native Integration
- RFP/RFI feels native to the platform
- Feeds into existing Proof Center analytics
- Supports Meta-Loop learning from RFP patterns
- Maintains audit trail and compliance scoring

## Database Schema

### New Tables

#### `submissions`
Unified table for RFP responses and standard submissions:
```sql
- id (UUID, Primary Key)
- organization_id (UUID, Foreign Key)
- submission_type (ENUM: 'rfp_response', 'standard_response', 'compliance_submission')
- title (VARCHAR)
- description (TEXT)
- status (ENUM: 'draft', 'in_review', 'approved', 'submitted', 'rejected')
- rfi_id (VARCHAR) -- RFP-specific
- question_id (VARCHAR) -- RFP-specific
- response_text (TEXT) -- RFP-specific
- scoring_results (JSONB) -- RFP-specific
- policy_id (UUID) -- Standard response
- policy_version_id (UUID) -- Standard response
- created_by, updated_by, created_at, updated_at
```

#### `rfp_question_library`
Optional table for parsed external RFIs:
```sql
- id (UUID, Primary Key)
- organization_id (UUID, Foreign Key)
- rfi_id (VARCHAR)
- title (VARCHAR)
- organization (VARCHAR)
- due_date (TIMESTAMP)
- questions (JSONB)
- metadata (JSONB)
- created_at, updated_at
```

### RPC Functions

- `rpc_get_rfp_badges(organization_id, timezone)` - Timezone-safe urgency badges
- `bump_draft_version(submission_id, organization_id, user_id, content)` - Autosave with conflict detection
- `rpc_get_rfp_distributions(organization_id, status_filter)` - Distribution management
- `rpc_get_submission_progress(organization_id, submission_type)` - Progress tracking

## Usage Examples

### Processing an RFP Question

```javascript
import useRFPAgentOrchestration from './hooks/useRFPAgentOrchestration';

const MyComponent = () => {
  const { processRFPQuestion, isLoading, error } = useRFPAgentOrchestration(orgId, userId);
  
  const handleProcessQuestion = async (question) => {
    const result = await processRFPQuestion(question);
    if (result.success) {
      console.log('Submission created:', result.submissionId);
    }
  };
  
  // ... rest of component
};
```

### Using the RFP Response Editor

```jsx
import RFPResponseEditor from './components/RFPResponseEditor';

const RFPPage = () => {
  const question = {
    id: 'q_123',
    question_text: 'What is your data security policy?',
    category: 'Security',
    priority: 'high',
    requirements: ['SOC 2 compliance', 'Data encryption']
  };
  
  return (
    <RFPResponseEditor
      organizationId={orgId}
      userId={userId}
      question={question}
      onSave={(submissionId) => console.log('Saved:', submissionId)}
      onCancel={() => console.log('Cancelled')}
    />
  );
};
```

### Scoring a Response

```javascript
const { scoreRFPResponse } = useRFPAgentOrchestration(orgId, userId);

const handleScore = async (submissionId, responseText) => {
  const result = await scoreRFPResponse(submissionId, responseText);
  if (result.success) {
    console.log('Score:', result.scoringResult.percentage);
    console.log('Gaps:', result.scoringResult.compliance_gaps);
  }
};
```

## API Endpoints

### Edge Functions

#### POST `/functions/v1/rfi_document_parser`
Parse uploaded documents into RFP questions.

**Request:**
```json
{
  "file_url": "https://example.com/rfi.pdf",
  "file_type": "application/pdf",
  "organization_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "rfi_id": "rfi_123",
  "parsed_data": {
    "title": "Security RFP",
    "questions": [...]
  }
}
```

#### POST `/functions/v1/rfp_score_response`
Score an RFP response using ComplianceScoringAgent.

**Request:**
```json
{
  "submission_id": "uuid",
  "question_id": "q_123",
  "response_text": "Our security policy includes...",
  "organization_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "scoring_result": {
    "score": 85,
    "max_score": 100,
    "percentage": 85,
    "feedback": ["✓ Addressed: SOC 2 compliance"],
    "compliance_gaps": ["Data encryption"],
    "recommendations": ["Consider addressing: Data encryption"]
  }
}
```

## Security

- All tables have Row Level Security (RLS) enabled
- Users can only access data within their organization
- All RPC functions are security definer with proper authorization
- Edge functions validate organization membership
- Auto-save includes conflict detection to prevent data loss

## Performance

- Indexes on frequently queried columns
- JSONB for flexible metadata storage
- Efficient RPC functions for dashboard data
- Debounced auto-save to reduce database load

## Monitoring & Analytics

- All RFP activities are logged in `agent_activities` table
- Supports Meta-Loop learning from RFP patterns
- Feeds into existing Proof Center analytics
- Comprehensive audit trail for compliance

## Next Steps

1. **Deploy**: Follow the deployment guide to apply migrations and deploy edge functions
2. **Test**: Use the test scripts to validate the integration
3. **Integrate**: Add the React components to your UI
4. **Monitor**: Track the success metrics outlined in the documentation

## Troubleshooting

### Common Issues

1. **Edge functions not deploying**: Check Supabase CLI configuration
2. **RLS policies blocking access**: Verify user organization membership
3. **Auto-save conflicts**: Implement proper conflict resolution UI
4. **Agent initialization failures**: Check agent registry configuration

### Debug Commands

```bash
# Check edge function logs
supabase functions logs rfi_document_parser
supabase functions logs rfp_score_response

# Test RPC functions
supabase db reset
supabase db seed

# Validate migrations
supabase db diff
```

This integration maintains your existing architecture while adding powerful RFP/RFI capabilities that feel native to the platform!




