# Weave Interface Documentation

## Overview
Weave is the agent-first conversational governance interface for aicomply.io. It displays multi-agent policy dialogues in a split-panel layout optimized for decision-maker visibility into autonomous AI compliance workflows.

---

## Route Contract

### Primary Route
**Path:** `/agentic?tab=weave`

### Deep Links
- **Spine Handoff:** `/spine?t={threadId}`
  - Navigates from Weave conversation to Spine decision interface
  - Preserves thread context via query parameter
  - Example: `/spine?t=thread-1`

### Query Parameters
- `tab` (optional): Selects active tab in Agentic UI
  - Values: `weave` | `spine` | `constellation` | `workbench`
  - Default: `weave`

---

## Layout Dimensions

### Fixed Measurements
| Element | Dimension | Constant |
|---------|-----------|----------|
| Header | 64px | `WEAVE_LAYOUT.HEADER_HEIGHT` |
| Left Panel | 360px | `WEAVE_LAYOUT.INBOX_WIDTH` |
| Message Max Width | 640px | `WEAVE_LAYOUT.MESSAGE_MAX_WIDTH` |

### Spacing System
Based on 8px baseline grid:
- `s1`: 8px
- `s2`: 16px
- `s3`: 24px
- `s4`: 32px
- `s5`: 40px
- `s6`: 48px

---

## Component API

### ACPill
```tsx
interface ACPillProps {
  label: string;
  kind?: 'agent' | 'human' | 'status' | 'fact';
  selected?: boolean;
  onClick?: () => void;
}
```
**Styling:**
- Height: 28px
- Border radius: r2 (10px)
- Agent pills: Black background (ink-900)
- Status/Fact pills: Light background (surface-50) with hairline border

---

### ACAgentAvatar
```tsx
interface ACAgentAvatarProps {
  initial: string;  // Agent name or identifier
}
```
**Styling:**
- Size: 28px circle
- Background: ink-800
- Text: White, extracted initial letter

---

### ACAgentMsg
```tsx
interface ACAgentMsgProps {
  id?: string;
  agent: string;
  time: string;
  text: string;
  chips?: { label: string; kind?: 'agent' | 'status' | 'fact' }[];
}
```
**Layout:**
- Avatar + metadata line (mono, 12px)
- Message bubble (r2 border, surface-0 background)
- Optional chips row below message

---

### ThreadListItem
```tsx
interface ThreadListItemProps {
  id: string;
  title: string;
  pills: { label: string; kind?: 'agent' | 'human' | 'status' | 'fact' }[];
  meta: string;
  status: string;
  participantCount: number;
  active?: boolean;
  onClick?: () => void;
}
```
**States:**
- Active: surface-0 background, ink-300 border
- Inactive: Transparent, hover shows surface-0

---

### ConversationStream
```tsx
interface ConversationStreamProps {
  threadId: string;
  threadTitle: string;
  messages: TransformedMessage[];
  startedTime?: string;
  exchangeCount?: number;
  participantCount?: number;
  isLoading?: boolean;
  isTyping?: boolean;
}
```
**Features:**
- Header with title + metadata
- CTA buttons ("Summarize to Spine", "View Proof Bundle")
- Message list with loading/typing states
- Empty state with guidance text

---

## Typography

| Element | Size/Height | Weight | Color |
|---------|-------------|--------|-------|
| Titles (h2) | 18px / 28px | 600 (semibold) | ink-900 |
| Body Text | 14px / 20px | 400 (regular) | ink-900 |
| Mono/Meta | 12px / 16px | 400 (regular) | ink-500 |

---

## Accessibility (A11y)

### ARIA Roles
- **Thread List:** `role="list"`, items with `role="listitem"`
- **Messages:** `role="article"` with `aria-labelledby`
- **Tabs:** `role="tablist"`, tabs with `role="tab"` and `aria-selected`

### Keyboard Navigation
| Key | Action |
|-----|--------|
| `Enter` | Open first thread if none selected |
| `/` | Focus "Ask the agents" input |
| `ESC` | Clear input field |
| `Tab` | Navigate focusable elements |

