# Compliance Checking System - Implementation Guide

This guide walks you through implementing the automated compliance checking system that validates agent activities against enterprise policies and generates alerts for violations.

## 🎯 **What We've Built**

### **Core Components**

1. **Compliance Check Function** (`compliance_check_agent_activity/index.ts`)
   - Supabase Edge Function that validates agent activities
   - Supports multiple rule types: data handling, content creation, tool approval, disclosure, risk assessment
   - Generates alerts for violations with severity levels
   - Logs comprehensive audit trails

2. **Database Migration** (`20250104000000_add_compliance_alerts_system.sql`)
   - Creates `alerts` table for compliance violations
   - Creates `compliance_reports` table for storing results
   - Adds database trigger for automatic compliance checking
   - Includes RLS policies for security

3. **Frontend Components** (`ComplianceDashboard.tsx`)
   - React component for viewing compliance status
   - Alert management interface
   - Compliance metrics display

4. **Deployment Scripts**
   - PowerShell script for easy deployment
   - Test script for verification

## 🚀 **Step-by-Step Implementation**

### **Step 1: Deploy the Compliance Function**

```bash
# Navigate to your project directory
cd aicomplyr-intelligence

# Deploy the compliance function
supabase functions deploy compliance_check_agent_activity
```

### **Step 2: Run Database Migration**

```bash
# Apply the database migration
supabase db push
```

### **Step 3: Configure Compliance Check URL**

Set the compliance check URL in your database:

```sql
-- Connect to your Supabase database and run:
ALTER DATABASE postgres SET app.compliance_check_url = 'https://your-project.supabase.co/functions/v1/compliance_check_agent_activity';
```

### **Step 4: Create Sample Policies**

Create some sample policies for testing:

```sql
-- Insert a sample policy
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

### **Step 5: Test the System**

Run the test script to verify everything works:

```bash
# Run the test script
node test-compliance-system.js
```

### **Step 6: Integrate with Frontend**

Add the compliance dashboard to your React app:

```tsx
import { ComplianceDashboard } from './components/ComplianceDashboard';

function App() {
  return (
    <div className="App">
      {/* Your existing components */}
      <ComplianceDashboard enterpriseId="your-enterprise-id" />
    </div>
  );
}
```

## 🔧 **How It Works**

### **Automatic Compliance Checking**

1. **Agent Activity Insertion**: When an agent activity is inserted via `ingest_agent_activity`
2. **Database Trigger**: The database trigger automatically calls the compliance function
3. **Policy Validation**: The function validates the activity against all active policies
4. **Alert Generation**: Violations generate alerts with appropriate severity levels
5. **Audit Logging**: All compliance activities are logged for audit purposes

### **Rule Types Supported**

1. **Data Handling Rules**
   - Encryption requirements
   - Access control validation
   - Data retention policies

2. **Content Creation Rules**
   - Medical claims detection
   - AI disclosure requirements
   - Balanced presentation checks

3. **Tool Approval Rules**
   - Approved tools validation
   - Vendor verification
   - Usage restrictions

4. **Disclosure Rules**
   - Patient consent requirements
   - Adverse event reporting
   - Regulatory disclosures

5. **Risk Assessment Rules**
   - Risk level thresholds
   - Mitigation requirements
   - Escalation triggers

### **Alert System**

- **Alert Types**: compliance_violation, policy_breach, risk_escalation, system_alert
- **Severity Levels**: low, medium, high, critical
- **Status Tracking**: active, acknowledged, resolved
- **Rich Metadata**: Includes activity context and violation details

## 📊 **Monitoring and Management**

### **View Compliance Summary**

```sql
-- Get compliance summary for an organization
SELECT get_compliance_summary('your-org-id');
```

### **View Active Alerts**

```sql
-- Get all active alerts
SELECT * FROM alerts 
WHERE organization_id = 'your-org-id' 
AND status = 'active'
ORDER BY created_at DESC;
```

### **Acknowledge/Resolve Alerts**

```sql
-- Acknowledge an alert
SELECT acknowledge_alert('alert-id', 'user-id');

