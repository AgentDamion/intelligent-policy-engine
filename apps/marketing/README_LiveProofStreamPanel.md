# LiveProofStreamPanel Component

A real-time audit event stream panel that displays live proof of governance activities with auto-scrolling and WebSocket integration.

## Features

- **Real-time Event Streaming**: Displays live audit events from the governance system
- **Auto-scrolling**: Automatically scrolls to show new events as they arrive
- **Event Icons**: Visual indicators for different event types (✅, ⚠️, 📋, 🤖)
- **Timestamp Display**: Relative timestamps (1s, 30m, 2h) for each event
- **Connection Status**: Visual indicator showing WebSocket connection status
- **Responsive Design**: Adapts to different screen sizes
- **Smooth Animations**: Elegant transitions and hover effects
- **Dark Mode Support**: Automatic dark mode detection and styling

## Design Specifications

- **Layout**: 320px fixed right sidebar with rounded corners and subtle shadow
- **Header**: "See Live Proof" with "Live Proof stream >" arrow
- **Events**: Each event shows icon, title, timestamp, and description
- **Footer**: "View All >" link for navigation to full audit log
- **Colors**: Uses the project's color palette (Indigo, Teal, Sky)
- **Typography**: Inter font family with proper weight hierarchy

## Usage

```jsx
import LiveProofStreamPanel from './components/LiveProofStreamPanel';

function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  return (
    <div className="app">
      {/* Main application content */}
      <main className="main-content">
        {/* Your dashboard, analytics, or other content */}
      </main>

      {/* Live Proof Stream Panel */}
      <LiveProofStreamPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        className="custom-class"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | `true` | Controls panel visibility |
| `onClose` | function | `() => {}` | Callback when panel is closed |
| `className` | string | `''` | Additional CSS classes |

## WebSocket Integration

The component integrates with the existing `webSocketService` to receive real-time audit events:

### Event Types
- `audit_event`: Direct audit events from the system
- `governance_event`: Governance-related events (policy decisions, tool submissions, etc.)
- `connected`: Connection status updates

### Event Structure
```javascript
{
  id: string,
  type: 'tool_approved' | 'conflict_detected' | 'audit_completed' | 'policy_decision' | 'compliance_alert' | 'risk_assessment' | 'agent_action',
  title: string,
  description: string,
  timestamp: string, // ISO timestamp
  severity: 'success' | 'warning' | 'info' | 'error'
}
```

### Event Icons
- ✅ Tool Approved / Policy Decision
- ⚠️ Conflict Detected / Compliance Alert
- 📋 Audit Completed / Risk Assessment
- 🤖 Agent Action
- 📝 Default Event

## CSS Classes

### Panel Structure
- `.live-proof-stream-panel`: Main panel container
- `.live-proof-panel-transition`: Transition animations
- `.live-proof-header`: Header section
- `.live-proof-events-container`: Events container
- `.live-proof-footer`: Footer section

### Event Items
- `.live-proof-event-item`: Individual event container
- `.live-proof-event-icon`: Event icon container
- `.live-proof-events-list`: Scrollable events list

### Interactive Elements
- `.live-proof-view-all-btn`: "View All" button
- `.live-proof-status-indicator`: Connection status indicator

## Animations

### Panel Transitions
- Smooth slide-in/out animations
- Cubic-bezier easing for natural feel

### Event Animations
- `slideInFromTop`: New events slide in from top
- `newEventSlideIn`: Enhanced animation for new events
- `connectionPulse`: Pulsing animation for connection status

### Hover Effects
- Event items lift slightly on hover
- Icons scale up on hover
- Button transforms on hover

## Mock Events

The component includes realistic mock events for demonstration:

```javascript
const mockEvents = [
  {
    id: '1',
    type: 'tool_approved',
    title: 'Tool Approved',
    description: 'GYE 1s simplified access toaternmine seria',
    timestamp: new Date(Date.now() - 1000).toISOString(),
    icon: '✅',
    severity: 'success'
  },
  {
    id: '2',
    type: 'conflict_detected',
    title: 'Conflict detected',
    description: 'Adioun distelvnugen post wonnernennnt',
    timestamp: new Date(Date.now() - 30000).toISOString(),
    icon: '⚠️',
    severity: 'warning'
  },
  {
    id: '3',
    type: 'audit_completed',
    title: 'Audit Completed',
    description: 'Frisige guttite for GBT toitdings',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    icon: '📋',
    severity: 'info'
  }
];
```

## Timestamp Formatting

Events display relative timestamps:
- `< 60 seconds`: "1s", "30s"
- `< 60 minutes`: "1m", "30m"
- `< 24 hours`: "2h", "12h"
- `>= 24 hours`: Full date

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators
- **Color Contrast**: Meets WCAG AA standards

## Dependencies

- **React**: 16.8+ (for hooks)
- **WebSocket Service**: `../services/websocket`
- **CSS**: `./LiveProofStreamPanel.css`
- **Font**: Inter (Google Fonts)

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **CSS Features**: Flexbox, Grid, CSS Custom Properties
- **JavaScript**: ES6+ features (arrow functions, destructuring, etc.)

## Performance

- **Event Limiting**: Maximum 10 events displayed at once
- **Efficient Rendering**: React.memo optimization for event items
- **Smooth Scrolling**: Hardware-accelerated animations
- **Memory Management**: Proper cleanup of WebSocket listeners

## Integration with Existing System

The component seamlessly integrates with the existing AICOMPLYR system:

1. **WebSocket Service**: Uses the same service as other real-time components
2. **Event Bus**: Listens to governance and audit events
3. **Design System**: Follows the established color palette and typography
4. **Component Architecture**: Consistent with other panel components

## Demo Component

A comprehensive demo component (`LiveProofStreamDemo.jsx`) is provided for testing and demonstration purposes, featuring:

- Panel visibility toggle
- Demo mode selection
- Feature explanations
- Testing instructions

## Future Enhancements

- **Event Filtering**: Filter by event type or severity
- **Search Functionality**: Search through event descriptions
- **Export Features**: Export event history
- **Custom Themes**: Additional color schemes
- **Event Grouping**: Group related events
- **Notification Sounds**: Audio alerts for new events 