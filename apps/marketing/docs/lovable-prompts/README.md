# Lovable Implementation Prompts - Phase 1: Tool Disclosure & Validation

This directory contains **exact, paste-ready prompts** for implementing the RFP → Policy → Audit unified flow in Lovable.

## Phase 1 Overview

**Goal:** Enable agencies to disclose AI tools in RFP responses and get instant policy validation from enterprise clients.

**Duration:** 2 weeks

**Deliverables:**
- Database tables for tool disclosures and policy resolutions
- Edge function for deterministic validation logic
- Service layer methods for disclosure management
- UI component for displaying validation results
- Mock data and testing scenarios

---

## Implementation Order (Copy/Paste Each Prompt)

### Step 1: Database Migration (Day 1)
**File:** `phase1-step1-database-migration.md`

**What it does:**
- Extends `policy_versions` table with `tool_whitelist`, `control_mappings`, `jurisdictions`
- Creates `rfp_tool_disclosures` table
- Creates `policy_resolutions` table
- Sets up RLS policies for security

**Estimated time:** 30 minutes

**Verification:**
- Run the migration
- Check tables exist in Supabase dashboard
- Verify RLS policies are active

---

### Step 2: Mock Data (Day 1)
**File:** `phase1-step2-mock-data.md`

**What it does:**
- Creates mock policy pack with approved tools
- Provides sample tool disclosures (compliant + pending)
- Includes expected validation results

**Estimated time:** 15 minutes

**Verification:**
- Import mock data in your dev environment
- Confirm TypeScript types match

---

### Step 3: TypeScript Types (Day 1)
**File:** `phase1-step3-types-extension.md`

**What it does:**
- Adds `ToolDisclosure`, `PolicyCheckStatus`, `PolicyResolutionItem`, `PolicyResolutionResult`, `PolicyPack` to `src/types/rfp.ts`

**Estimated time:** 10 minutes

**Verification:**
- No TypeScript errors
- Types are exported and importable

---

### Step 4: Edge Function (Day 2-3)
**File:** `phase1-step4-edge-function.md`

**What it does:**
- Creates `validate-rfp-disclosures` edge function
- Implements deterministic validation logic
- Saves results to `policy_resolutions` table

**Estimated time:** 2-3 hours

**Verification:**
- Function deploys successfully
- Test with mock data via Supabase dashboard
- Check logs for errors
- Verify resolution is saved to database

---

### Step 5: Service Layer (Day 3)
**File:** `phase1-step5-service-extension.md`

**What it does:**
- Extends `rfpService` with disclosure CRUD methods
- Adds `validateToolDisclosures()` method
- Adds `getPolicyResolution()` method

**Estimated time:** 1 hour

**Verification:**
- Import and call methods from React components
- Verify data flows correctly
- Check error handling works

---

### Step 6: UI Component (Day 4-5)
**File:** `phase1-step6-ui-component.md`

**What it does:**
- Creates `PolicyResolutionPanel` component
- Displays validation results with status badges
- Handles loading, error, and empty states

**Estimated time:** 3-4 hours

**Verification:**
- Component renders with mock data
- All states (loading, error, empty, success) work
- Responsive on mobile
- Colors use semantic tokens

---

### Step 7: Testing (Day 5)
**File:** `phase1-step7-testing-scenarios.md`

**What it does:**
- Provides 7 test scenarios with expected results
- Integration test flow
- RLS security tests
- Performance tests
- Manual QA checklist

**Estimated time:** 2-3 hours

**Verification:**
- All test scenarios pass
- RLS policies block unauthorized access
- No performance issues with 50+ disclosures

---

## Quick Start Guide

1. **Start with the database:**
   ```bash
   # Copy prompt from phase1-step1-database-migration.md
   # Paste into Lovable chat
   # Approve migration when prompted
   ```

2. **Add mock data:**
   ```bash
   # Copy prompt from phase1-step2-mock-data.md
   # Paste into Lovable chat
   ```

3. **Extend types:**
   ```bash
   # Copy prompt from phase1-step3-types-extension.md
   # Paste into Lovable chat
   ```

4. **Create edge function:**
   ```bash
   # Copy prompt from phase1-step4-edge-function.md
   # Paste into Lovable chat
   # Wait for deployment (auto-deploys)
   ```

5. **Extend service layer:**
   ```bash
   # Copy prompt from phase1-step5-service-extension.md
   # Paste into Lovable chat
   ```

6. **Build UI component:**
   ```bash
   # Copy prompt from phase1-step6-ui-component.md
   # Paste into Lovable chat
   ```

7. **Test everything:**
   ```bash
   # Use scenarios from phase1-step7-testing-scenarios.md
   # Run manual QA checklist
   ```

---

## Dependencies

**Required before starting:**
- Existing RFP tables (`policy_distributions`, `policy_versions`, `policies`)
- Existing workspace/enterprise tables
- Supabase project configured
- Edge function secrets (if needed)

**Packages (already installed):**
- `@supabase/supabase-js`
- `zod`
- `lucide-react`
- shadcn/ui components

---

## Success Criteria

✅ **Database:**
- Tables created with proper RLS
- Foreign keys enforced
- Indexes for performance

✅ **Edge Function:**
- Validates tools deterministically
- Returns consistent results
- Logs properly for debugging

✅ **Service Layer:**
- Methods handle errors gracefully
- TypeScript types are correct
- Integrates with existing rfpService

✅ **UI Component:**
- All states render correctly
- Responsive design works
- Accessible (keyboard + screen reader)
- Uses semantic color tokens

✅ **Testing:**
- All scenarios pass
- RLS blocks unauthorized access
- No console errors

---

## Next Steps (Phase 2)

After Phase 1 is complete and tested, proceed to Phase 2:
- Decision & Activation flow
- Engagement creation
- Baseline management

Phase 2 prompts will be in a separate directory once Phase 1 is confirmed working.

---

## Troubleshooting

**Issue:** Migration fails
- Check Supabase logs
- Verify table names don't conflict
- Ensure RLS policies reference correct columns

**Issue:** Edge function doesn't deploy
- Check `supabase/config.toml` syntax
- Verify no TypeScript errors in function code
- Check Supabase dashboard for deployment logs

**Issue:** RLS blocks access unexpectedly
- Verify user is authenticated
- Check user has workspace membership
- Review RLS policy conditions

**Issue:** Component doesn't render
- Check TypeScript errors in console
- Verify props are passed correctly
- Ensure mock data matches expected shape

---

## Getting Help

If you get stuck on any step:

1. Check the verification steps in each prompt file
2. Review the expected code/SQL for reference
3. Use the testing scenarios to isolate the issue
4. Check Supabase logs and browser console

For Lovable-specific issues:
- Check the generated code matches the expected structure
- Verify all imports are correct
- Ensure no existing code was accidentally removed
