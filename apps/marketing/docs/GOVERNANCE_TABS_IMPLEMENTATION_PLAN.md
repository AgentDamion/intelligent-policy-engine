# Governance Tabs - Detailed Implementation Plan

## Overview
Fix 4 broken navigation paths in the Governance Inbox that currently redirect back to inbox instead of showing dedicated views.

**Current Issue:** All tabs in `/governance` route to placeholder cards instead of functional pages.

**Timeline:** 16 hours (1 sprint week)

**Health Impact:** Will increase Governance section from 20% → 100% link health

---

## Implementation Order

### Phase 1: Policies Tab (4 hours)
**Route:** `/governance/policies`

**Files to Create:**
- `src/pages/enterprise/governance/PoliciesPage.tsx` - Main policies view
- `src/components/governance/PolicyFilters.tsx` - Filter sidebar
- `src/components/governance/PolicyCard.tsx` - Reusable policy card

**Files to Modify:**
- `src/pages/enterprise/GovernanceInboxPage.tsx` - Replace placeholder with route
- `src/components/layout/LazyRouteManager.tsx` - Add lazy route
- `src/lib/routes.ts` - Add route definition

**Features to Implement:**
```typescript
// Core functionality
- Policy list view with status badges (draft, active, archived)
- Search and filter by:
  - Status (draft/active/archived)
  - Owner (AI agent vs human)
  - Last modified date
  - Tags/categories
- Sort by: name, date, compliance score
- Create new policy button → PolicyManager modal
- Edit policy button → PolicyManager with policy ID
```

**Data Integration:**
```typescript
// Use existing hooks/services
import { useEnterpriseData } from '@/hooks/useEnterpriseData';

// Fetch policies from governance_policies table
const { policies, loading } = useEnterpriseData();
```

**UI Components:**
- Header with title, stats, and "New Policy" CTA
- Filter sidebar (status, owner, date range)
- Grid/list view toggle
- Policy cards showing:
  - Title, version, status badge
  - Last modified date, owner
  - Quick actions: edit, archive, duplicate
  - Compliance score indicator

---

### Phase 2: Audits Tab (4 hours)
**Route:** `/governance/audits`

**Files to Create:**
- `src/pages/enterprise/governance/AuditsPage.tsx` - Main audits view
- `src/components/governance/AuditTimeline.tsx` - Timeline component
- `src/components/governance/AuditCard.tsx` - Audit event card

**Files to Modify:**
- `src/pages/enterprise/GovernanceInboxPage.tsx` - Replace placeholder
- `src/components/layout/LazyRouteManager.tsx` - Add lazy route
- `src/lib/routes.ts` - Add route definition

**Features to Implement:**
```typescript
// Core functionality
- Audit trail timeline view
- Filter by:
  - Event type (policy_created, policy_approved, etc.)
  - Date range
  - Actor (user/agent)
  - Entity (policy, submission, tool)
- Search across audit descriptions
- Export audit logs (CSV/JSON)
- Drill-down to event details
```

**Data Integration:**
```typescript
// Use existing audit infrastructure
import { supabase } from '@/integrations/supabase/client';

// Query audit_events table
const { data: audits } = await supabase
  .from('audit_events')
  .select('*')
  .order('created_at', { ascending: false });
```

**UI Components:**
- Header with date range picker and export button
- Filter sidebar (event type, actor, entity)
- Timeline view with grouped events by date
- Audit cards showing:
  - Timestamp, event type icon
  - Actor (user avatar + name or AI agent badge)
  - Event description
  - Entity link (clickable to go to policy/submission)
  - Expandable details panel

---

### Phase 3: Tools Tab (4 hours)
**Route:** `/governance/tools`

**Files to Create:**
- `src/pages/enterprise/governance/ToolsPage.tsx` - Main tools view
- `src/components/governance/ToolRiskCard.tsx` - Tool card with risk indicators
- `src/components/governance/ToolRequestForm.tsx` - New tool request form

**Files to Modify:**
- `src/pages/enterprise/GovernanceInboxPage.tsx` - Replace placeholder
- `src/components/layout/LazyRouteManager.tsx` - Add lazy route
- `src/lib/routes.ts` - Add route definition

