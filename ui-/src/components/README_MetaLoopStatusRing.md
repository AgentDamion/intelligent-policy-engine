# MetaLoopStatusRing Component

A dynamic status ring component with four distinct states that connects to the existing agent status system via WebSocket.

## Features

- **Four Exact States**: Idle, Thinking, Success, Alert
- **Real-time Updates**: Connects to existing WebSocket agent status system
- **Dual Rendering**: SVG icons (3D low-poly style) and Canvas animations
- **Hover Tooltips**: Detailed explanations for each status
- **Multiple Sizes**: Small, Medium, Large configurations
- **Accessibility**: Keyboard navigation and screen reader support

## Status States

### 1. **Idle** - Gray Circle Outline
- **Color**: `#6B7280` (Gray)
- **Animation**: Static outline
- **Tooltip**: "Idle - Monitoring system"
- **Description**: System is idle and monitoring

### 2. **Thinking** - Blue Dotted Circle with Rotation
- **Color**: `#3B82F6` (Blue)
- **Animation**: Rotating dotted circle
- **Tooltip**: "Thinking - Processing request"
- **Description**: AI is processing your request

### 3. **Success** - Teal Circle with Checkmark
- **Color**: `#87788E` (Teal)
- **Animation**: Filled circle with white checkmark
- **Tooltip**: "Success - Request completed"
- **Description**: Request completed successfully

### 4. **Alert** - Orange Circle with Exclamation Mark
- **Color**: `#CEA889` (Orange/Sky)
- **Animation**: Flashing filled circle with exclamation
- **Tooltip**: "Alert - Attention required"
- **Description**: Human attention required

## Usage

```jsx
import MetaLoopStatusRing from './components/MetaLoopStatusRing';

function App() {
  const handleStatusChange = (status) => {
    console.log('Status changed to:', status);
  };

  return (
    <div>
      {/* Basic usage */}
      <MetaLoopStatusRing />
      
      {/* With custom size and callback */}
      <MetaLoopStatusRing
        size="large"
        showTooltip={true}
        onStatusChange={handleStatusChange}
        className="my-custom-class"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | string | `'medium'` | Size: 'small', 'medium', 'large' |
| `showTooltip` | boolean | `true` | Show hover tooltips |
| `useSvgIcons` | boolean | `true` | Use SVG icons instead of Canvas |
| `className` | string | `''` | Additional CSS classes |
| `onStatusChange` | function | `() => {}` | Callback when status changes |

## Size Configurations

| Size | Diameter | Stroke Width | Font Size |
|------|----------|--------------|-----------|
| Small | 40px | 2px | 12px |
| Medium | 60px | 3px | 14px |
| Large | 80px | 4px | 16px |

## WebSocket Integration

The component automatically connects to the existing WebSocket service and:

- **Subscribes** to agent updates via `subscribeToAgents()`
- **Listens** for `agent_status_update` events
- **Determines** overall status based on agent states
- **Updates** in real-time as agent statuses change

### Status Priority Logic

1. **Alert** - If any agent has alert status
2. **Success** - If any agent has success status  
3. **Thinking** - If any agent is processing or active
4. **Idle** - Default state when no agents are active

## Animations

### SVG Icons (Default)
- **Idle**: Gray ring with subtle faceting and gradients
- **Thinking**: Blue dotted ring with rotation animation
- **Success**: Teal filled ring with white checkmark
- **Alert**: Orange filled ring with exclamation mark
- **Infinity**: MetaLoop brand icon with central light source

### Canvas-Based Animations (Legacy)
- **Idle**: Static gray outline
- **Thinking**: Rotating blue dotted circle
- **Success**: Filled teal circle with white checkmark
- **Alert**: Flashing orange circle with exclamation mark

### CSS Enhancements
- **Hover Effects**: Scale and glow animations
- **Connection Pulse**: Animated connection indicator
- **Tooltip Transitions**: Smooth fade-in/out
- **Status-Specific Glows**: Color-matched drop shadows
- **SVG-Specific**: Rotation, checkmark drawing, exclamation pulse

## Accessibility

- **Keyboard Navigation**: Focusable with proper outline
- **Screen Reader**: ARIA labels and descriptions
- **High Contrast**: Color combinations meet WCAG standards
- **Reduced Motion**: Respects user preferences

## Browser Support

- **Modern Browsers**: Canvas API support
- **WebSocket**: Real-time connection support
- **CSS Animations**: Smooth transitions
- **Mobile**: Touch-friendly interactions

## Dependencies

- React 16.8+ (for hooks)
- Canvas API for animations
- WebSocket service (`../services/websocket`)
- Tailwind CSS for styling

## Demo

See `MetaLoopStatusRingDemo.jsx` for a complete interactive demo with:
- All four status states
- Size controls
- Color palette display
- Status information panels

## Integration with Existing System

The component integrates seamlessly with your existing:
- **WebSocket service** for real-time updates
- **Agent status system** for state management
- **Color scheme** matching your design system
- **Animation timing** consistent with other components 