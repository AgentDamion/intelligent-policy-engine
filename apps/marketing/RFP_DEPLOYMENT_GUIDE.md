# RFP/RFI Integration Deployment Guide

This guide walks you through deploying the complete RFP/RFI Agentic Integration to your Supabase project.

## Prerequisites

- Supabase CLI installed and configured
- Access to your Supabase project
- Node.js and npm/yarn installed
- Existing intelligent policy engine setup

## Step 1: Deploy Database Migrations

### 1.1 Apply the RFP Schema Migration

```bash
# Navigate to your project directory
cd intelligent-policy-engine

# Apply the minimal RFP schema migration
supabase db push --file supabase/migrations/20250102000000_rfp_minimal.sql

# Apply the RPC functions migration
supabase db push --file supabase/migrations/20250102000001_rpc_badges.sql
```

### 1.2 Verify Migration Success

```bash
# Check that tables were created
supabase db diff

# Verify RPC functions are available
supabase db reset --debug
```

Expected output should show:
- `submissions` table created
- `rfp_question_library` table created
- RPC functions: `rpc_get_rfp_badges`, `bump_draft_version`, `rpc_get_rfp_distributions`, `rpc_get_submission_progress`

## Step 2: Deploy Edge Functions

### 2.1 Deploy RFI Document Parser

```bash
# Deploy the document parser function
supabase functions deploy rfi_document_parser

# Verify deployment
supabase functions list
```

### 2.2 Deploy RFP Score Response

```bash
# Deploy the scoring function
supabase functions deploy rfp_score_response

# Verify deployment
supabase functions list
```

### 2.3 Test Edge Functions

```bash
# Test the document parser (replace with your actual values)
curl -X POST 'https://your-project.supabase.co/functions/v1/rfi_document_parser' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "file_url": "https://example.com/test.pdf",
    "file_type": "application/pdf",
    "organization_id": "your-org-id"
  }'

# Test the scoring function
curl -X POST 'https://your-project.supabase.co/functions/v1/rfp_score_response' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "submission_id": "test-submission-id",
    "question_id": "test-question-id",
    "response_text": "Test response",
    "organization_id": "your-org-id"
  }'
```

## Step 3: Install Dependencies

### 3.1 Install Required NPM Packages

```bash
# Install Supabase client if not already installed
npm install @supabase/supabase-js

# Install any additional dependencies for the React components
npm install react react-dom
```

### 3.2 Update Environment Variables

Add these to your `.env` file:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Integrate React Components

### 4.1 Copy Component Files

Ensure these files are in your project:
- `src/hooks/useRFPAgentOrchestration.js`
- `src/components/RFPResponseEditor.jsx`
- `services/rfpOrchestrator.js`

### 4.2 Update Your App

Add the RFP components to your main application:

```jsx
// In your main App.jsx or similar
import RFPResponseEditor from './components/RFPResponseEditor';
import useRFPAgentOrchestration from './hooks/useRFPAgentOrchestration';

function App() {
  const { loadDashboard, dashboard } = useRFPAgentOrchestration(orgId, userId);
  
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  
  return (
    <div>
      {/* Your existing app content */}
      <RFPResponseEditor
        organizationId={orgId}
        userId={userId}
        question={selectedQuestion}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
```

## Step 5: Test the Integration

### 5.1 Create Test Script

Create `test-rfp-integration.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testRFPIntegration() {
  console.log('Testing RFP Integration...');
  
  try {
    // Test 1: Create a test submission
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .insert({
        organization_id: 'test-org-id',
        submission_type: 'rfp_response',
        title: 'Test RFP Response',
        rfi_id: 'test-rfi-123',
        question_id: 'test-q-123',
        response_text: 'This is a test response',
        status: 'draft'
      })
      .select()
      .single();
    
    if (subError) throw subError;
    console.log('✓ Test submission created:', submission.id);
    
    // Test 2: Test RPC function
    const { data: badges, error: badgeError } = await supabase
      .rpc('rpc_get_rfp_badges', {
        p_organization_id: 'test-org-id',
        p_timezone: 'UTC'
      });
    
    if (badgeError) throw badgeError;
    console.log('✓ RPC badges function working');
    
    // Test 3: Test progress tracking
    const { data: progress, error: progressError } = await supabase
      .rpc('rpc_get_submission_progress', {
        p_organization_id: 'test-org-id',
        p_submission_type: 'rfp_response'
      });
    
    if (progressError) throw progressError;
    console.log('✓ Progress tracking working:', progress);
    
    console.log('🎉 All tests passed! RFP integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRFPIntegration();
```

