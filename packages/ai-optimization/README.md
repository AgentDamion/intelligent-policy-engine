# AI Optimization Package

GEPA-based prompt optimization for PolicyAgent and other AI agents.

## Overview

This package implements the GEPA (Gradient-free Evolutionary Prompt Adaptation) methodology for optimizing AI agent prompts using:
- Real agent activity data from production
- GPT-4 reflection on failure patterns
- Automated prompt improvement generation
- A/B testing framework for validation

## Quick Start

### 1. Apply Database Migration

```bash
cd ../../supabase
npx supabase db push
```

Or apply the migration manually via Supabase dashboard.

### 2. Install Dependencies

```bash
cd packages/ai-optimization
npm install
```

### 3. Configure Environment

Add to `.env.local` or `.env` in project root:

```bash
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
OPTIMIZATION_MODEL=gpt-4-turbo-preview
```

### 4. Seed Initial Prompt

```bash
npm run seed-prompt
```

This extracts the current PolicyAgent prompt and stores it as version 1.

### 5. Generate Training Data

```bash
npm run generate-data
```

Creates 20 synthetic policy evaluation examples with human feedback.

### 6. Run Optimization

```bash
npm run test
```

This will:
1. Load the current PolicyAgent prompt
2. Extract training examples from agent_activities
3. Evaluate baseline performance
4. Use GPT-4 to analyze failures and generate improved prompt
5. Evaluate improved prompt performance
6. Save results to database

## Expected Output

```
🧪 GEPA Policy Agent Optimization Test

======================================================================
Pre-flight Checks
======================================================================
✅ Active prompt found (version 1)
✅ Training data available (20 activities)

======================================================================
Starting Optimization
======================================================================

🚀 Starting optimization for PolicyAgent agent...
📝 Created optimization run: abc-123...

📊 Extracting training data from agent_activities...
   Found 20 examples with human feedback
   Distribution: {"approved":5,"rejected":5,"needs_review":10}
   Failures: 8 (40.0%)
   Avg Score: 65.0%
   Split: 16 train, 4 test

📈 Evaluating baseline prompt...
   Baseline accuracy: 50.0%

🔍 Analyzing failure cases...
   Found 8 failures to analyze

🤔 Generating GPT-4 reflection...
   Diagnosis: The prompt is too lenient on trusted vendors...

📈 Evaluating improved prompt...
   Improved accuracy: 75.0%

✅ Optimization complete!
   Improvement: 50.0%
   New prompt ID: def-456...
   Status: Awaiting human approval
```

## Package Structure

```
packages/ai-optimization/
├── src/
│   ├── types/index.ts           # TypeScript interfaces
│   ├── services/
│   │   └── prompt-optimizer.ts  # Core optimization logic
│   └── utils/
│       └── data-extractor.ts    # JSONB parsing utilities
├── scripts/
│   ├── seed-policy-prompt.ts    # Initial prompt seeding
│   └── generate-synthetic-data.ts  # Mock data generator
└── test/
    └── test-optimizer.ts        # End-to-end test
```

## Database Schema

### agent_prompts_v2
Stores versioned prompts with performance metrics.

**Key columns:**
- `agent_type`: 'PolicyAgent', 'ComplianceAgent', etc.
- `prompt_version`: Incremental version number
- `system_prompt`: The system instruction
- `user_prompt_template`: Template with placeholders
- `is_active`: Currently deployed prompt
- `performance_metrics`: JSON with scores and improvements

### optimization_runs_v2
Tracks each optimization attempt.

**Key columns:**
- `agent_type`: Which agent was optimized
- `status`: 'running', 'completed', 'failed'
- `baseline_score`: Performance before optimization
- `improved_score`: Performance after optimization
- `improvement_percentage`: Calculated improvement

### prompt_reflections_v2
Stores GPT-4 analysis and recommendations.

**Key columns:**
- `diagnosis`: What patterns of failure were observed
- `key_issues`: Array of specific problems
- `proposed_changes`: How to fix the issues
- `reasoning`: Why these changes will help

## Usage Examples

### Activate an Improved Prompt

After reviewing the improved prompt in the database:

```sql
SELECT activate_prompt_v2('your-new-prompt-id', auth.uid());
```

This will:
1. Deactivate the current prompt
2. Activate the new prompt
3. Log the change in audit_events
4. All PolicyAgent requests will immediately use the new prompt (cached for 5 minutes)

### Query Optimization History

```sql
SELECT 
  agent_type,
  started_at,
  baseline_score,
  improved_score,
  improvement_percentage
FROM optimization_runs_v2
WHERE agent_type = 'PolicyAgent'
ORDER BY started_at DESC;
```

### View Latest Reflection

```sql
SELECT 
  r.diagnosis,
  r.key_issues,
  r.proposed_changes
FROM prompt_reflections_v2 r
JOIN optimization_runs_v2 o ON r.optimization_run_id = o.id
WHERE o.agent_type = 'PolicyAgent'
ORDER BY r.created_at DESC
LIMIT 1;
```

## Cost Tracking

Estimated costs per optimization run:
- **Training data extraction**: Free (database query)
- **Baseline evaluation**: ~$0.20 (10 GPT-4 calls)
- **GPT-4 reflection**: ~$0.50 (1 context-heavy call)
- **Improved evaluation**: ~$0.20 (10 GPT-4 calls)
- **Total per run**: ~$0.90

Monthly budget for weekly optimizations: ~$4/month

## Troubleshooting

### "No active prompt found"
Run `npm run seed-prompt` to initialize the PolicyAgent prompt.

### "No agent activities found"
Run `npm run generate-data` to create synthetic training examples.

### "Insufficient training data"
The optimizer needs at least 10 examples with human feedback. Generate more synthetic data or wait for real production data.

### OpenAI API errors
- Verify `OPENAI_API_KEY` is set correctly
- Ensure you have GPT-4 API access
- Check OpenAI account has sufficient credits

## Next Steps

1. **Review improved prompts** - Check the generated prompts make sense
2. **A/B testing** - Deploy improved prompts to a subset of requests
3. **Real human feedback** - Build UI to capture actual human reviews
4. **Expand to other agents** - Optimize ComplianceAgent, AuditAgent, etc.
5. **Automate** - Schedule weekly optimization runs

## Contributing

When adding new agents:

1. Create initial prompt in `scripts/seed-[agent]-prompt.ts`
2. Add training data extraction logic if data format differs
3. Update `OptimizationConfig` if needed
4. Test with synthetic data first

## License

Internal use only - AIComplyr Platform

