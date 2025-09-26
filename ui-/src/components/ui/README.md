# UI Components for Modern Authentication Hub

This directory contains the base UI components used by the authentication hub. All components are built with TypeScript and Tailwind CSS.

## Import Aliases

The project uses `@/` as an alias for the `src/` directory. You can import components like:

```tsx
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
```

## Component List

- **Button** - Primary, secondary, ghost, and destructive variants with loading states
- **Input** - Form inputs with label, hint, error, and leading icon support
- **Select** - Dropdown selects with options
- **Tabs** - Tab navigation for content sections
- **Segmented** - Segmented control for auth mode selection
- **Toggle** - Switch toggles with labels
- **Card** - Container cards with optional title and footer
- **Modal** - Modal dialogs with actions
- **Divider** - Visual dividers with optional text/label
- **VisuallyHidden** - Screen reader only content

## Styling

All components use Tailwind CSS with these design tokens:
- Primary color: `#6C54FF` (purple)
- Background: `#F7F8FC`
- Text: `#0F1222` (dark), `#6B7190` (muted)
- Borders: `#E7E9F2`

## Accessibility

All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management (2px focus rings)
- Screen reader support
