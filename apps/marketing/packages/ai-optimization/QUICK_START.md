# 🚀 GEPA Optimization - Quick Start

## 3-Step Setup (5 minutes)

### 1. Configure `.env.local`

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=sk-your-openai-key-here
```

### 2. Run Setup Scripts

```bash
cd packages/ai-optimization

npm run seed-prompt      # Seeds PolicyAgent v1
npm run generate-data    # Creates 20 training examples
```

### 3. Run Optimization

```bash
npm run test
```

---

## What You'll See

```
🚀 Starting optimization for PolicyAgent agent...
📊 Found 20 examples with human feedback
📈 Baseline accuracy: 65.0%
🤔 Generating GPT-4 reflection...
📈 Improved accuracy: 82.5%

✅ Optimization complete!
   Improvement: +26.9%
   New prompt ID: abc-123-def
   Cost: $0.70
```

---

## Activate Improved Prompt

```sql
-- In Supabase SQL Editor
SELECT activate_prompt_v2('abc-123-def', auth.uid());
```

Wait 5 minutes (cache TTL), then ALL PolicyAgent requests use the optimized prompt!

---

## Verify It's Working

Make a PolicyAgent request and check Edge function logs:

```
✅ Using PolicyAgent prompt version 2
```

---

## Next Time

Just run optimization again with updated data:

```bash
npm run test  # Analyzes new failures, creates v3, v4, etc.
```

---

## Architecture

```
PolicyAgent Request
  ↓
Load active prompt from agent_prompts_v2
  ↓
Fill template with input data
  ↓
Call OpenAI with optimized prompt
  ↓
Return decision
```

---

## Documentation

- **This guide**: Quick start (you are here)
- **SETUP_COMPLETE.md**: Detailed setup instructions
- **INTEGRATION_COMPLETE.md**: Full architecture explanation
- **README.md**: API reference and troubleshooting
- **../GEPA_IMPLEMENTATION_SUMMARY.md**: Complete overview

---

## Cost

- **Per optimization**: ~$0.70
- **Per request**: $0 extra (same as before)
- **Monthly**: ~$3-4 (weekly runs)

---

## Help

### Error: "No active prompt found"
```bash
npm run seed-prompt
```

### Error: "No training data"
```bash
npm run generate-data
```

### New prompt not being used
- Wait 5 minutes for cache to expire
- Or restart Edge functions

---

**That's it! You're ready to optimize.** 🎉

