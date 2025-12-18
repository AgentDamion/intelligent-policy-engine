# End-to-End Platform Validation Checklist

## Pre-Validation Setup

✅ **Seed GlobalMed Data**
- [ ] Navigate to `/agentic?tab=test`
- [ ] Click "Seed GlobalMed Data" button
- [ ] Verify success toast shows: "430 requests, 17 violations"
- [ ] Check console for completion logs

## 4.1. Inbox Tab Validation

Navigate to: `/agentic?tab=inbox`

**Task Visibility**
- [ ] 1 inbox task appears in thread list
- [ ] Task shows: "ONCAVEX – Persado used on HCP emails"
- [ ] Priority badge displays: HIGH severity
- [ ] Metadata badges visible: 🏢 GlobalMed, 💊 ONCAVEX™, 🤖 Persado, 👨‍⚕️ HCP, 📧 Email

**Task Detail Panel**
- [ ] Click task → right panel opens
- [ ] Shows policy violation context
- [ ] Displays summary: "17 HCP emails optimized with Persado despite ONCAVEX block"
- [ ] Action buttons visible: Approve / Reject

**Actions**
- [ ] Click "Approve" → confirmation modal appears
- [ ] Click "Reject" → confirmation modal appears
- [ ] Status updates after action execution

## 4.2. Decisions Tab Validation

Navigate to: `/agentic?tab=decisions`

**Agent Decision Display**
- [ ] Agent decision narrative visible
- [ ] Shows PolicyAgent as source
- [ ] Thread ID: `globalmed-oncavex-persado-violation`

**Decision Details**
- [ ] Outcome: BLOCKED
- [ ] Risk: HIGH
- [ ] Tool: Persado Motivation AI
- [ ] Brand: ONCAVEX™
- [ ] Audience: HCP

**Policy References**
- [ ] Policy snapshot ID: EPS-131 visible
- [ ] Compliance framework citations shown
- [ ] Failed checks listed:
  - [ ] Audience restriction
  - [ ] Brand override
  - [ ] MLR reference

**Dimension Scores**
- [ ] Policy Compliance: 0%
- [ ] Brand Alignment: 0%
- [ ] Regulatory Risk: 95%
- [ ] Audit Readiness: 40%

## 4.3. Weave Tab (Simulation) Validation

Navigate to: `/agentic?tab=weave`

**Simulation Run Visibility**
- [ ] 1 simulation run appears
- [ ] Scenario: "ONCAVEX + Persado Historical Replay (90 days)"
- [ ] Status: COMPLETED
- [ ] Validation Result: BLOCKED

**Input Display**
- [ ] Policy Profile: GlobalMed – AI Tool Usage v1
- [ ] Brand: ONCAVEX™
- [ ] Tool: Persado
- [ ] Time Period: 90 days
- [ ] Requests Analyzed: 430

**Output/Results**
- [ ] Compliance Score: 0%
- [ ] Allowed: NO

**Violations Listed**
- [ ] BRAND_OVERRIDE_VIOLATION (critical): "ONCAVEX brand override explicitly disallows Persado"
- [ ] AUDIENCE_MISMATCH (high): "Persado only allowed for patient/caregiver, not HCP"
- [ ] MISSING_MLR_REFERENCE (high): "No MLR reference ID provided"

**Simulation Metrics**
- [ ] Total Requests: 430
- [ ] Persado Requests: 17
- [ ] Block Rate: 3.95%
- [ ] Decision Flips: 17
- [ ] Agencies: IPG Health, Omnicom Health

## 4.4. Middleware Tab Validation

Navigate to: `/agentic?tab=middleware`

**Request List**
- [ ] 430 middleware requests visible
- [ ] List shows most recent requests first
- [ ] Each row displays: timestamp, model, partner, decision

**Filter: Policy Decision**
- [ ] Click "Blocked" filter
- [ ] 17 violation requests displayed
- [ ] All show: `policy_decision = 'block'`
- [ ] All model: `persado-v2024.3`

**Filter: Partner**
- [ ] Filter by "IPG Health" → shows subset
- [ ] Filter by "Omnicom Health" → shows subset
- [ ] Clear filters → shows all 430 again

**Detail Panel**
- [ ] Click violation request → right panel opens
- [ ] Shows full request context:
  - [ ] Brand: ONCAVEX™
  - [ ] Audience: HCP
  - [ ] Channel: email
  - [ ] Content Type: subject_line
- [ ] Policy Evaluation section shows:
  - [ ] Checks Run: 3
  - [ ] Checks Passed: 0
  - [ ] Failed Requirements listed (3 items)
- [ ] Proof Bundle visible with bundle_id

**Navigation Links**
- [ ] "View Policy" link → navigate to Configuration
- [ ] "Create Task" action → opens Inbox with new alert