**Features to Implement:**
```typescript
// Core functionality
- AI tools inventory view
- Filter by:
  - Risk level (low, medium, high, critical)
  - Compliance status (compliant, review needed, flagged)
  - Vendor
  - Usage status (active, pending, archived)
- Search by tool name/vendor
- Request new tool button → ToolRequestForm modal
- View tool details → Tool detail page
```

**Data Integration:**
```typescript
// Use existing governance events
const toolEvents = events.filter(e => e.type === 'tool_request');

// Could also create dedicated tools tracking table
// For now, leverage governance_events with type='tool_request'
```

**UI Components:**
- Header with stats (total tools, compliance %, high-risk count)
- Filter sidebar (risk, status, vendor)
- Grid view of tool cards showing:
  - Tool name, vendor, icon
  - Risk badge, compliance badge
  - Last reviewed date
  - Quick actions: review, flag, archive
- "Request New Tool" button → modal form

---

### Phase 4: Analytics Tab (4 hours)
**Route:** `/governance/analytics`

**Files to Create:**
- `src/pages/enterprise/governance/AnalyticsPage.tsx` - Main analytics view
- `src/components/governance/GovernanceMetricsChart.tsx` - Charts component
- `src/components/governance/ComplianceTrendChart.tsx` - Trend visualization

**Files to Modify:**
- `src/pages/enterprise/GovernanceInboxPage.tsx` - Replace placeholder
- `src/components/layout/LazyRouteManager.tsx` - Add lazy route
- `src/lib/routes.ts` - Add route definition

**Features to Implement:**
```typescript
// Core functionality
- Governance health dashboard
- Time range selector (7d, 30d, 90d, 1y)
- Key metrics:
  - Overall compliance score (trend)
  - Policy approval rate
  - Average review time
  - Active tools count
  - Risk distribution
- Charts:
  - Compliance trend over time (line chart)
  - Events by type (bar chart)
  - Risk distribution (pie chart)
  - Review velocity (area chart)
- Export analytics report (PDF/CSV)
```

**Data Integration:**
```typescript
// Aggregate from existing tables
import { useGovernanceData } from '@/hooks/useGovernanceData';

// Calculate metrics from:
// - governance_policies (approval rates)
// - audit_events (activity trends)
// - governance_events (compliance data)
```

**UI Components:**
- Header with time range selector and export button
- 4-column KPI cards (compliance, policies, tools, avg review time)
- 2-column chart layout:
  - Compliance trend (line chart)
  - Event distribution (bar chart)
  - Risk breakdown (donut chart)
  - Review velocity (area chart)
- Data table with recent significant events

---

## Technical Implementation Details

### 1. Route Configuration Changes

**In `src/lib/routes.ts`:**
```typescript
governance: {
  inbox: '/governance',
  policies: '/governance/policies',
  audits: '/governance/audits',
  tools: '/governance/tools',
  analytics: '/governance/analytics',
}
```

**In `src/components/layout/LazyRouteManager.tsx`:**
```typescript
// Add lazy imports
const GovernancePoliciesPage = lazy(() => import('@/pages/enterprise/governance/PoliciesPage'));
const GovernanceAuditsPage = lazy(() => import('@/pages/enterprise/governance/AuditsPage'));
const GovernanceToolsPage = lazy(() => import('@/pages/enterprise/governance/ToolsPage'));
const GovernanceAnalyticsPage = lazy(() => import('@/pages/enterprise/governance/AnalyticsPage'));

// Add routes
<Route path="/governance/policies" element={<GovernancePoliciesPage />} />
<Route path="/governance/audits" element={<GovernanceAuditsPage />} />
<Route path="/governance/tools" element={<GovernanceToolsPage />} />
<Route path="/governance/analytics" element={<GovernanceAnalyticsPage />} />
```

**In `src/pages/enterprise/GovernanceInboxPage.tsx`:**
```typescript
// Replace placeholder cards with navigation
<TabsContent value="policies">
  <Navigate to="/governance/policies" replace />
</TabsContent>

<TabsContent value="audits">
  <Navigate to="/governance/audits" replace />
</TabsContent>

<TabsContent value="tools">
  <Navigate to="/governance/tools" replace />
</TabsContent>

<TabsContent value="analytics">
  <Navigate to="/governance/analytics" replace />
</TabsContent>
```

### 2. Shared Components to Create

