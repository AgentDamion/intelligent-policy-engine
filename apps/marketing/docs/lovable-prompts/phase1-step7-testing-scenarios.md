# Phase 1, Step 7: Testing Scenarios

## Test Scenario 1: All Tools Compliant

**Setup:**
```typescript
// Use mockPolicyPack with only compliant disclosures
const disclosures = [
  {
    tool_name: 'ChatGPT Enterprise',
    version: 'GPT-4o-2024-05-13',
    provider: 'OpenAI',
    data_scope: { pii: false, hipaa: false, regions: ['US', 'EU'] }
  },
  {
    tool_name: 'Adobe Firefly',
    version: '3.0',
    provider: 'Adobe',
    data_scope: { pii: false, hipaa: false, regions: ['US'] }
  }
];
```

**Expected Result:**
- Overall score: 100%
- All tools show COMPLIANT status with green checkmarks
- No failed controls
- No reasons listed

**UI Verification:**
- PolicyResolutionPanel shows "100%" in green
- "2 Compliant" counter
- Each tool has green CheckCircle2 icon
- COMPLIANT badges are green

---

## Test Scenario 2: Mixed Compliance

**Setup:**
```typescript
const disclosures = [
  {
    tool_name: 'ChatGPT Enterprise',
    version: 'GPT-4o-2024-05-13', // approved
    provider: 'OpenAI',
    data_scope: { pii: false, hipaa: false, regions: ['US', 'EU'] }
  },
  {
    tool_name: 'Midjourney',
    version: 'v6', // not in whitelist
    provider: 'Midjourney Inc',
    data_scope: { pii: false, hipaa: false, regions: ['US'] }
  },
  {
    tool_name: 'Claude API',
    version: 'claude-3-opus-20240229', // not in whitelist
    provider: 'Anthropic',
    data_scope: { pii: false, hipaa: false, regions: ['US'] }
  }
];
```

**Expected Result:**
- Overall score: 33% (1 of 3 compliant)
- ChatGPT: COMPLIANT
- Midjourney: PENDING (reason: "Tool not in approved whitelist")
- Claude: PENDING (reason: "Tool not in approved whitelist")

**UI Verification:**
- PolicyResolutionPanel shows "33%" in red/yellow
- "1 Compliant, 2 Pending" counters
- Expandable details show reasons
- Yellow AlertCircle icons for pending items

---

## Test Scenario 3: Version Mismatch

**Setup:**
```typescript
const disclosures = [
  {
    tool_name: 'ChatGPT Enterprise',
    version: 'GPT-3.5-turbo', // version not approved
    provider: 'OpenAI',
    data_scope: { pii: false, hipaa: false, regions: ['US', 'EU'] }
  }
];
```

**Expected Result:**
- Overall score: 0%
- Status: PENDING
- Reason: "Version not approved"
- Failed control: CTRL-VERS-001

**UI Verification:**
- Expandable details show failed control badge
- Reason clearly states version issue

---

## Test Scenario 4: Data Scope Mismatch

**Setup:**
```typescript
const disclosures = [
  {
    tool_name: 'ChatGPT Enterprise',
    version: 'GPT-4o-2024-05-13',
    provider: 'OpenAI',
    data_scope: { pii: true, hipaa: true, regions: ['US', 'EU'] } // PII/HIPAA not allowed
  }
];
```

**Expected Result:**
- Overall score: 0%
- Status: PENDING
- Reason: "Data scope does not match approved configuration"
- Failed control: CTRL-DATA-002

---

## Test Scenario 5: Empty State

**Setup:**
```typescript
// No disclosures added yet
const disclosures = [];
```

**Expected UI:**
- Empty state card with AlertCircle icon
- Message: "No validation results yet. Add tools and run validation."
- "Validate Tools" button (if onValidate provided)

---

## Test Scenario 6: Loading State

**Setup:**
```typescript
<PolicyResolutionPanel loading={true} />
```

**Expected UI:**
- Header shows "Validating Tools..." with spinning Loader2 icon
- 3 skeleton placeholders (animated pulse)

---

## Test Scenario 7: Error State

**Setup:**
```typescript
<PolicyResolutionPanel 
  error="Policy pack not found or no whitelist configured" 
  onValidate={handleRetry}
/>
```

**Expected UI:**
- Red error title
- Error message displayed
- "Retry Validation" button

---

## Integration Test: Full Flow

**Steps:**
1. Open RFP response page
2. Add 3 tool disclosures (mix of compliant/pending)
3. Click "Validate Tools"
4. Verify loading state appears
5. Verify PolicyResolutionPanel renders with correct scores
6. Expand pending items to see reasons
7. Verify failed control badges appear
8. Click "Re-validate Tools"
9. Verify re-validation works

**Expected Database State:**
```sql
-- Should see entries in:
SELECT * FROM rfp_tool_disclosures WHERE distribution_id = 'test-dist-id';
-- Should return 3 rows

SELECT * FROM policy_resolutions WHERE distribution_id = 'test-dist-id';
-- Should return 1 row with overall_score and resolution_data
```

---

## RLS Security Tests

**Test 1: Agency can save their own disclosures**
```typescript
// As agency user in workspace X
await rfpService.saveToolDisclosures(distributionId, disclosures);
// Should succeed
```

**Test 2: Agency cannot save disclosures for other RFPs**
```typescript
// As agency user in workspace X
await rfpService.saveToolDisclosures(otherDistributionId, disclosures);
// Should fail with RLS policy violation
```

**Test 3: Enterprise can view disclosures for their RFPs**
```typescript
// As enterprise user who sent the RFP
const disclosures = await rfpService.getToolDisclosures(distributionId);
// Should return all disclosures
```

**Test 4: Enterprise cannot view disclosures for other enterprises**
```typescript
// As enterprise user A
const disclosures = await rfpService.getToolDisclosures(enterpriseBDistributionId);
// Should return empty array (RLS blocks access)
```

---

## Performance Tests

**Test 1: Large disclosure set**
- Add 50 tool disclosures
- Validate
- Verify UI renders without lag
- Check edge function completes within 5 seconds

**Test 2: Re-validation**
- Run validation twice in quick succession
- Verify second resolution is created
- Verify latest resolution is fetched correctly

---

## Manual QA Checklist

- [ ] Compliant tools show green checkmarks
- [ ] Pending tools show yellow warning icons
- [ ] Restricted tools show red X icons (if implemented)
- [ ] Overall score calculates correctly
- [ ] Counters match actual tool counts
- [ ] Expandable details work (click to expand/collapse)
- [ ] Failed controls show as badges
- [ ] Reasons are human-readable
- [ ] Empty state shows when no validation
- [ ] Loading state shows spinner and skeletons
- [ ] Error state shows message and retry button
- [ ] Re-validate button works
- [ ] Responsive on mobile (stacks properly)
- [ ] Colors use semantic tokens (not hardcoded)
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader announces status
