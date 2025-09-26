# MetaLoopAssistantPanel Component

A fixed left sidebar chat interface for the MetaLoop AI assistant that matches the exact design specifications.

## Features

- **320px fixed left sidebar** with rounded corners and subtle shadow
- **Header with MetaLoop icon** and status ring indicator
- **Welcome messages** as specified in the design
- **Message input** with send arrow button
- **Real-time WebSocket connection** for live updates
- **Typing indicators** and connection status
- **Responsive design** with proper mobile support

## Design Specifications

### Colors
- **Indigo**: `#3740A5` (Primary brand color)
- **Teal**: `#87788E` (Secondary accent)
- **Sky**: `#CEA889` (Tertiary accent)

### Typography
- **Font Family**: Inter with proper weight hierarchy
- **Font Weights**: 300, 400, 500, 600, 700

### Layout
- **Width**: 320px fixed
- **Position**: Left sidebar
- **Height**: Full viewport height
- **Border Radius**: Rounded right corners
- **Shadow**: Subtle drop shadow

## Usage

```jsx
import MetaLoopAssistantPanel from './components/MetaLoopAssistantPanel';

function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content with left margin for panel */}
      <div className="ml-80 p-8">
        {/* Your main content here */}
      </div>

      {/* MetaLoop Assistant Panel */}
      <MetaLoopAssistantPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
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

The component automatically connects to the existing WebSocket service and handles:

- **Connection status** updates
- **Assistant responses** via `assistant_response` events
- **Typing indicators** via `assistant_typing` events
- **Message sending** via `assistant_message` events

### WebSocket Events

- `assistant_response`: Receives assistant messages
- `assistant_typing`: Controls typing indicator
- `connected`: Connection status updates

## Styling

The component uses:
- **Tailwind CSS** for utility classes
- **Custom CSS** for animations and specific styling
- **Inter font** loaded via Google Fonts
- **CSS animations** for typing indicators and transitions

## Accessibility

- **Keyboard navigation** support (Enter to send)
- **Focus management** with proper outline styles
- **Screen reader** friendly with proper ARIA labels
- **High contrast** color combinations

## Browser Support

- **Modern browsers** with CSS Grid and Flexbox support
- **Mobile responsive** with touch-friendly interactions
- **WebSocket** support for real-time features

## Dependencies

- React 16.8+ (for hooks)
- Tailwind CSS
- WebSocket service (`../services/websocket`)

## Demo

See `MetaLoopAssistantDemo.jsx` for a complete implementation example. 