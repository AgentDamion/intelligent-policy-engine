# MetricsHeader Component

A clean, enterprise-grade metrics display component that shows key performance indicators with proper spacing, analytics integration, and responsive design.

## Features

- **Three Key Stats**: Displays "3.2M Audit tasks Historical", "87% Faster decisions", "24/7 Real Time Transparency"
- **Clean Card Layout**: Professional card design with proper spacing and enterprise styling
- **Analytics Integration**: Connects to existing dashboard API for live metrics
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Loading States**: Skeleton loading animation for better user experience
- **Error Handling**: Graceful fallback to default values if API fails
- **Accessibility**: WCAG AA compliant with proper contrast and keyboard navigation
- **Dark Mode Support**: Automatic dark mode detection and styling

## Design Specifications

- **Layout**: Three-column grid with responsive breakpoints
- **Cards**: Clean white cards with subtle shadows and hover effects
- **Typography**: Inter font family with proper weight hierarchy
- **Colors**: Enterprise color palette with semantic variants
- **Spacing**: Consistent spacing system following design tokens
- **Icons**: Emoji icons for visual appeal and quick recognition

## Usage

```jsx
import MetricsHeader from './components/MetricsHeader';

function Dashboard() {
  return (
    <div className="dashboard">
      <MetricsHeader />
      <DashboardContent />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | string | `''` | Additional CSS classes for customization |

## Analytics Integration

The component integrates with the existing dashboard API to fetch live metrics:

### API Endpoint
- **URL**: `/api/dashboard/live-metrics`
- **Method**: GET
- **Response**: JSON with metrics data

### Data Transformation
```javascript
// API Response
{
  metrics: {
    auditEvents: 3200000,    // Converted to "3.2M"
    complianceRate: 87,       // Converted to "87%"
    avgDecisionTime: "2.3"   // Not used in this component
  }
}

// Component State
{
  auditTasks: "3.2M",
  fasterDecisions: "87%",
  realTimeTransparency: "24/7"  // Static value
}
```

### Error Handling
- Falls back to default values if API fails
- Logs warning to console for debugging
- Maintains user experience with loading states

## CSS Classes

### Container
- `.metrics-header`: Main container with background and spacing
- `.metrics-container`: Grid container for metric cards

### Metric Cards
- `.metric-card`: Base card styling with hover effects
- `.metric-card-info`: Blue variant for audit tasks
- `.metric-card-success`: Green variant for faster decisions
- `.metric-card-warning`: Orange variant for real-time transparency

### Card Content
- `.metric-card-content`: Flex container for icon and details
- `.metric-icon`: Icon container with background
- `.metric-icon-text`: Emoji icon styling
- `.metric-details`: Text content container

### Text Elements
- `.metric-value`: Large, bold metric value
- `.metric-title`: Uppercase title text
- `.metric-subtitle`: Smaller descriptive text

### Loading States
- `.metric-skeleton`: Animated loading placeholder

## Responsive Breakpoints

### Desktop (Default)
- Three-column grid layout
- Full icon and text display
- Hover effects enabled

### Tablet (768px and below)
- Single-column layout
- Reduced padding and spacing
- Smaller icons and text

### Mobile (480px and below)
- Centered layout
- Stacked icon and text
- Optimized touch targets

## Accessibility Features

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus indicators for better navigation
- Tab order follows logical flow

### Screen Reader Support
- Semantic HTML structure
- Proper ARIA labels
- Descriptive text for icons

### Color Contrast
- Meets WCAG AA standards
- High contrast mode support
- Reduced motion preferences respected

## Performance Optimizations

### Loading Strategy
- Skeleton loading for immediate feedback
- API call with timeout handling
- Graceful degradation on failure

### Rendering Optimization
- Efficient re-renders with React hooks
- Minimal DOM updates
- CSS-based animations for performance

### Memory Management
- Proper cleanup of event listeners
- No memory leaks from API calls
- Efficient state management

## Integration Examples

### Enterprise Dashboard
```jsx
function EnterpriseDashboard() {
  return (
    <div className="enterprise-dashboard">
      <MetricsHeader />
      <PolicyManagement />
      <ComplianceOverview />
      <AuditTrail />
    </div>
  );
}
```

### Agency Portal
```jsx
function AgencyPortal() {
  return (
    <div className="agency-portal">
      <MetricsHeader />
      <ClientSubmissions />
      <PerformanceMetrics />
      <ServiceDelivery />
    </div>
  );
}
```

### Compliance Center
```jsx
function ComplianceCenter() {
  return (
    <div className="compliance-center">
      <MetricsHeader />
      <RegulatoryReporting />
      <AuditTrail />
      <RiskAssessment />
    </div>
  );
}
```

## Customization

### Custom Styling
```css
/* Custom metrics header */
.custom-metrics-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.custom-metrics-header .metric-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}
```

### Custom Metrics
```jsx
// Extend the component for custom metrics
function CustomMetricsHeader() {
  const [customMetrics, setCustomMetrics] = useState({
    customMetric1: 'Custom Value 1',
    customMetric2: 'Custom Value 2',
    customMetric3: 'Custom Value 3'
  });

  return (
    <div className="metrics-header">
      <div className="metrics-container">
        {/* Custom metric cards */}
      </div>
    </div>
  );
}
```

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **CSS Features**: Grid, Flexbox, CSS Custom Properties
- **JavaScript**: ES6+ features (hooks, async/await)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet

## Dependencies

- **React**: 16.8+ (for hooks)
- **CSS**: Custom CSS with Inter font
- **API**: Dashboard metrics endpoint
- **Icons**: Emoji icons (no external dependencies)

## Demo Component

A comprehensive demo component (`MetricsHeaderDemo.jsx`) is provided for testing and demonstration purposes, featuring:

- Multiple display modes (default, compact, full-width)
- Integration examples
- Usage documentation
- Technical specifications

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live metric updates
- **Custom Metrics**: Configurable metric types and sources
- **Advanced Filtering**: Time-based and category-based filtering
- **Export Features**: PDF/CSV export of metrics
- **Trend Analysis**: Historical data visualization
- **Interactive Charts**: Click-to-drill-down functionality 