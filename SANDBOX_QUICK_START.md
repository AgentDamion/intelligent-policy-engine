# Policy Sandbox - Quick Start Guide

## 🚀 Deploy in 5 Minutes

### 1. Deploy Database Schema

```bash
# Using Supabase CLI
supabase migration up

# Or run SQL file directly
psql -h your-db-host -U postgres -f supabase/migrations/20251010123054_sandbox_system.sql
```

### 2. Deploy Edge Functions

```bash
supabase functions deploy sandbox-run
supabase functions deploy generate-test-scenarios
supabase functions deploy sandbox-export
```

### 3. Set Environment Variables

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set AI_PROVIDER=openai
```

### 4. Test the System

```bash
# Test sandbox-run
curl -X POST https://your-project.supabase.co/functions/v1/sandbox-run \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "policy_id": "test-policy-id",
    "scenario": {
      "name": "Test",
      "config": {"tool": "GPT-4"}
    },
    "enterprise_id": "test-enterprise-id"
  }'
```

### 5. Integrate Frontend

```typescript
// Add to your app
import { SandboxDashboard } from '@/components/sandbox/SandboxDashboard'

function App() {
  return <SandboxDashboard enterpriseId="..." userId="..." />
}
```

## 📊 What You Get

### Backend (Supabase)
- ✅ 5 database tables (sandbox_runs, sandbox_controls, sandbox_approvals, exports_log, governance_events)
- ✅ 3 edge functions with multi-agent orchestration
- ✅ SandboxAgent with 7 AI-powered actions
- ✅ Real-time subscriptions

### Frontend (React)
- ✅ SandboxDashboard component
- ✅ AgentActivityPanel component
- ✅ useSandboxAgents hook
- ✅ AI scenario generation UI
- ✅ Export functionality

### AI Capabilities
- ✅ Policy simulation with AI validation
- ✅ Test scenario generation (5-20 scenarios)
- ✅ Compliance scoring
- ✅ Anomaly detection
- ✅ Executive summary generation
- ✅ Multi-agent orchestration (4 agents working together)

## 🎯 Key Features

### 1. Run Intelligent Simulations
```typescript
const { runIntelligentSimulation } = useSandboxAgents(enterpriseId, userId)

const result = await runIntelligentSimulation({
  policy_id: 'policy-123',
  scenario: {
    name: 'HIPAA Compliance Test',
    config: {
      tool: 'GPT-4',
      data_class: 'PHI',
      jurisdiction: 'US'
    }
  }
})
```

### 2. Generate Test Scenarios with AI
```typescript
const { generateTestScenarios } = useSandboxAgents(enterpriseId, userId)

const scenarios = await generateTestScenarios('policy-123', 5, {
  scenario_type: 'comprehensive'
})
```

### 3. Export with AI Insights
```typescript
const { exportResults } = useSandboxAgents(enterpriseId, userId)

const exportData = await exportResults(
  'sandbox-run-id',
  'markdown',
  { include_ai_insights: true }
)
```

## 🤖 Multi-Agent Workflow

When you run a simulation, 4 AI agents work together:

1. **PolicyAgent** → Validates policy structure
2. **SandboxAgent** → Simulates execution with AI
3. **ComplianceAgent** → Scores compliance
4. **MonitoringAgent** → Detects anomalies

Results include:
- Validation status (pass/fail)
- Compliance score (0-100%)
- Risk flags (array)
- AI insights from all agents
- Overall confidence score

## 📝 Example Simulation

```json
{
  "policy_id": "gdpr-ai-usage-policy",
  "scenario": {
    "name": "Customer Support Chatbot",
    "config": {
      "tool": "GPT-4",
      "data_class": "PII",
      "jurisdiction": "EU",
      "usage_context": "customer_support",
      "user_role": "support_agent"
    },
    "expected_outcome": "approved"
  }
}
```

**AI-Generated Result:**
- ✅ Validation: Pass (with conditions)
- 📊 Compliance Score: 85%
- ⚠️ Risk Flags: 2 (data_residency_check, consent_verification)
- 🤖 AI Confidence: 87%
- 💡 Key Finding: "GDPR consent mechanism required"

## 🔧 Common Use Cases

### Use Case 1: Test Policy Before Publishing
Run simulations with edge cases to validate policy logic.

### Use Case 2: Generate Comprehensive Test Suite
Use AI to generate 20 diverse test scenarios covering all edge cases.

### Use Case 3: Audit Trail for Compliance
Export simulation results with AI summaries for auditors.

### Use Case 4: Continuous Policy Testing
Run simulations on policy changes to detect drift.

## 🎨 UI Preview

The SandboxDashboard provides:
- 📋 Policy dropdown selector
- ✨ AI scenario generator button
- ▶️ Run simulation button
- 📊 Real-time agent activity display
- 📈 Results dashboard with scores
- 💾 Export buttons (JSON/Markdown)
- 📜 Simulation history

## 🐛 Troubleshooting

### Simulation fails
- Check edge function logs: `supabase functions logs sandbox-run`
- Verify API keys: `supabase secrets list`
- Test policy exists in database

### No agent activities showing
- Check browser console for Realtime errors
- Verify `agent_execution_log` in results

### Export fails
- Ensure `userId` is provided to hook
- Check exports_log table for errors

## 📚 Full Documentation

See `LOVABLE_GOVERNANCE_SANDBOX_IMPLEMENTATION.md` for:
- Complete architecture overview
- Detailed API reference
- Agent action documentation
- Testing guide
- Deployment best practices

## ✅ Success Checklist

- [ ] Database migration deployed
- [ ] 3 edge functions deployed
- [ ] Environment variables set
- [ ] Test simulation successful (200 OK)
- [ ] Frontend component integrated
- [ ] Real-time subscriptions working
- [ ] Export functionality tested

---

**Time to Deploy**: 5-10 minutes  
**Time to First Simulation**: 1 minute after deploy  
**AI Models Used**: OpenAI GPT-4 Turbo (primary), Anthropic Claude 3 (fallback)

