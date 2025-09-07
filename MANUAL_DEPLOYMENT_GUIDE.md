# Manual Deployment Guide for Compliance System

Since the Supabase CLI is not installed, here's a step-by-step manual deployment guide.

## Prerequisites

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

## Step 1: Deploy the Compliance Function

1. Navigate to your project directory:
   ```bash
   cd aicomplyr-intelligence
   ```

2. Deploy the compliance function:
   ```bash
   supabase functions deploy compliance_check_agent_activity
   ```

## Step 2: Run Database Migration

1. Apply the database migration:
   ```bash
   supabase db push
   ```

   Or manually run the SQL in your Supabase dashboard:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations/20250104000000_add_compliance_alerts_system.sql`
   - Run the SQL

## Step 3: Configure Compliance Check URL

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run this SQL (replace YOUR_PROJECT_URL with your actual project URL):
   ```sql
   ALTER DATABASE postgres SET app.compliance_check_url = 'https://YOUR_PROJECT_URL.supabase.co/functions/v1/compliance_check_agent_activity';
   ```

## Step 4: Create Sample Policies

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run this SQL to create sample policies:

```sql
-- First, get your organization ID
SELECT id FROM organizations_enhanced LIMIT 1;

-- Then create a sample policy (replace 'your-org-id' with the actual ID)
INSERT INTO policies_enhanced (
  organization_id,
  name,
  description,
  policy_rules,
  compliance_framework,
  status
) VALUES (
  'your-org-id', -- Replace with your organization ID
  'AI Content Compliance Policy',
  'Policy for AI-generated content compliance',
  '{
    "data_handling": {
      "requires_encryption": true,
      "requires_access_controls": true,
      "data_retention_limit": 90
    },
    "content_creation": {
      "no_medical_claims": true,
      "ai_disclosure_required": true,
      "balanced_presentation_required": true
    },
    "tool_approval": {
      "requires_approval": true,
      "verified_vendors_only": true,
      "approved_tools": ["OpenAI", "Anthropic", "Google"]
    }
  }',
  'FDA',
  'active'
);

-- Create policy rules
INSERT INTO policy_rules (
  policy_id,
  rule_type,
  rule_name,
  conditions,
  requirements,
  risk_weight,
  is_mandatory,
  enforcement_level
) VALUES 
(
  (SELECT id FROM policies_enhanced WHERE name = 'AI Content Compliance Policy'),
  'data_handling',
  'Sensitive Data Encryption',
  '{"data_types": ["patient_data", "medical_records"]}',
  '{"requires_encryption": true}',
  8,
  true,
  'strict'
),
(
  (SELECT id FROM policies_enhanced WHERE name = 'AI Content Compliance Policy'),
  'content_creation',
  'AI Disclosure Requirement',
  '{"agent_types": ["ai", "generator"]}',
  '{"ai_disclosure_required": true}',
  6,
  true,
  'strict'
),
(
  (SELECT id FROM policies_enhanced WHERE name = 'AI Content Compliance Policy'),
  'tool_approval',
  'Approved Tools Only',
  '{"activity_types": ["generate", "process"]}',
  '{"requires_approval": true, "approved_tools": ["OpenAI", "Anthropic"]}',
  9,
  true,
  'strict'
);
```

## Step 5: Test the System

1. Run the test script:
   ```bash
   node test-compliance-system.js
   ```

2. Or test manually by inserting an agent activity:
   ```bash
   curl -X POST "https://YOUR_PROJECT_URL.supabase.co/functions/v1/ingest_agent_activity" \
     -H "Content-Type: application/json" \
     -H "X-Agent-Key: YOUR_AGENT_KEY" \
     -d '{
       "agent": "test-agent",
       "action": "generate_content",
       "status": "success",
       "details": {
         "ai_generated": true,
         "ai_disclosed": false
       }
     }'
   ```

## Step 6: Verify Everything Works

1. **Check function logs**:
   ```bash
   supabase functions logs compliance_check_agent_activity
   ```

2. **Check alerts table**:
   ```sql
   SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10;
   ```

3. **Check compliance checks**:
   ```sql
   SELECT * FROM compliance_checks ORDER BY check_date DESC LIMIT 10;
   ```

4. **Check audit logs**:
   ```sql
   SELECT * FROM audit_logs_enhanced 
   WHERE action LIKE '%compliance%' 
   ORDER BY created_at DESC LIMIT 10;
   ```

## Troubleshooting

### Function Not Deploying
- Check that you're in the correct directory
- Verify the function file exists at `aicomplyr-intelligence/supabase/functions/compliance_check_agent_activity/index.ts`
- Check your Supabase CLI version: `supabase --version`

### Database Migration Failing
- Check that you have the necessary permissions
- Verify the migration file exists
- Check for any syntax errors in the SQL

### Compliance Checks Not Running
- Verify the compliance check URL is set correctly
- Check the database trigger is installed
- Review function logs for errors

### No Alerts Generated
- Verify policies are active and properly configured
- Check that agent activities have the required fields
- Review the compliance function logs

## Next Steps

After successful deployment:

1. **Integrate with Frontend**: Add the ComplianceDashboard component to your React app
2. **Set up Monitoring**: Configure alerts for compliance violations
3. **Create More Policies**: Add enterprise-specific compliance rules
4. **Train Users**: Educate users on the compliance system
5. **Monitor Performance**: Track compliance metrics and system performance

## Support

If you encounter issues:

1. Check the function logs for detailed error messages
2. Verify all database tables and triggers are created correctly
3. Test with the provided test script
4. Review the implementation guide for detailed explanations

The compliance system is now ready to automatically monitor and validate agent activities against your enterprise policies!