-- Resolve an alert
SELECT resolve_alert('alert-id', 'user-id', 'Issue has been resolved');
```

### **View Compliance Reports**

```sql
-- Get recent compliance reports
SELECT * FROM compliance_reports 
WHERE enterprise_id = 'your-org-id'
ORDER BY generated_at DESC;
```

## 🛠️ **Customization**

### **Adding New Rule Types**

To add new rule types, extend the `evaluateRule` function:

```typescript
// Add new rule type evaluation
else if (rule.rule_type === 'your_new_rule_type') {
  const result = evaluateYourNewRuleType(activity, conditions, requirements);
  // ... handle result
}
```

### **Custom Policy Rules**

Create custom policy rules by extending the policy schema:

```json
{
  "your_custom_rule": {
    "condition": "activity.action === 'custom_action'",
    "requirement": "activity.details.custom_field === 'required_value'",
    "severity": "medium"
  }
}
```

### **Alert Customization**

Customize alert generation by modifying the `generateAlerts` function:

```typescript
// Add custom alert types
if (customCondition) {
  const alert: Alert = {
    // ... custom alert configuration
  };
  alerts.push(alert);
}
```

## 🔒 **Security Considerations**

### **Row Level Security (RLS)**

The system uses RLS to ensure users can only access data for their organization:

- Alerts are filtered by organization membership
- Compliance reports are restricted to organization members
- Audit logs maintain proper access controls

### **Data Privacy**

- Sensitive data is handled according to policy requirements
- Audit logs are immutable and tamper-proof
- All compliance data is encrypted at rest

## 🧪 **Testing**

### **Test Scenarios**

The test script includes these scenarios:

1. **AI Content without Disclosure** - Should trigger violation
2. **Sensitive Data without Encryption** - Should trigger violation
3. **Unauthorized Tool Usage** - Should trigger violation
4. **Compliant Activity** - Should pass all checks

### **Running Tests**

```bash
# Run all tests
node test-compliance-system.js

# Run specific test
node -e "require('./test-compliance-system.js').testComplianceSystem()"
```

## 📈 **Performance Considerations**

### **Database Indexes**

The migration creates indexes for optimal performance:

- `idx_alerts_organization_id` - Fast alert queries by organization
- `idx_alerts_severity` - Filter alerts by severity
- `idx_alerts_created_at` - Time-based queries
- `idx_compliance_checks_org` - Compliance check queries

### **Function Optimization**

- Compliance checks run asynchronously
- Database triggers don't block activity insertion
- Error handling prevents system failures

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Compliance checks not running**
   - Verify the database trigger is installed
   - Check the compliance check URL configuration
   - Review function logs for errors

2. **Alerts not being generated**
   - Verify policies are active and properly configured
   - Check rule conditions and requirements
   - Review activity data structure

3. **Performance issues**
   - Monitor database query performance
   - Consider adding indexes for frequently queried fields
   - Review function execution time

### **Debugging**

Enable detailed logging by checking the function logs:

```bash
# View function logs
supabase functions logs compliance_check_agent_activity
```

Check the audit logs for compliance activities:

```sql
-- View recent compliance activities
SELECT * FROM audit_logs_enhanced 
WHERE action LIKE '%compliance%'
AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## 🎉 **Success Metrics**

Track these metrics to measure success:

1. **Compliance Coverage**: % of agent activities checked
2. **Violation Detection**: Number of violations caught automatically
3. **Alert Response Time**: Time from violation to alert acknowledgment
4. **False Positive Rate**: % of alerts that are false positives
5. **User Adoption**: % of users actively using compliance dashboard

## 🔄 **Next Steps**

After implementing the basic system:

1. **Add Frontend Integration** - Connect the dashboard to real data
2. **Implement RBAC** - Add role-based permissions
3. **Create Workflow Automation** - Automated remediation workflows
4. **Add External Integrations** - Veeva, SharePoint, etc.
5. **Implement Advanced Analytics** - Trend analysis, risk prediction

## 📞 **Support**

If you encounter issues:

1. Check the function logs for errors
2. Verify database configuration
3. Review the audit logs for compliance activities
4. Test with the provided test script

The compliance system is designed to be robust and self-healing, but proper monitoring and maintenance will ensure optimal performance.
