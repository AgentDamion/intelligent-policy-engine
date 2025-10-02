# RFP/RFI Integration Deployment Guide

This guide provides step-by-step instructions for deploying the agentic RFP/RFI integration into your existing Cursor agent system.

## 🚀 Quick Start

### Prerequisites
- Supabase project with existing agent system
- Node.js 18+ with ES modules support
- Access to Supabase CLI
- Existing agent registry and orchestration layer

### 1. Database Migration

```bash
# Apply the RFP schema extensions
supabase db push

# Verify the migration
psql $DATABASE_URL -c "\d submissions"
psql $DATABASE_URL -c "\d rfp_question_library"
```

### 2. Deploy Edge Functions

```bash
# Deploy the document parser
supabase functions deploy rfi_document_parser

# Deploy the scoring function
supabase functions deploy rfp_score_response

# Test the functions
curl -X POST https://your-project.functions.supabase.co/rfi_document_parser \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"file_b64":"...","file_mime":"application/pdf","workspace_id":"..."}'
```

### 3. Update Agent Registry

The agent registry has been updated to support ES modules. Ensure your existing agents are compatible:

```javascript
// agents/agent-registry.js
import { PolicyAgent } from './policy-agent.js';
import AuditAgent from './audit-agent.js';
// ... other imports

export default registry;
```

### 4. Deploy RFP Orchestrator

```bash
# Copy the orchestrator service
cp services/rfpOrchestrator.js /path/to/your/services/

# Update your agent coordinator to handle RFP requests
# Add this to your agent-coordinator endpoint:
if (request.kind === 'rfp_answer') {
  const orchestrator = new RFPOrchestrator();
  return await orchestrator.orchestrateRfpAnswer(request.payload);
}
```

### 5. UI Integration

```bash
# Install React hook
cp src/hooks/useRFPAgentOrchestration.js /path/to/your/src/hooks/

# Install React component
cp src/components/RFPResponseEditor.jsx /path/to/your/src/components/

# Update your navigation to include RFP under Requests & Submissions
```

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Agent Configuration
AGENT_COORDINATOR_URL=/api/agent-coordinator
```

### Database Configuration

Ensure your Supabase project has:
- Row Level Security enabled
- Service role key configured
- Edge functions enabled
- RPC functions enabled

## 📊 Testing

### 1. Database Schema Test

```sql
-- Test table access
SELECT * FROM submissions LIMIT 1;
SELECT * FROM rfp_question_library LIMIT 1;

-- Test RPC functions
SELECT * FROM rpc_get_rfp_badges('test-workspace-uuid');
SELECT * FROM rpc_get_rfp_distributions('test-workspace-uuid');
```

### 2. Edge Function Test

```bash
# Test document parser
curl -X POST https://your-project.functions.supabase.co/rfi_document_parser \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_b64": "VGVzdCBQREYgY29udGVudA==",
    "file_mime": "application/pdf",
    "workspace_id": "test-workspace-uuid",
    "distribution_id": null
  }'

# Test scoring function
curl -X POST https://your-project.functions.supabase.co/rfp_score_response \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"submission_id": "test-submission-uuid"}'
```

### 3. Agent Orchestration Test

```javascript
// Test the orchestrator
import { RFPOrchestrator } from './services/rfpOrchestrator.js';

const orchestrator = new RFPOrchestrator();

const result = await orchestrator.orchestrateRfpAnswer({
  question: {
    id: 'test-q1',
    question_text: 'Describe your AI governance framework.',
    question_type: 'free_text',
    section: 'Governance',
    question_number: 1,
    required_evidence: [{ type: 'document', hint: 'Governance policy' }],
    is_mandatory: true
  },
  workspaceId: 'test-workspace-uuid',
  enterpriseId: 'test-enterprise-uuid',
  policyVersionId: 'test-policy-version-uuid'
});

