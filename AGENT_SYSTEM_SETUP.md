# 🤖 Agent Ingestion System Setup Guide

This guide will help you deploy the complete agent ingestion system with HMAC verification and real-time dashboards.

## 📋 What We've Created

### 1. Database Tables
- `agent_activities` - Stores agent activity logs
- `ai_agent_decisions` - Stores AI agent decision records
- Proper indexes and RLS policies for security

### 2. Edge Functions
- `ingest_agent` - New HMAC-secured batch ingestion endpoint
- `ingest_agent_activity` - Backward-compatible single activity endpoint

### 3. Frontend Integration
- Updated hooks to use real Supabase data
- Graceful fallbacks when tables aren't ready yet

## 🚀 Quick Setup

### Step 1: Run the Migration
```bash
cd aicomplyr-intelligence
node supabase/run-migrations-direct.mjs run 20250903160000_add_agent_tables.sql
```

### Step 2: Deploy Edge Functions
```bash
# Deploy the new HMAC-secured function
npx supabase functions deploy ingest_agent

# Deploy the backward-compatible function
npx supabase functions deploy ingest_agent_activity
```

### Step 3: Set Environment Secrets
```bash
npx supabase secrets set AGENT_INGEST_KEY=corhosvgetuv7q61xsv4ingyznz7y7le1lts
```

### Step 4: Test the System
```bash
# Run the comprehensive test
node test-agent-system.js

# Or run your existing tests
pwsh ../working-test.ps1
```

## 🔧 Manual Setup (if automated script fails)

### 1. Create Agent Tables
Run this SQL in your Supabase SQL editor:
```sql
-- Copy the contents of supabase/migrations/20250903160000_add_agent_tables.sql
```

### 2. Deploy Functions Manually
```bash
# Make sure you're in the aicomplyr-intelligence directory
cd aicomplyr-intelligence

# Deploy each function
npx supabase functions deploy ingest_agent
npx supabase functions deploy ingest_agent_activity
```

### 3. Set Secrets
```bash
npx supabase secrets set AGENT_INGEST_KEY=corhosvgetuv7q61xsv4ingyznz7y7le1lts
```

## 🧪 Testing

### Test Scripts Available
1. `test-agent-system.js` - Comprehensive system test
2. `../working-test.ps1` - Your existing PowerShell test
3. `../test-supabase-functions.ps1` - Your existing test suite

### Manual Testing
```bash
# Test basic connectivity
curl https://dqemokpnzasbeytdbzei.supabase.co/rest/v1/

# Test functions endpoint
curl https://dqemokpnzasbeytdbzei.supabase.co/functions/v1/

# Test agent activity (backward compatible)
curl -X POST https://dqemokpnzasbeytdbzei.supabase.co/functions/v1/ingest_agent_activity \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: corhosvgetuv7q61xsv4ingyznz7y7le1lts" \
  -d '{"agent": "Test Agent", "action": "Test action", "status": "success"}'
```

## 🔐 Security Features

### HMAC Signature Verification
The new `ingest_agent` function uses HMAC-SHA256 signature verification:

```javascript
// Example of how to generate HMAC signature
const crypto = require('crypto');
const body = JSON.stringify(data);
const signature = crypto
  .createHmac('sha256', 'your-secret-key')
  .update(body)
  .digest('hex');
const header = `sha256=${signature}`;
```

### Row Level Security
- Service role can insert data
- Authenticated users can only view data in their context
- Enterprise and workspace isolation

## 📊 Frontend Integration

### Updated Hooks
- `useAgentActivities()` - Now reads from `agent_activities` table
- `useAIDecisions()` - New hook for `ai_agent_decisions` table
- Graceful fallbacks to sample data when tables aren't ready

### Real-time Updates
The hooks automatically refresh every 30 seconds and will show real-time data once the system is deployed.

## 🐛 Troubleshooting

### Common Issues

1. **Migration fails**: Make sure you're in the right directory and have proper database access
2. **Functions won't deploy**: Check that you have Supabase CLI installed and are logged in
3. **Secrets not working**: Verify the secret is set correctly with `npx supabase secrets list`
4. **RLS blocking access**: Check that your user has proper enterprise context

### Debug Commands
```bash
# Check Supabase CLI status
npx supabase status

# List deployed functions
npx supabase functions list

# List secrets
npx supabase secrets list

# Check database connection
node supabase/run-migrations-direct.mjs status
```

## 🎯 Next Steps

1. **Deploy the system** using the steps above
2. **Test with your existing scripts** to verify everything works
3. **Update Cursor agents** to use the new HMAC-secured endpoint
4. **Monitor the dashboards** for real-time agent data
5. **Scale as needed** - the system is designed to handle high-volume agent data

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run the test scripts to identify specific problems
3. Check Supabase logs in the dashboard
4. Verify all environment variables are set correctly

The system is now ready to handle secure agent data ingestion with real-time dashboard updates! 🚀