### 5.2 Run Tests

```bash
# Run the integration test
node test-rfp-integration.js
```

## Step 6: Configure Agent Registry

### 6.1 Update Agent Registry

Ensure your existing agent registry can provide agents to the RFP Orchestrator:

```javascript
// In your agent registry
class AgentRegistry {
  constructor() {
    this.agents = new Map();
  }
  
  registerAgent(name, agent) {
    this.agents.set(name, agent);
  }
  
  getAgent(name) {
    return this.agents.get(name);
  }
  
  // Initialize with existing agents
  async initialize() {
    // Register your existing agents
    this.registerAgent('context-agent', new ContextAgent());
    this.registerAgent('policy-agent', new PolicyAgent());
    this.registerAgent('knowledge-agent', new KnowledgeAgent());
    this.registerAgent('compliance-scoring-agent', new ComplianceScoringAgent());
    this.registerAgent('negotiation-agent', new NegotiationAgent());
    this.registerAgent('audit-agent', new AuditAgent());
  }
}
```

### 6.2 Initialize RFP Orchestrator

```javascript
// In your main application
import RFPOrchestrator from './services/rfpOrchestrator';

const agentRegistry = new AgentRegistry();
await agentRegistry.initialize();

const rfpOrchestrator = new RFPOrchestrator(supabaseUrl, supabaseKey);
await rfpOrchestrator.initialize(agentRegistry);
```

## Step 7: Monitor and Validate

### 7.1 Check Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Database → Tables
3. Verify `submissions` and `rfp_question_library` tables exist
4. Check that RLS policies are enabled

### 7.2 Test Edge Functions

1. Go to Edge Functions in your Supabase dashboard
2. Verify `rfi_document_parser` and `rfp_score_response` are deployed
3. Check function logs for any errors

### 7.3 Validate RPC Functions

```sql
-- Test in Supabase SQL Editor
SELECT rpc_get_rfp_badges('your-org-id', 'UTC');
SELECT rpc_get_submission_progress('your-org-id', 'rfp_response');
```

## Troubleshooting

### Common Issues

#### 1. Migration Fails
```bash
# Check current schema
supabase db diff

# Reset and try again
supabase db reset
supabase db push
```

#### 2. Edge Functions Not Deploying
```bash
# Check Supabase CLI version
supabase --version

# Update if needed
npm install -g supabase

# Redeploy functions
supabase functions deploy rfi_document_parser --no-verify-jwt
supabase functions deploy rfp_score_response --no-verify-jwt
```

#### 3. RLS Policies Blocking Access
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('submissions', 'rfp_question_library');
```

#### 4. Agent Initialization Fails
- Verify agent registry is properly configured
- Check that all required agents are registered
- Ensure agent methods match expected interface

### Debug Commands

```bash
# Check function logs
supabase functions logs rfi_document_parser --follow
supabase functions logs rfp_score_response --follow

# Test database connection
supabase db ping

# Verify project status
supabase status
```

## Success Criteria

✅ Database migrations applied successfully  
✅ Edge functions deployed and responding  
✅ RPC functions working correctly  
✅ React components integrated  
✅ Agent orchestration initialized  
✅ RLS policies protecting data  
✅ Test scripts passing  

## Next Steps

1. **Customize**: Adapt the components to your specific UI/UX needs
2. **Extend**: Add additional RFP question types or scoring criteria
3. **Monitor**: Set up logging and analytics for RFP workflows
4. **Scale**: Optimize for your expected load and usage patterns

## Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review Supabase logs for specific error messages
3. Verify all environment variables are correctly set
4. Ensure your existing agent system is compatible

The RFP integration is designed to be robust and maintainable while adding powerful new capabilities to your intelligent policy engine!