console.log('Orchestration result:', result);
```

## 🔒 Security Configuration

### Row Level Security Policies

The migration includes comprehensive RLS policies:

```sql
-- Partner can view distributions targeted to their workspace
CREATE POLICY "agency: read assigned distributions"
ON policy_distributions
FOR SELECT
USING (
  target_workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Partner can create rfp_response
CREATE POLICY "agency: create rfp response"
ON submissions
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
  AND submission_type = 'rfp_response'
);
```

### Edge Function Security

Edge functions run with service role but validate workspace ownership:

```typescript
// In edge functions
function assertAuth(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) throw new Response("Unauthorized", { status: 401 });
}

// Validate workspace access
const { workspace_id } = await req.json();
// Additional workspace validation logic
```

## 📈 Performance Optimization

### Database Indexes

The migration includes performance indexes:

```sql
-- Performance indexes for scale
CREATE INDEX idx_pd_target_deadline 
ON policy_distributions (target_workspace_id, response_deadline);

CREATE INDEX idx_submissions_workspace_type_status 
ON submissions (workspace_id, submission_type, status);

CREATE INDEX idx_rfp_questions_distribution 
ON rfp_question_library (distribution_id);
```

### Caching Strategy

Implement caching for:
- Agent responses for identical questions
- Knowledge base lookups
- Compliance scoring profiles

## 🚨 Troubleshooting

### Common Issues

1. **Agent Registry Import Errors**
   ```bash
   # Ensure all agent files use ES modules
   # Convert require() to import statements
   # Convert module.exports to export default
   ```

2. **Database Connection Issues**
   ```bash
   # Check Supabase URL and keys
   # Verify RLS policies are enabled
   # Test database access with psql
   ```

3. **Edge Function Deployment Issues**
   ```bash
   # Check Supabase CLI version
   # Verify function code syntax
   # Test function locally first
   ```

4. **RLS Policy Issues**
   ```sql
   -- Test RLS policies
   SET ROLE authenticated;
   SELECT * FROM submissions WHERE workspace_id = 'test-workspace';
   ```

### Debug Mode

Enable debug logging:

```javascript
// In orchestrator
console.log('RFP Orchestration Debug:', {
  question: question.question_text,
  workspaceId,
  enterpriseId,
  policyVersionId
});
```

## 📊 Monitoring

### Key Metrics to Monitor

1. **Agent Orchestration Success Rate**: >95%
2. **Response Generation Time**: <30 seconds per question
3. **Compliance Scoring Accuracy**: Validated against manual review
4. **System Uptime**: 99.9% availability

### Logging

Monitor these log events:
- `rfp.answer.drafted`
- `rfp.score.completed`
- `rfp.document.parsed`
- `rfp.submission.completed`

## 🔄 Maintenance

### Regular Tasks

1. **Monitor Agent Performance**
   - Check orchestration success rates
   - Review response generation times
   - Validate compliance scoring accuracy

2. **Database Maintenance**
   - Monitor index performance
   - Clean up old draft versions
   - Archive completed submissions

3. **Edge Function Updates**
   - Update document parsing logic
   - Improve scoring algorithms
   - Add new question types

### Backup Strategy

```bash
# Backup RFP data
pg_dump $DATABASE_URL --table=submissions --table=rfp_question_library > rfp_backup.sql

# Backup edge functions
supabase functions download rfi_document_parser
supabase functions download rfp_score_response
```

## 🎯 Success Criteria

### Technical Success
- ✅ All database migrations applied successfully
- ✅ Edge functions deployed and responding
- ✅ RPC functions working correctly
- ✅ Agent orchestration integrated
- ✅ UI components functional

### Business Success
- ✅ RFP response completion rate >80%
- ✅ Compliance score improvement >15%
- ✅ Time to response reduction >50%
- ✅ Partner satisfaction >4.5/5

## 📞 Support

For deployment issues:

1. **Check the logs**: Review agent orchestration logs
2. **Test components**: Use the test scripts provided
3. **Validate configuration**: Ensure all environment variables are set
4. **Review security**: Check RLS policies and edge function security

The integration maintains your existing agentic architecture while adding powerful RFP/RFI capabilities that feel native to the platform.