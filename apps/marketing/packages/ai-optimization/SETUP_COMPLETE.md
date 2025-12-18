# GEPA Optimization Setup Complete! 🎉

All files have been created and dependencies installed. Here's what to do next:

## ✅ What's Been Created

### Database
- `supabase/migrations/20251019000000_gepa_optimization.sql`
  - 3 new tables: `agent_prompts`, `optimization_runs`, `prompt_reflections`
  - Helper functions: `get_active_prompt()`, `activate_prompt()`
  - Row-level security policies

### Package Structure
```
packages/ai-optimization/
├── package.json ✅ (dependencies installed)
├── tsconfig.json ✅
├── README.md ✅ (comprehensive documentation)
├── src/
│   ├── index.ts ✅
│   ├── types/index.ts ✅ (complete type definitions)
│   ├── services/
│   │   └── prompt-optimizer.ts ✅ (adapted for your schema)
│   └── utils/
│       └── data-extractor.ts ✅ (JSONB parsing)
├── scripts/
│   ├── seed-policy-prompt.ts ✅ (extracts current prompt)
│   └── generate-synthetic-data.ts ✅ (creates 20 examples)
└── test/
    └── test-optimizer.ts ✅ (end-to-end test)
```

### Environment
- `env.example` updated with GEPA variables ✅

---

## 🚀 Quick Start (3 Steps)

### Step 1: Apply Database Migration

You have two options:

**Option A: Supabase Dashboard (Recommended)**
1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql/new
2. Copy contents of `supabase/migrations/20251019000000_gepa_optimization.sql`
3. Paste and click "Run"

**Option B: Migration Script**
```bash
cd supabase
node run-migrations-direct.mjs 20251019000000_gepa_optimization.sql
```

**Verify migration worked:**
- Check Supabase Dashboard → Table Editor
- You should see: `agent_prompts_v2`, `optimization_runs_v2`, `prompt_reflections_v2`

### Step 2: Configure Environment

Add these to your `.env.local` (or `.env`):

```bash
# Required for optimization
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=sk-your-openai-key-here

# Optional configuration
OPTIMIZATION_MODEL=gpt-4-turbo-preview
```

**Where to find these:**
- `VITE_SUPABASE_URL`: Supabase Dashboard → Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Settings → API → service_role key (secret!)
- `OPENAI_API_KEY`: https://platform.openai.com/api-keys

### Step 3: Run the Complete Flow

```bash
cd packages/ai-optimization

# 1. Seed the current PolicyAgent prompt (version 1)
npm run seed-prompt

# 2. Generate 20 synthetic training examples
npm run generate-data

# 3. Run optimization and see results!
npm run test
```

---

## 📊 Expected Output

When you run `npm run test`, you should see:

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
📝 Created optimization run: abc-123-def-456

📊 Extracting training data from agent_activities...
   Found 20 examples with human feedback
   Distribution: {"approved":5,"rejected":5,"needs_review":10}
   Failures: 8 (40.0%)
   Avg Score: 65.0%

📈 Evaluating baseline prompt...
   Baseline accuracy: 50.0%

🤔 Generating GPT-4 reflection...
   Diagnosis: The prompt struggles to distinguish edge cases...

📈 Evaluating improved prompt...
   Improved accuracy: 75.0%

✅ Optimization complete!
   Improvement: 50.0%
   New prompt ID: xyz-789
   Cost Estimate: $0.70
```

---

## 🔍 What Happens During Optimization

1. **Load Current Prompt** - Retrieves active PolicyAgent prompt (v1)
2. **Extract Training Data** - Pulls 20 synthetic examples from `agent_activities`
3. **Evaluate Baseline** - Tests current prompt on examples (scores ~50-70%)
4. **Identify Failures** - Finds examples where agent got it wrong
5. **GPT-4 Reflection** - Analyzes why failures occurred
6. **Generate Improved Prompt** - Creates version 2 with fixes
7. **Evaluate Improvement** - Tests new prompt (should score higher!)
8. **Save Results** - Stores everything in database for review

---

## 🎯 After Running Optimization

### Review Results in Supabase Dashboard

**1. Check the Optimization Run**
```sql
SELECT * FROM optimization_runs_v2 
ORDER BY started_at DESC 
LIMIT 1;
```

**2. Read GPT-4's Analysis**
```sql
SELECT 
  diagnosis,
  key_issues,
  proposed_changes,
  reasoning
FROM prompt_reflections_v2
ORDER BY created_at DESC
LIMIT 1;
```

**3. Compare Prompts**
```sql
-- Current (v1)
SELECT system_prompt, user_prompt_template
FROM agent_prompts_v2
WHERE agent_type = 'PolicyAgent' AND prompt_version = 1;

-- Improved (v2)
SELECT system_prompt, user_prompt_template
FROM agent_prompts_v2
WHERE agent_type = 'PolicyAgent' AND prompt_version = 2;
```

### Activate Improved Prompt (if satisfied)

```sql
-- Review the improved prompt first!
SELECT * FROM agent_prompts_v2 WHERE prompt_version = 2;

-- If you like it, activate it:
SELECT activate_prompt_v2('your-new-prompt-id-here', auth.uid());

-- Wait up to 5 minutes for cache to refresh, or restart your Edge functions
-- All PolicyAgent requests will now use the optimized prompt!
```

---

## 📈 Success Metrics

You've succeeded if:
- ✅ Migration applied (3 tables created)
- ✅ Prompt seeded (version 1 in database)
- ✅ 20 synthetic examples created
- ✅ Optimization runs without errors
- ✅ Improved prompt shows better accuracy
- ✅ Results visible in Supabase dashboard

---

## 🐛 Troubleshooting

### "Missing environment variables"
- Check `.env.local` or `.env` has `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`
- Make sure file is in project root (not in `packages/ai-optimization/`)

### "No active prompt found"
```bash
npm run seed-prompt
```

### "No agent activities found"
```bash
npm run generate-data
```

### "OpenAI API error"
- Verify your API key is valid: https://platform.openai.com/api-keys
- Ensure you have GPT-4 access (required for optimization)
- Check your account has sufficient credits

### Migration errors
- Try applying migration manually via Supabase SQL Editor
- Check RLS policies aren't blocking access
- Verify service role key is correct

---

## 💰 Cost Estimate

- **One-time setup**: Free
- **Per optimization run**: ~$0.70-$1.00
- **Expected runs**: 1-2 per week
- **Monthly cost**: ~$4-8

The optimizer uses GPT-4 efficiently:
- Only evaluates 10 test cases (not all examples)
- Single reflection call per run
- No fine-tuning required

---

## 🎓 Next Steps After Success

1. **Review the improved prompt** - Is it actually better?
2. **Test with real data** - Once you have production agent_activities
3. **Build human review UI** - Capture real feedback instead of synthetic
4. **Expand to other agents** - ComplianceAgent, AuditAgent, etc.
5. **Schedule regular runs** - Weekly optimization for continuous improvement

---

## 📚 Additional Resources

- **Package README**: `packages/ai-optimization/README.md`
- **Type Definitions**: `packages/ai-optimization/src/types/index.ts`
- **Migration SQL**: `supabase/migrations/20251019000000_gepa_optimization.sql`

---

## ✉️ Questions?

If you get stuck:
1. Check the troubleshooting section above
2. Review the README.md in this package
3. Check Supabase logs for database errors
4. Verify OpenAI API key has GPT-4 access

---

**Ready to optimize? Run the 3 steps above and watch your PolicyAgent get smarter! 🚀**

