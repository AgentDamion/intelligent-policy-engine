# Weave UI Tokens (W0 Guardrails)

This document defines the design tokens and constraints for the Weave agent-first conversation interface. All Weave components **must** adhere to these tokens.

## Colors (Grayscale Only)

Weave uses a strictly grayscale palette. No colors are permitted.

### Ink (Text & Foreground)
- **ink.900**: `#111111` — Primary text, highest contrast
- **ink.800**: `#1A1A1A` — Agent avatars, strong elements
- **ink.700**: `#2B2B2B` — Secondary text
- **ink.500**: `#666666` — Meta text, timestamps
- **ink.300**: `#A6A6A6` — Disabled text, placeholders
- **ink.200**: `#C9C9C9` — Borders, dividers
- **ink.100**: `#EAEAEA` — Subtle dividers

### Surface (Backgrounds)
- **surface.0**: `#FFFFFF` — Primary backgrounds
- **surface.50**: `#FAFAFA` — Subtle backgrounds, panels

## Border Radius

Use only these three radius values:

- **r1**: `6px` — Buttons, inputs, pills
- **r2**: `10px` — Cards, messages, thread items
- **r3**: `14px` — Modals, large containers

## Shadows

- **e1**: `0 1px 0 rgba(0, 0, 0, 0.04)` — Subtle elevation
- **focus**: `0 0 0 2px #000000` — Focus rings (accessible)

Usage in Tailwind:
```tsx
className="shadow-e1"          // Subtle elevation
className="focus:shadow-focus-ring"  // Focus state
```

## Spacing

Based on 8px baseline grid:

- **s1**: `4px` — Tight spacing
- **s2**: `8px` — Base unit (most common)
- **s3**: `12px` — Comfortable spacing
- **s4**: `16px` — Section spacing
- **s5**: `24px` — Large gaps
- **s6**: `32px` — Major sections

## Layout Constants

Defined in `src/constants/weave.ts`:

```typescript
WEAVE_LAYOUT = {
  HEADER_HEIGHT: 64,      // Header bar height
  INBOX_WIDTH: 360,       // Left thread list panel
  MESSAGE_MAX_WIDTH: 640, // Maximum message content width
  SPACING_UNIT: 8,        // Baseline grid unit
}
```

### Usage
```tsx
import { WEAVE_LAYOUT } from '@/constants/weave';

<aside style={{ width: WEAVE_LAYOUT.INBOX_WIDTH }}>
  {/* Thread list */}
</aside>

<div style={{ maxWidth: WEAVE_LAYOUT.MESSAGE_MAX_WIDTH }}>
  {/* Message content */}
</div>
```

## Typography

### Text Sizes
- **12px**: Meta text, timestamps (always `font-mono`)
- **14px**: Body text, thread titles
- **16px**: Section headings
- **18px**: Page titles

### Font Weights
- **400** (normal): Body text
- **500** (medium): Buttons
- **600** (semibold): Headings, titles

### Line Heights
- **20px**: Body text (`leading-[20px]`)
- **24px**: Headings

## Anti-Patterns (Forbidden)

The following patterns are **strictly prohibited** in Weave:

❌ **No KPI tiles or dashboard widgets**  
Weave is an agent conversation interface, not a metrics dashboard.

❌ **No generic table toolbars**  
No bulk action toolbars, filter dropdowns, or pagination controls.

❌ **No icon kits beyond lucide-react**  
Use only minimal lucide-react icons for essential affordances.

❌ **No color palettes**  
Strictly grayscale only. No blues, greens, reds, or brand colors.

❌ **No SaaS template patterns**  
Avoid generic CRUD layouts, wizard flows, or marketing-style CTAs.

## Data Hooks (E2E Testing)

All interactive elements must include data attributes for E2E testing:

### Layout
```tsx
data-weave-layout
data-inbox-width="360"
data-message-max-width="640"
```

### Thread List Items
```tsx
data-thread-id={id}
data-thread-status={status}
data-participant-count={count}
```

### Conversation Stream
```tsx
data-message-count={count}
data-conversation-state="loading|ready|typing"
```

### Agent Messages
```tsx
data-agent={agentName}
data-message-id={id}
data-timestamp={isoString}
```

## Accessibility Requirements

- All interactive elements must have `aria-label` or `aria-labelledby`
- Use semantic HTML: `<article>`, `<aside>`, `<main>`
- Focus rings must use `shadow-focus-ring` token
- Keyboard navigation must work for all actions
- Color contrast must meet WCAG AA (minimum 4.5:1 for normal text)

## Component Guidelines

### Thread List (Inbox)
- Fixed width: `360px`
- Scrollable content area
- Active state: `bg-surface-0 border-ink-300`
- Hover state: `bg-surface-0 border-ink-100`

### Message Stream
- Max width: `640px`
- Centered in viewport
- Messages use `border-ink-100` and `bg-surface-0`
- Typing indicator uses animation only (no color)

### Input Field
- Full width within container
- Border: `border-ink-200`
- Focus: `border-ink-500` + `shadow-focus-ring`
- Disabled: `bg-surface-50 text-ink-300`

## Token Compliance Checklist

Before shipping any Weave component:

- [ ] All colors use `ink` or `surface` tokens (no hardcoded hex values)
- [ ] All spacing uses `s1-s6` tokens (no hardcoded pixel values)
- [ ] All border radius uses `r1-r3` tokens
- [ ] Layout uses constants from `src/constants/weave.ts`
- [ ] Focus states use `shadow-focus-ring`
- [ ] Data hooks present for E2E testing
- [ ] ARIA labels on all interactive elements
- [ ] No forbidden anti-patterns present
- [ ] Contrast meets WCAG AA
- [ ] Keyboard navigation tested

## References

- Tailwind config: `tailwind.config.ts`
- Global styles: `src/index.css`
- Layout constants: `src/constants/weave.ts`
- Lovable design system: [docs.lovable.dev](https://docs.lovable.dev)
