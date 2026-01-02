# Boundary Governance Integration Tests

This directory contains integration tests for the Boundary Governance feature.

## Prerequisites

Before running the tests, complete the following setup steps:

### Step 1: Deploy the Migration

Copy the contents of `supabase/migrations/20260101000001_boundary_artifacts.sql` and run it in your Supabase Dashboard SQL Editor.

Or use the Supabase CLI:

```bash
supabase db push
```

### Step 2: Verify Tables Created

Run this query in Supabase SQL Editor to verify:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'boundary_%';
```

Expected result: `boundary_decision_tokens`, `boundary_partner_confirmations`, `boundary_execution_receipts`

### Step 3: Configure Environment Variables

Add these to your `.env.local`:

```env
# Boundary Governance - Decision Token Signing
DT_HMAC_SECRET=a3d857e3950fc272579d60f2d3aa22b25047dbf72eea5c203811284287b261b9
DT_SIGNING_METHOD=HMAC
DT_EXPIRY_HOURS=72
```

**Important:** The HMAC secret above is for development only. Generate a new one for production:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Seed Test Data

Copy the contents of `scripts/seed-boundary-test-data.sql` and run it in your Supabase Dashboard SQL Editor.

### Step 5: Start the Server

```bash
npm start
```

### Step 6: Run the Tests

```bash
node tests/boundary/live-integration.test.js
```

## Test Files

| File | Description |
|------|-------------|
| `live-integration.test.js` | Full integration test against live Supabase |
| `e2e-hcp-campaign.test.js` | E2E test simulating an HCP campaign workflow |

## Expected Results

A successful run will show:

```
╔═══════════════════════════════════════════════════════════════╗
║                      TEST RESULTS SUMMARY                      ║
╠═══════════════════════════════════════════════════════════════╣
║  ✅ Passed: 13  | ❌ Failed: 0   | Total: 13                  ║
║  ⏱️  Duration: X.XXs                                         ║
║  📊 Success Rate: 100.0%                                      ║
╚═══════════════════════════════════════════════════════════════╝
```

## Troubleshooting

### "Environment variables not configured"

Ensure your `.env.local` file has:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DT_HMAC_SECRET`
- `OPENAI_API_KEY`

### "Decision Token not issued"

The policy evaluation might fail if Supabase Edge Functions aren't deployed. Deploy them:

```bash
supabase functions deploy generate-eps
supabase functions deploy policy-evaluate
supabase functions deploy generate-proof-bundle
```

### "Partner authentication required"

The HTTP API tests require auth context. The direct service tests bypass this and should pass.