## 4.5. Configuration Tab Validation

Navigate to: `/agentic?tab=configuration`

**AI Tool Registry**
- [ ] 5 AI tools displayed:
  1. [ ] Persado Motivation AI
  2. [ ] AuroraPrime Analytics
  3. [ ] SmartFigures Designer
  4. [ ] Viseven Studio
  5. [ ] BastionGPT

**Persado Tool Details**
- [ ] Click Persado → detail panel opens
- [ ] Deployment Status: APPROVED
- [ ] Risk Tier: MEDIUM
- [ ] Jurisdictions: GDPR, HIPAA
- [ ] Data Sensitivity: PII
- [ ] Description visible

**Dependency Mapping** (if implemented)
- [ ] Shows which policies reference Persado
- [ ] "View Violations" link → navigate to Middleware filtered by Persado

## 4.6. Cross-Navigation Flow

**Complete Governance Loop Test**

1. **Start in Middleware**
   - [ ] Navigate to `/agentic?tab=middleware`
   - [ ] Filter by "Blocked" decisions
   - [ ] Click first Persado violation

2. **Navigate to Configuration**
   - [ ] In detail panel, click "View Policy" or "View Tool"
   - [ ] Opens Configuration tab
   - [ ] Persado tool highlighted
   - [ ] Shows deployment_status = 'approved' (base policy allows it)

3. **Navigate Back to Middleware**
   - [ ] Click "View Violations" from Configuration
   - [ ] Returns to Middleware
   - [ ] Pre-filtered to show only Persado requests

4. **Create Inbox Task**
   - [ ] From Middleware detail panel, click "Create Task"
   - [ ] Opens Inbox tab
   - [ ] New alert task appears at top
   - [ ] Task references the violation request

5. **Simulate Fix in Weave**
   - [ ] From Inbox task detail, click "Simulate Fix"
   - [ ] Opens Weave tab
   - [ ] Pre-configured with draft policy change
   - [ ] Shows predicted impact if policy updated

6. **Context Preservation**
   - [ ] Navigate between tabs using top navigation
   - [ ] Selected enterprise/workspace persists
   - [ ] Filters/selections remain applied
   - [ ] Detail panels maintain state

## Success Criteria Checklist

✅ **Seeding Works**
- [ ] No RLS errors in console
- [ ] Completes in < 10 seconds
- [ ] Success toast shows accurate stats

✅ **Data Visible**
- [ ] All 4 tabs (Inbox, Decisions, Weave, Middleware) show GlobalMed data
- [ ] Configuration tab shows 5 AI tools
- [ ] No "No data" empty states

✅ **Context Correct**
- [ ] AgenticHeader shows: "GlobalMed Therapeutics > ONCAVEX™ Workspace"
- [ ] Enterprise context consistent across tabs
- [ ] Workspace selector (if implemented) shows 3 workspaces

✅ **Navigation Flows**
- [ ] Can move between tabs with context preservation
- [ ] Deep links work correctly
- [ ] Detail panels open/close properly

✅ **Real-time Updates** (Middleware tab)
- [ ] Real-time subscription connected (check Network tab for websocket)
- [ ] New middleware requests appear without refresh
- [ ] Stats cards update dynamically

✅ **Actions Work**
- [ ] Inbox approve/reject executes successfully
- [ ] Simulation runs can be initiated
- [ ] Filters apply correctly

## Performance Validation

**Load Time**
- [ ] Initial page load < 3 seconds
- [ ] Tab switching < 500ms
- [ ] Detail panel open < 300ms

**Data Queries**
- [ ] Middleware list loads all 430 requests < 2 seconds
- [ ] Pagination (if implemented) works smoothly
- [ ] Filters apply instantly (< 100ms)

**Real-time Performance**
- [ ] Websocket connection established
- [ ] No message lag or delay
- [ ] UI updates smoothly without flicker

## Error Handling

**Network Errors**
- [ ] Simulate offline → shows error message
- [ ] Network recovery → auto-reconnects

**Invalid State**
- [ ] Navigate to non-existent thread → shows 404 or redirect
- [ ] Access denied → shows permission error

**Data Integrity**
- [ ] No orphaned foreign key errors
- [ ] No null pointer exceptions
- [ ] No console errors during normal operation

## Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile responsive (if applicable)

## Final Sign-Off

**Platform Ready for Demo**
- [ ] All validation steps pass
- [ ] No critical bugs observed
- [ ] Performance acceptable
- [ ] Navigation flows work end-to-end

**Known Issues/Limitations**
- Document any issues found during validation:
  - Issue 1: _______________________
  - Issue 2: _______________________
  - Issue 3: _______________________

**Validation Completed By**: _______________
**Date**: _______________
**Duration**: _______________ minutes