**`src/components/governance/GovernancePageLayout.tsx`:**
```typescript
// Shared layout wrapper for all governance tab pages
interface GovernancePageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
}

export const GovernancePageLayout = ({ ... }) => {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle}>
        {actions}
      </PageHeader>
      <div className="flex gap-6">
        {filters && (
          <aside className="w-64 space-y-4">
            {filters}
          </aside>
        )}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
```

**`src/components/governance/FilterSidebar.tsx`:**
```typescript
// Reusable filter component for all governance pages
interface FilterSidebarProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}
```

### 3. Data Hooks to Create

**`src/hooks/useGovernancePolicies.ts`:**
```typescript
export const useGovernancePolicies = (filters?: PolicyFilters) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch and filter policies
  // Return: { policies, loading, refetch }
};
```

**`src/hooks/useGovernanceAudits.ts`:**
```typescript
export const useGovernanceAudits = (filters?: AuditFilters) => {
  // Fetch audit events
  // Return: { audits, loading, exportAudits }
};
```

**`src/hooks/useGovernanceMetrics.ts`:**
```typescript
export const useGovernanceMetrics = (timeRange: string) => {
  // Calculate aggregated metrics
  // Return: { metrics, loading, charts }
};
```

---

## Testing Checklist

### Functional Testing
- [ ] All 4 tabs navigate to correct pages
- [ ] Back navigation returns to governance inbox
- [ ] Breadcrumbs show correct path
- [ ] Filters work and persist during session
- [ ] Search functionality works
- [ ] Sort functionality works
- [ ] Export functions work (CSV/PDF)

### Data Integration Testing
- [ ] Policies load from database
- [ ] Audit events display correctly
- [ ] Tool requests show accurate data
- [ ] Analytics calculate correct metrics
- [ ] Real-time updates work (if applicable)

### UI/UX Testing
- [ ] Loading states display correctly
- [ ] Empty states show helpful messages
- [ ] Error states handle gracefully
- [ ] Responsive design works on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility

### Performance Testing
- [ ] Pages load under 1 second
- [ ] Large datasets (100+ items) perform well
- [ ] Filter operations are instant
- [ ] No memory leaks on tab switching

---

## Success Metrics

### Before (Current State)
- Governance link health: **20%**
- Functional tabs: **1/5** (inbox only)
- User navigation dead-ends: **4**

### After (Target State)
- Governance link health: **100%**
- Functional tabs: **5/5** (all working)
- User navigation dead-ends: **0**
- Average page load time: **< 1s**
- User satisfaction: **measurable improvement**

---

## Risk Mitigation

### Risk 1: Data Schema Mismatch
**Mitigation:** Review existing database schema before implementation
**Fallback:** Use mock data with clear TODOs for backend integration

### Risk 2: Performance Issues
**Mitigation:** Implement pagination and lazy loading from start
**Fallback:** Add loading skeletons and progressive enhancement

### Risk 3: Scope Creep
**Mitigation:** Stick to MVP features defined above
**Fallback:** Create follow-up tickets for enhancement requests

---

## Follow-Up Tasks (Post-Implementation)

1. **Breadcrumb Enhancement** - Add breadcrumbs to all governance pages
2. **Deep Linking** - Support URL params for filters/search
3. **Keyboard Shortcuts** - Add shortcuts for common actions
4. **Advanced Filtering** - Add saved filter presets
5. **Bulk Actions** - Enable multi-select for batch operations
6. **Real-time Updates** - Add Supabase subscriptions for live data
7. **Mobile Optimization** - Enhance mobile layouts
8. **Accessibility Audit** - Full WCAG compliance check

---

## Implementation Schedule

### Day 1-2: Policies Tab
- Morning: Create page structure and routing
- Afternoon: Implement filters and data fetching
- Evening: Polish UI and test

### Day 3-4: Audits Tab
- Morning: Create timeline component
- Afternoon: Implement filtering and export
- Evening: Test and refine

### Day 5-6: Tools Tab
- Morning: Create tool cards and grid
- Afternoon: Implement risk indicators
- Evening: Add request form

### Day 7-8: Analytics Tab
- Morning: Create metrics dashboard
- Afternoon: Implement charts
- Evening: Final testing and polish

---

## Approval Required
- [ ] Product Owner: Approve feature scope
- [ ] Tech Lead: Approve architecture decisions
- [ ] Designer: Approve UI mockups
- [ ] QA: Approve test plan

**Ready to Begin:** Once all approvals are secured, implementation can start immediately.
