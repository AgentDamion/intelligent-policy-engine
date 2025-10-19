# GEPA Integration Setup Guide

## ✅ What's Been Completed

1. **Database Migration Created**: `supabase/migrations/20250119_gepa_optimization.sql`
2. **AI Optimization Package**: `packages/ai-optimization/` with full TypeScript setup
3. **PromptOptimizer Service**: Complete implementation with GPT-4 reflection
4. **Test Scripts**: Ready to run optimization tests
5. **Type Definitions**: Full TypeScript support

## 🔧 Manual Steps Required

### Step 1: Create Database Tables

**Go to your Supabase Dashboard → SQL Editor and run this SQL:**

```sql
-- Copy the entire contents of supabase/migrations/20250119_gepa_optimization.sql
-- and paste it into the SQL Editor, then click "Run"
```

**Or run this simplified version:**

```sql
-- 1. Agent Prompts Storage
CREATE TABLE agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  prompt_version INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  few_shot_examples JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  parent_prompt_id UUID REFERENCES agent_prompts(id),
  optimization_run_id UUID,
  improvement_percentage NUMERIC(5,2),
  UNIQUE(agent_type, prompt_version)
);

-- 2. Optimization Runs
CREATE TABLE optimization_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  training_examples_count INTEGER,
  test_examples_count INTEGER,
  baseline_score NUMERIC(5,4),
  improved_score NUMERIC(5,4),
  improvement_percentage NUMERIC(5,2),
  best_prompt_id UUID REFERENCES agent_prompts(id),
  failure_analysis JSONB DEFAULT '{}',
  cost_estimate_usd NUMERIC(6,2),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Prompt Reflections
CREATE TABLE prompt_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_run_id UUID NOT NULL REFERENCES optimization_runs(id),
  parent_prompt_id UUID REFERENCES agent_prompts(id),
  diagnosis TEXT NOT NULL,
  key_issues JSONB DEFAULT '[]',
  proposed_changes TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  resulting_prompt_id UUID REFERENCES agent_prompts(id),
  failure_examples JSONB DEFAULT '[]',
  success_examples JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Extend existing tables
ALTER TABLE agent_activities 
  ADD COLUMN IF NOT EXISTS prompt_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS used_for_training BOOLEAN DEFAULT FALSE;

ALTER TABLE audit_entries
  ADD COLUMN IF NOT EXISTS optimization_related BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS optimization_run_id UUID REFERENCES optimization_runs(id);

-- 5. Create indexes
CREATE INDEX idx_agent_prompts_active ON agent_prompts(agent_type, is_active);
CREATE INDEX idx_optimization_runs_agent ON optimization_runs(agent_type, started_at DESC);
CREATE INDEX idx_reflections_run ON prompt_reflections(optimization_run_id);
```

### Step 2: Set Up Environment Variables

**Create `.env` file in `/workspace/packages/ai-optimization/`:**

```bash
# Copy from .env.example and fill in your values
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 3: Extract Current Agent Prompts

**Run the prompt extraction script:**

```bash
cd /workspace/packages/ai-optimization
npm run extract-prompts
```

**This will populate the `agent_prompts` table with your current agent prompts.**

### Step 4: Test the Optimization System

**Run the test script:**

```bash
cd /workspace/packages/ai-optimization
npm run test
```

**This will:**
1. Load your current prompts from the database
2. Extract training data from `agent_activities`
3. Run a full GEPA optimization cycle
4. Generate improved prompts via GPT-4 reflection
5. Save results to the database

## 🎯 Expected Results

After running the test, you should see:

```
✅ OPTIMIZATION RESULTS
============================================================
Agent Type: policy
Run ID: [uuid]
Baseline Score: 75.0%
Improved Score: 85.0%
Improvement: 13.3%
Cost Estimate: $2.50
New Prompt ID: [uuid]
Status: Awaiting approval
```

## 🔍 Verification Steps

1. **Check Database Tables**: Verify tables exist in Supabase dashboard
2. **Check Prompt Storage**: Verify prompts are stored in `agent_prompts` table
3. **Check Training Data**: Verify `agent_activities` has data for training
4. **Run Optimization**: Verify optimization completes successfully
5. **Check Results**: Verify improved prompts are saved

## 🚨 Troubleshooting

### "No training data found"
- **Cause**: `agent_activities` table doesn't have enough data with human reviews
- **Solution**: Add some test data or use synthetic data for initial testing

### "No active prompt found"
- **Cause**: `agent_prompts` table is empty
- **Solution**: Run `npm run extract-prompts` first

### "OpenAI API error"
- **Cause**: Invalid API key or insufficient credits
- **Solution**: Check your OpenAI API key and billing

### "Database connection error"
- **Cause**: Invalid Supabase credentials
- **Solution**: Check your `.env` file values

## 📊 Next Steps After Setup

1. **Review Generated Prompts**: Check the improved prompts in Supabase
2. **Approve/Reject**: Use the database to activate new prompts
3. **Monitor Performance**: Track improvement metrics
4. **Scale Up**: Run optimization for more agents
5. **Build UI**: Create admin interface for prompt management

## 🎉 Success Criteria

- [ ] Database tables created successfully
- [ ] Environment variables configured
- [ ] Current prompts extracted to database
- [ ] Test optimization run completes
- [ ] Improved prompts generated and saved
- [ ] Results visible in Supabase dashboard

Once all steps are complete, you'll have a fully functional GEPA optimization system!
