# Proof Bundle Viewer Implementation Plan

## Goal

Build a regulatory-ready Proof Bundle Viewer that displays complete decision records with cryptographic verification, policy context, and export capabilities, using the AICOMPLYR edge-defined design system.

## Current State

- Existing `ProofBundleViewer.tsx` uses old design system (rounded corners, soft colors)
- `ProofBundleCard.tsx` exists as a demo component with new design system
- Proof bundle service provides full data structure (`ProofBundle` interface)
- Verification service exists (`proofBundleVerifier`)
- Evidence Vault page (`/proof`) uses split-view layout

## Target Design

Based on wireframes, the viewer should display:
- **Header**: Breadcrumbs, decision status badge, confidence score with colored dot, action buttons (Export, Verify, Share, Replay Decision)
- **Status Banner**: Full-width semantic color banner (Green for Approved, Yellow for Conditional, Red for Denied, Amber for Escalated)
- **Left Panel**: Decision record card with boundary, request details, governance, accountability, **footer with "Boundary Governed" indicator and yellow dot**
- **Right Panel**: Policy context, triggered rules, conditions, precedent analysis, agent reasoning trace, cryptographic verification, related artifacts

## Implementation Plan

### Phase 1: Refactor Core Viewer Component

**File**: `apps/platform/src/components/proof-bundle/ProofBundleDetailViewer.tsx`

**Tasks**:
1. Create new component using edge-defined design system
2. Replace old `ProofBundleViewer` imports with new primitives:
   - `EdgeCard`, `EdgeCardHeader`, `EdgeCardBody`, `EdgeCardFooter`
   - `StatusBanner` for full-width status display
   - `StatusBadge` for decision status
   - `Button` from `aicomplyr-button.tsx`
3. Structure layout as two-column (decision record left, context right)
4. Integrate with existing `proofBundleService` and `proofBundleVerifier`