### Focus Indicators
- All interactive elements have `focus:shadow-focus-ring`
- Focus ring: 2px offset, ink-500 color
- WCAG AA contrast: 4.5:1 minimum for text

### Screen Readers
- Loading states: `role="status"`, `aria-live="polite"`
- Typing indicator: `aria-live="polite"`
- All inputs: Proper `aria-label` attributes

---

## Data Hooks (E2E Testing)

### Layout Level
```html
<div data-weave-layout>
  <aside data-inbox-width="360">
  <main data-message-max-width="640">
```

### Thread Level
```html
<button 
  data-thread-id="thread-1"
  data-thread-status="active"
  data-participant-count="4"
>
```

### Message Level
```html
<article 
  data-agent="PolicyAgent"
  data-message-id="msg-1"
  data-timestamp="14:32"
>
```

### Component Level
```html
<span data-pill-kind="agent">PolicyAgent</span>
<div data-proof-bundle="bundle-thread-1">
<div data-chip-container>
  <span data-pill-kind="fact">Pattern: Policy drift</span>
</div>
```

---

## States

### Empty State
- No active threads
- Message: "No active conversations" + "Agent activities will appear here"
- Mono font, ink-500/ink-300 colors

### Loading State
- Skeleton placeholders (ThreadListSkeleton, MessageSkeleton)
- Animated pulse effect
- 3 thread skeletons by default

### Error State
- Banner with error message
- Mono text: "Failed to load agent conversations"
- Retry button (solid black, ink-900)

### Typing Indicator
- Three bouncing dots (ink-300)
- Animated with staggered delay
- Text: "Agent is thinking" (mono, ink-500)

---

## Design Constraints

### Grayscale Only
- `ink` tokens: ink-100 through ink-900
- `surface` tokens: surface-0, surface-50
- No color palette allowed

### Prohibited Patterns
- ❌ KPI tiles or metric cards
- ❌ Generic table toolbars
- ❌ Non-lucide icons
- ❌ SaaS template patterns
- ❌ Dashboard layouts

### Allowed Elements
- ✅ Conversational message streams
- ✅ Agent-first interactions
- ✅ Grayscale pills and avatars
- ✅ Mono typography for metadata
- ✅ Clean, minimal interfaces

---

## QA Checklist

Before shipping Weave features:

**Visual:**
- [ ] Left panel shows agent + status chips for each thread
- [ ] Messages display initial avatars
- [ ] Inline chips show pattern/evidence/root cause labels
- [ ] "View Proof Bundle" button present in conversation header
- [ ] "Summarize to Spine" link exists and works
- [ ] Strict grayscale enforced (no colors)

**Interaction:**
- [ ] Clicking thread selects it
- [ ] Input accepts text and sends on Enter
- [ ] ESC clears input field
- [ ] / focuses input from anywhere
- [ ] Enter opens first thread if none selected

**Accessibility:**
- [ ] Tab order is logical
- [ ] Focus rings visible on all interactive elements
- [ ] Screen reader announces loading states
- [ ] WCAG AA contrast verified (4.5:1 minimum)
- [ ] All ARIA roles present and correct

**Data Hooks:**
- [ ] All elements have required data-* attributes
- [ ] E2E tests can select threads by data-thread-id
- [ ] Messages identifiable by data-message-id
- [ ] Pills identifiable by data-pill-kind

---

## Example Usage

```tsx
import { WeaveLayout } from '@/components/agentic/weave/WeaveLayout';

// In your route component
<Route path="/agentic" element={<WeaveLayout />} />

// Deep link to Spine
<Link to={`/spine?t=${threadId}`}>Summarize to Spine</Link>

// Access layout constants
import { WEAVE_LAYOUT } from '@/constants/weave';
console.log(WEAVE_LAYOUT.INBOX_WIDTH); // 360
```

---

## Future Enhancements

- Real-time subscriptions to agent messages
- Thread filtering and search
- Proof bundle inline preview
- Agent performance metrics
- Thread archiving and export
