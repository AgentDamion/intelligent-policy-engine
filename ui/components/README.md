# AICOMPLYR Context-Aware React Component System

A comprehensive React component system that enables seamless switching between Enterprise admin and Agency seat views within the same user session. The system maintains state during context switching and provides context-specific navigation, dashboards, and notifications.

## 🎯 Core Features

- **Context Switching**: Smooth transitions between Enterprise and Agency views
- **State Persistence**: Maintains user state during context changes
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile
- **Dark Mode Support**: Automatic dark mode detection and styling
- **Real-time Updates**: Live notification and data updates
- **Accessibility**: WCAG compliant components with proper ARIA labels

## 📦 Components

### 1. ContextSwitcher
A dropdown component that allows users to switch between different enterprise and agency contexts.

**Features:**
- Groups contexts by type (Enterprise vs Agency)
- Search functionality for large context lists
- Visual indicators for current context
- Smooth animations and transitions

### 2. ContextAwareDashboard
Renders different dashboard layouts based on the current context.

**Enterprise View:**
- Policy Management dashboard
- Seat Management overview
- Audit Center with real-time metrics
- Analytics and compliance reporting

**Agency View:**
- Submissions tracking
- Client Compliance monitoring
- Tool Management interface
- Quick Actions for common tasks

### 3. ContextAwareNavigation
Provides context-specific navigation menus that adapt based on user permissions.

**Features:**
- Dynamic menu items based on context
- Permission-based navigation
- Badge indicators for notifications
- Mobile-responsive sidebar

### 4. NotificationCenter
Aggregates notifications from all user contexts with filtering capabilities.

**Features:**
- Context-aware notification filtering
- Priority-based visual indicators
- Real-time notification updates
- Mark as read functionality

## 🚀 Quick Start

### Installation

1. **Copy Components:**
```bash
# Copy all component files to your React project
cp -r ui/components/ src/components/
```

2. **Install Dependencies:**
```bash
npm install react react-dom
```

3. **Import Components:**
```jsx
import App from './components/App.jsx';
import ContextSwitcher from './components/ContextSwitcher.jsx';
import ContextAwareDashboard from './components/ContextAwareDashboard.jsx';
import ContextAwareNavigation from './components/ContextAwareNavigation.jsx';
import NotificationCenter from './components/NotificationCenter.jsx';
```

### Basic Usage

```jsx
import React, { useState } from 'react';
import App from './components/App.jsx';

function MyApp() {
  return (
    <div className="my-app">
      <App />
    </div>
  );
}

export default MyApp;
```

### Standalone Component Usage

```jsx
import React, { useState } from 'react';
import ContextSwitcher from './components/ContextSwitcher.jsx';

function Header() {
  const [currentContext, setCurrentContext] = useState(userContexts[0]);
  
  return (
    <header>
      <ContextSwitcher
        userContexts={userContexts}
        currentContext={currentContext}
        onContextChange={setCurrentContext}
      />
    </header>
  );
}
```

## 📋 Component API

### ContextSwitcher Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userContexts` | Array | Yes | Array of available contexts |
| `currentContext` | Object | Yes | Currently selected context |
| `onContextChange` | Function | Yes | Callback when context changes |
| `className` | String | No | Additional CSS classes |

### ContextAwareDashboard Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentContext` | Object | Yes | Current context object |
| `onNavigate` | Function | Yes | Navigation callback |
| `className` | String | No | Additional CSS classes |

### ContextAwareNavigation Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentContext` | Object | Yes | Current context object |
| `onNavigate` | Function | Yes | Navigation callback |
| `className` | String | No | Additional CSS classes |

### NotificationCenter Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentContext` | Object | Yes | Current context object |
| `onNotificationClick` | Function | Yes | Notification click callback |
| `className` | String | No | Additional CSS classes |

## 🎨 Customization

### Color Scheme

Modify the color scheme by updating CSS variables in the component files:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #27ae60;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --text-primary: #333;
  --text-secondary: #666;
  --background-primary: #fff;
  --background-secondary: #f8f9fa;
}
```

### Adding New Context Types

1. **Update ContextSwitcher:**
```jsx
const getContextIcon = (type) => {
  switch (type) {
    case 'enterprise':
      return '🏢';
    case 'agency':
      return '🏛️';
    case 'government': // New type
      return '🏛️';
    default:
      return '👤';
  }
};
```

2. **Update Navigation:**
```jsx
const governmentNavItems = [
  // Add government-specific navigation items
];
```

3. **Update Dashboard:**
```jsx
const GovernmentDashboard = ({ context, onNavigate }) => {
  // Create government-specific dashboard
};
```

## 🔧 Integration with Backend

### API Integration

Replace mock data with real API calls:

```jsx
// Example API integration
const fetchUserContexts = async () => {
  const response = await fetch('/api/user/contexts');
  return response.json();
};

const fetchDashboardData = async (contextId) => {
  const response = await fetch(`/api/dashboard/${contextId}`);
  return response.json();
};
```

### Authentication

Add authentication headers to API calls:

```jsx
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};
```

## 📱 Responsive Design

The components are built with a mobile-first approach:

- **Desktop**: Full sidebar navigation with expanded views
- **Tablet**: Collapsible sidebar with touch-friendly interactions
- **Mobile**: Hamburger menu with overlay navigation

### Breakpoints

```css
/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

## 🌙 Dark Mode

The components automatically detect and adapt to system dark mode preferences:

```css
@media (prefers-color-scheme: dark) {
  /* Dark mode styles */
}
```

## 🧪 Testing

### Component Testing

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ContextSwitcher from './ContextSwitcher.jsx';

test('switches context when option is clicked', () => {
  const mockOnContextChange = jest.fn();
  const userContexts = [
    { id: '1', name: 'Enterprise', type: 'enterprise' },
    { id: '2', name: 'Agency', type: 'agency' }
  ];
  
  render(
    <ContextSwitcher
      userContexts={userContexts}
      currentContext={userContexts[0]}
      onContextChange={mockOnContextChange}
    />
  );
  
  fireEvent.click(screen.getByText('Agency'));
  expect(mockOnContextChange).toHaveBeenCalledWith(userContexts[1]);
});
```

## 🚀 Performance Optimization

### Lazy Loading

```jsx
import React, { lazy, Suspense } from 'react';

const ContextAwareDashboard = lazy(() => import('./ContextAwareDashboard.jsx'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContextAwareDashboard />
    </Suspense>
  );
}
```

### Memoization

```jsx
import React, { useMemo } from 'react';

const ContextSwitcher = React.memo(({ userContexts, currentContext, onContextChange }) => {
  const filteredContexts = useMemo(() => {
    return userContexts.filter(ctx => ctx.active);
  }, [userContexts]);
  
  // Component logic
});
```

## 📄 License

This component system is part of the AICOMPLYR platform and is proprietary software.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions about the component system:

- **Documentation**: See `demo.html` for detailed examples
- **Issues**: Report bugs and feature requests through the project issue tracker
- **Email**: Contact the development team for enterprise support

---

**Built with ❤️ for AICOMPLYR** 