**Key Sections**:
- **Header Bar**: Breadcrumbs, status badge, confidence indicator with colored dot (green >90%, amber 70-90%, red <70%), action buttons
- **Status Banner**: Full-width semantic color banner:
  - Approved: Green (#16A34A)
  - Conditional: Yellow (#FFE500)
  - Denied: Red (#DC2626)
  - Escalated: Amber (#F59E0B)
- **Decision Record Card** (Left):
  - Boundary indicator (Enterprise → Partner)
  - Request details (Tool, Use Case, Risk Level)
  - Governance (Policy ID, Conditions)
  - Accountability (Approver, Authority, Rationale)
  - **Footer**: Timestamp (mono-id format), Decision ID (mono-id format), **"● Boundary Governed." with yellow dot (#FFE500)**
- **Policy Context Panel** (Right):
  - Active Policy info with link
  - Triggered Rules (expandable cards with explicit edge colors: yellow for informational, amber for conditional)
  - Policy Snapshot (truncated hash: first 6 chars + ellipsis, snapshot ID, "View Snapshot" link)
  - Conditions & Requirements (expandable list)
  - Precedent Analysis
  - Agent Reasoning Trace (agent names, contributions, reasoning chain)
  - Cryptographic Verification status
  - Related Artifacts

**Skeleton Loading State** (Phase 1):
- Gray-200 placeholder blocks maintaining edge-defined card structure
- No shimmer animation (static placeholders only)
- Preserves layout structure during load

### Phase 2: Build Supporting Components

**File**: `apps/platform/src/components/proof-bundle/TriggeredRuleCard.tsx`
- Edge-defined card with explicit variant prop: `variant: 'informational' | 'conditional'`
- **Edge Color Mapping**:
  - `informational`: Yellow (#FFE500) - e.g., "Tool is in approved registry"
  - `conditional`: Amber (#F59E0B) - e.g., "Human review required"
- Shows rule title, description, match criteria, action
- Background tint matches edge color (yellow-50 for informational, amber-50 for conditional)

**File**: `apps/platform/src/components/proof-bundle/ConditionList.tsx`
- Expandable accordion list
- Each condition shows source rule, verification method, status
- Uses edge-defined styling

**File**: `apps/platform/src/components/proof-bundle/CryptographicVerificationPanel.tsx`
- Shows hash verification status
- Signature verification (if present)
- Ledger chain verification
- Uses checkmarks/X icons with status colors

**File**: `apps/platform/src/components/proof-bundle/PrecedentAnalysisPanel.tsx`
- Shows count of similar decisions
- Approval rate percentage with progress bar
- "View all" link to precedent decisions

**File**: `apps/platform/src/components/proof-bundle/AgentReasoningTrace.tsx`
- Shows agent count and processing time (e.g., "3 agents • 847ms")
- **Expandable section** showing:
  - Agent names (Policy Matcher, Risk Assessor, Precedent Analyzer)
  - Each agent's contribution to the decision
  - Reasoning chain (if available in `traceContext`)
- Designed to accommodate rich trace data when available
- Uses edge-defined accordion styling

### Phase 3: Integrate with Existing Services

**Updates to**: `apps/platform/src/components/proof-bundle/ProofBundleDetailViewer.tsx`

1. **Data Fetching**:
   - Use `getProofBundle(proofBundleId)` from `proofBundleService`
   - Use `verifyProofBundle(proofBundleId)` from `proofBundleVerifier`
   - Handle loading and error states

2. **Policy Context**:
   - Fetch policy snapshot if `epsSnapshotId` exists
   - Display policy version and effective date
   - **Policy Snapshot Hash Display**:
     - Format: "Snapshot ID: snap-2024-0847 • Hash: sha256:a1b2c3..."
     - Truncate hash: first 6 characters + ellipsis + last 4 characters
     - "View Snapshot →" link to full snapshot view
   - Link to full policy view

3. **Triggered Rules**:
   - Extract from `rationaleStructured.secondary_rules` or `atomStatesSnapshot.policyReasons`
   - Map to rule cards with appropriate styling

4. **Conditions**:
   - Parse from decision metadata or policy evaluation results
   - Display verification status (Manual attestation, Automated scanning, Submission tracking)

5. **Precedent Analysis**:
   - Query similar decisions (same tool + use case)
   - Calculate approval rate percentage
   - Display as progress bar (green for approval rate)
   - "View all →" link to decision history filtered by criteria

6. **Confidence Score**:
   - Source: `rationaleStructured.confidence_score` (0-1 range)
   - Display as percentage (e.g., "94% confidence")
   - **Thresholds**:
     - >90%: Green dot (#16A34A)
     - 70-90%: Amber dot (#F59E0B)
     - <70%: Red dot (#DC2626)
   - If not available, show "N/A" with gray dot

### Phase 4: Export and Action Functionality

**File**: `apps/platform/src/components/proof-bundle/ProofBundleActions.tsx`

1. **Export Button** (Primary CTA):
   - **Default action**: Export JSON proof bundle with cryptographic hashes
   - Machine-readable format for regulatory compliance
   - Includes: bundle data, hashes, verification status, policy snapshot
   - File naming: `proof-bundle-{decisionId}.json`
   - **Secondary action** (dropdown): "Download Report" → PDF summary for human review
   - Positions AICOMPLYR as infrastructure (machine-readable artifacts), not just reporting tool

2. **Verify Button**:
   - Trigger `verifyProofBundle()` on click
   - **Verification Modal** (edge-defined design):
     - Edge-defined modal container (4px left border)
     - Title: "Cryptographic Verification"
     - Diagnostic-style display (not friendly popup):
       - Hash verification: ✓ or ✗ with status
       - Policy snapshot integrity: ✓ or ✗ with status
       - Signature verification: ✓ or ✗ (if applicable)
       - Ledger chain verification: ✓ or ✗ (if applicable)
     - Summary: "All checks passed" (green) or "Verification failed: [reason]" (red)
     - Close button (tertiary style)

3. **Share Button**:
   - Generate shareable link with proof bundle ID
   - Copy to clipboard with toast notification

4. **Replay Decision Button**:
   - Navigate to `/lab/replay` with proof bundle context
   - Pre-fill decision replay form with bundle data

### Phase 5: Update Evidence Vault Page

**File**: `apps/platform/src/pages/proof/Vault.tsx`

1. Replace old `ProofBundleViewer` import with new `ProofBundleDetailViewer`
2. Update action buttons to use new AICOMPLYR button styles
3. Ensure split-view layout works with new component
4. Remove demo `ProofBundleCard` from empty state (or keep as example)

### Phase 6: Responsive Design and Edge Cases

1. **Responsive Strategy** (Professional Tool Approach):
   - **Desktop**: Full two-column layout (default)
   - **Tablet**: Maintain two-column with narrower panels (min-width: 768px)
   - **Mobile** (< 768px):
     - Show summary card with key info
     - "Open full viewer" link/button
     - OR: Show notice "View on desktop for full regulatory review experience"
     - **Do NOT stack panels** - this is a professional audit tool, not casual browsing
   - Status banner always full-width
   - Collapse expandable sections by default on mobile

2. **Loading States**:
   - **Skeleton Loaders** (defined in Phase 1):
     - Gray-200 (#E5E5E5) placeholder blocks
     - Maintains edge-defined card structure (4px left border)
     - Static placeholders (no shimmer animation - too playful)
     - Preserves exact layout structure during load
   - Show loading spinner in header during verification

3. **Error States**:
   - Display error message in edge-defined card
   - Provide retry button
   - Handle missing data gracefully (show "—" for empty fields)

4. **Empty States**:
   - When no triggered rules: "No additional rules triggered"
   - When no conditions: "No conditions attached"
   - When no precedents: "No similar decisions found"

## Design System Compliance

All components must use:
- **Edge-defined cards**: 4px left border (black default, yellow selected, amber attention)
- **Status badges**: Solid fills, squared corners, uppercase text
- **Status banner colors**: Semantic mapping (Approved=green, Conditional=yellow, Denied=red, Escalated=amber)
- **Typography**: Archivo Black for display, Inter for body, SF Mono for IDs
- **Colors**: 
  - AICOMPLYR yellow (#FFE500) for selected states and boundary indicator
  - Semantic status colors for banners (not always yellow)
- **Spacing**: 4px increments (16px, 24px, 32px)
- **No border radius**: All corners squared (0px) - **CRITICAL: Audit all CSS**
- **Yellow usage**: Only for selected/active states, boundary indicators, conditional status - NOT decorative

## Data Mapping

Map `ProofBundle` interface fields to UI:

- `decision` → Status Banner variant (mapped to semantic colors: approved=green, conditional=yellow, denied=red, escalated=amber)
- `rationaleHuman` → Decision summary text
- `rationaleStructured` → Policy context, triggered rules
- `rationaleStructured.confidence_score` → Confidence indicator (0-1 → percentage, with color thresholds)
- `epsSnapshotId`, `epsHash` → Policy Snapshot section (truncated hash display)
- `policyDigest` → Cryptographic verification
- `contentHash`, `signatureHash` → Verification panel
- `regulatoryCompliance` → Regulatory frameworks section
- `traceId`, `traceContext` → Agent reasoning trace (agent names, contributions, reasoning chain)
- `createdAt` → Timestamp display (ISO format in mono-id)
- `id` → Decision ID (format: DEC-YYYY-####-EC-AP, displayed in mono-id)
- Boundary context → Footer "● Boundary Governed." with yellow dot (#FFE500)

## Testing Checklist

### Core Functionality
- [ ] Proof bundle loads and displays all sections
- [ ] Status banner shows correct semantic color (approved=green, conditional=yellow, denied=red, escalated=amber)
- [ ] **Boundary Governed indicator appears in footer with yellow dot (#FFE500)**
- [ ] Triggered rules display with correct edge colors (yellow for informational, amber for conditional)
- [ ] Conditions expand/collapse correctly
- [ ] Cryptographic verification shows correct status
- [ ] Export generates valid JSON (primary) and PDF (secondary)
- [ ] Verify button triggers verification modal with diagnostic display
- [ ] Replay Decision navigates correctly

### Design System Compliance
- [ ] **Yellow edges appear ONLY for selected/active states, not as default**
- [ ] **No border-radius anywhere (audit CSS for 0px)**
- [ ] Edge-defined cards use 4px left border
- [ ] Status badges use solid fills with squared corners
- [ ] Typography: Archivo Black for display, Inter for body
- [ ] Spacing uses 4px increments

### Data Display
- [ ] Confidence score displays with correct color thresholds (>90%=green, 70-90%=amber, <70%=red)
- [ ] Policy snapshot hash truncates correctly (first 6 chars + ellipsis + last 4 chars)
- [ ] Timestamp and Decision ID use mono-id styling
- [ ] Agent reasoning trace shows agent names and contributions (when available)

### Responsive & Edge Cases
- [ ] Desktop: Full two-column layout
- [ ] Tablet: Two-column with narrower panels
- [ ] Mobile: Summary card with "Open full viewer" option (panels do NOT stack)
- [ ] Loading skeleton uses static gray-200 placeholders (no shimmer)
- [ ] Error states display in edge-defined cards
- [ ] Empty states show appropriate messages

## Dependencies

- Existing services: `proofBundleService`, `proofBundleVerifier`
- New UI primitives: `EdgeCard`, `StatusBadge`, `StatusBanner`, `Button`
- Icons: `lucide-react` (Shield, CheckCircle, XCircle, AlertTriangle, etc.)
- Routing: `react-router-dom` for navigation
- Toast: `react-hot-toast` for notifications

## Data Model Dependencies & Risks

**Confidence Score**:
- Source: `rationaleStructured.confidence_score` (0-1 range)
- **Risk**: If this field doesn't exist in current `ProofBundle` interface, either:
  - Add to Phase 1 as "N/A" placeholder with gray dot
  - OR: Flag as dependency and add to future phase
  - UI should gracefully handle missing confidence data

**Agent Reasoning Trace**:
- Source: `traceContext` field
- **Risk**: Current data may only have `traceId` and basic `traceContext`
- **Solution**: Design UI to accommodate rich trace data when available, show basic info (agent count, processing time) if not
- Future enhancement: Expand trace display when richer data is available

## Estimated Effort

- Phase 1 (Core Viewer): 4-6 hours
- Phase 2 (Supporting Components): 3-4 hours
- Phase 3 (Service Integration): 2-3 hours
- Phase 4 (Actions): 2-3 hours
- Phase 5 (Page Update): 1 hour
- Phase 6 (Responsive/Edge Cases): 2-3 hours

**Total**: 14-20 hours

## Success Criteria

1. Viewer displays complete proof bundle data using edge-defined design system
2. All sections match wireframe layout and styling
3. **Boundary Governed footer appears with yellow dot** - signature mark of enterprise-partner governance
4. Status banners use correct semantic colors (not always yellow)
5. Export defaults to JSON (infrastructure positioning), PDF as secondary
6. Verification modal shows diagnostic-style results (not friendly popup)
7. Agent reasoning trace accommodates rich data when available
8. Policy snapshot hash displays with proper truncation format
9. Confidence indicator uses correct thresholds and colors
10. Responsive design maintains professional tool positioning (no mobile stacking)
11. No console errors or TypeScript warnings
12. **Zero border-radius violations** - all corners squared

