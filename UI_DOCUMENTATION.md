# AIComplyr.io UI/Frontend Documentation

## Overview

The AIComplyr.io frontend provides a professional, compliance-focused dashboard that demonstrates intelligent policy management through an intuitive user interface. Built with vanilla JavaScript, HTML5, and CSS3, it offers real-time analysis and decision visualization.

## Table of Contents

1. [UI Components](#ui-components)
2. [Page Structure](#page-structure)
3. [Core Features](#core-features)
4. [JavaScript Functions](#javascript-functions)
5. [CSS Architecture](#css-architecture)
6. [Integration Guide](#integration-guide)
7. [Customization](#customization)
8. [Best Practices](#best-practices)

---

## UI Components

### 1. Main Dashboard (`index.html`)

The primary interface for compliance request analysis.

#### Components:
- **Header**: Brand identity with logo and tagline
- **Input Section**: Request submission area
- **Loading State**: Processing indicator
- **Results Section**: Multi-agent analysis display
  - Context Analysis Card
  - Policy Decision Card
  - Negotiation Outcome Card
  - Next Steps Card

#### Key Features:
```html
<!-- Request Input -->
<textarea id="userInput" 
  placeholder="Describe your request..." 
  rows="3"></textarea>

<!-- Urgency Meter -->
<div class="urgency-meter">
  <div class="urgency-bar" id="urgencyBar"></div>
</div>

<!-- Decision Status -->
<div class="status-indicator" id="statusIndicator">
  <i class="fas fa-check-circle"></i>
  <span id="decisionStatus">APPROVED</span>
</div>
```

### 2. Policy Builder (`policy-builder.html`)

Interactive interface for creating and managing policies.

#### Features:
- **Form-based Policy Creation**
- **Risk Profile Configuration**
- **Rule Definition Interface**
- **Approval Workflow Setup**
- **Live Preview**

#### Usage Example:
```javascript
// Initialize Policy Builder
const policyBuilder = {
  name: "AI Tool Usage Policy",
  riskProfiles: {
    low: { threshold: 0.3, autoApprove: true },
    medium: { threshold: 0.7, requiresReview: true },
    high: { threshold: 0.9, requiresExecutiveApproval: true }
  },
  rules: [
    { type: "content_type", value: "client_presentation", risk: 0.8 },
    { type: "tool", value: "chatgpt", risk: 0.5 }
  ]
};
```

### 3. Negotiation Center (`negotiation-center.html`)

Handles multi-client conflict resolution and competitive scenarios.

#### Components:
- **Client Relationship Matrix**
- **Conflict Detection Dashboard**
- **Resolution Workflow**
- **Compromise Builder**
- **Escalation Management**

#### Interactive Elements:
```html
<!-- Client Matrix -->
<div class="client-matrix">
  <div class="matrix-cell" data-client1="pfizer" data-client2="novartis">
    <span class="conflict-indicator">⚠️ Competitive Conflict</span>
  </div>
</div>

<!-- Resolution Options -->
<div class="resolution-options">
  <button class="resolve-btn" data-strategy="wall">Chinese Wall</button>
  <button class="resolve-btn" data-strategy="team">Separate Teams</button>
  <button class="resolve-btn" data-strategy="escalate">Escalate</button>
</div>
```

### 4. Audit Trail (`audit-trail.html`)

Comprehensive audit visualization and management.

#### Features:
- **Timeline View**: Chronological decision history
- **Filter Controls**: By agent, date, decision type
- **Export Options**: PDF, CSV, JSON formats
- **Regulatory Mapping**: Compliance framework alignment

### 5. Workspace Admin (`workspace-admin.html`)

Administrative controls for system management.

#### Sections:
- **User Management**
- **Organization Settings**
- **Policy Templates**
- **System Health Monitoring**
- **Admin Actions**

---

## Page Structure

### HTML Template Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - aicomplyr.io</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <!-- Header content -->
        </header>
        
        <main class="main-content">
            <!-- Page-specific content -->
        </main>
        
        <footer class="footer">
            <!-- Footer content -->
        </footer>
    </div>
    
    <script src="script.js"></script>
</body>
</html>
```

---

## Core Features

### 1. Context Agent Intelligence

**Visual Components:**
- Urgency meter with color-coded levels
- Confidence bars with percentage display
- Emotional state indicators
- Smart clarification questions

**Implementation:**
```javascript
function updateUrgencyDisplay(urgencyLevel) {
    const urgencyBar = document.getElementById('urgencyBar');
    const urgencyPercent = urgencyLevel * 100;
    
    urgencyBar.style.width = `${urgencyPercent}%`;
    urgencyBar.className = 'urgency-bar';
    
    if (urgencyLevel > 0.8) {
        urgencyBar.classList.add('urgency-critical');
    } else if (urgencyLevel > 0.6) {
        urgencyBar.classList.add('urgency-high');
    } else if (urgencyLevel > 0.4) {
        urgencyBar.classList.add('urgency-medium');
    } else {
        urgencyBar.classList.add('urgency-low');
    }
}
```

### 2. Policy Decision Visualization

**Components:**
- Status indicators (Approved/Pending/Rejected)
- Risk assessment meters
- Guardrail checkboxes
- Monitoring requirement badges

**Risk Level Styling:**
```css
.risk-low { background-color: #10b981; }
.risk-medium { background-color: #f59e0b; }
.risk-high { background-color: #ef4444; }
.risk-critical { background-color: #dc2626; }
```

### 3. Real-time Analysis

**Features:**
- Live processing indicators
- Progressive result display
- Animated transitions
- Error state handling

---

## JavaScript Functions

### Core API Integration

```javascript
// Main analysis function
async function analyzeRequest() {
    const userInput = document.getElementById('userInput').value;
    
    showLoadingState();
    
    try {
        // 1. Context Analysis
        const contextResponse = await fetch('/api/process/context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userMessage: userInput,
                organizationId: getCurrentOrgId(),
                userId: getCurrentUserId()
            })
        });
        const contextData = await contextResponse.json();
        
        // 2. Policy Evaluation
        const policyResponse = await fetch('/api/process/policy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contextOutput: contextData,
                organizationId: getCurrentOrgId(),
                userId: getCurrentUserId()
            })
        });
        const policyData = await policyResponse.json();
        
        // 3. Negotiation Processing
        const negotiationResponse = await fetch('/api/process/negotiation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contextOutput: contextData,
                policyDecision: policyData,
                organizationId: getCurrentOrgId(),
                userId: getCurrentUserId()
            })
        });
        const negotiationData = await negotiationResponse.json();
        
        // Update UI with results
        displayResults(contextData, policyData, negotiationData);
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoadingState();
    }
}
```

### UI Update Functions

```javascript
// Update context analysis display
function updateContextDisplay(contextData) {
    // Update urgency
    updateUrgencyDisplay(contextData.urgency.level);
    document.getElementById('urgencyLevel').textContent = 
        getUrgencyLabel(contextData.urgency.level);
    document.getElementById('emotionalState').textContent = 
        contextData.urgency.emotionalState;
    
    // Update context inference
    document.getElementById('contextType').textContent = 
        formatContextType(contextData.context.inferredType);
    updateConfidenceBar(contextData.context.confidence);
    
    // Update clarification
    document.getElementById('clarificationQuestion').textContent = 
        contextData.clarification.question;
}

// Update policy decision display
function updatePolicyDisplay(policyData) {
    const statusIndicator = document.getElementById('statusIndicator');
    const status = policyData.decision.status;
    
    // Update status
    statusIndicator.className = `status-indicator status-${status}`;
    document.getElementById('decisionStatus').textContent = 
        status.toUpperCase();
    
    // Update risk
    updateRiskMeter(policyData.risk.score);
    
    // Update guardrails
    displayGuardrails(policyData.conditions.guardrails);
    
    // Update monitoring
    displayMonitoring(policyData.monitoring.requirements);
}
```

### Utility Functions

```javascript
// Format helpers
function formatContextType(type) {
    return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function getUrgencyLabel(level) {
    if (level > 0.8) return 'Critical';
    if (level > 0.6) return 'High';
    if (level > 0.4) return 'Medium';
    return 'Low';
}

// Animation helpers
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || 
            (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current) + '%';
    }, 16);
}
```

---

## CSS Architecture

### Design System

```css
/* Color Palette */
:root {
    /* Primary Colors */
    --primary-blue: #3b82f6;
    --primary-dark: #1e40af;
    
    /* Status Colors */
    --success-green: #10b981;
    --warning-yellow: #f59e0b;
    --danger-red: #ef4444;
    
    /* Neutral Colors */
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-300: #d1d5db;
    --gray-400: #9ca3af;
    --gray-500: #6b7280;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-800: #1f2937;
    --gray-900: #111827;
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    
    /* Typography */
    --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Component Styles

```css
/* Card Component */
.card {
    background: white;
    border-radius: 0.75rem;
    box-shadow: var(--shadow-md);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    transition: transform 0.2s;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

/* Button Styles */
.btn-primary {
    background: var(--primary-blue);
    color: white;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
}

.btn-primary:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
}

/* Meter Components */
.urgency-meter,
.risk-meter,
.confidence-bar {
    width: 100%;
    height: 0.5rem;
    background: var(--gray-200);
    border-radius: 9999px;
    overflow: hidden;
    position: relative;
}

.urgency-bar,
.risk-fill,
.confidence-fill {
    height: 100%;
    transition: width 0.5s ease-out;
    border-radius: 9999px;
}
```

### Responsive Design

```css
/* Mobile First Approach */
.container {
    max-width: 100%;
    padding: var(--spacing-md);
}

/* Tablet and up */
@media (min-width: 768px) {
    .container {
        max-width: 750px;
        margin: 0 auto;
    }
    
    .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-lg);
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .container {
        max-width: 1200px;
    }
    
    .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-lg);
    }
}
```

---

## Integration Guide

### 1. Backend API Integration

```javascript
// Configuration
const API_BASE_URL = window.location.origin + '/api';

// API Service
class ApiService {
    static async post(endpoint, data) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    static async get(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        return response.json();
    }
}
```

### 2. State Management

```javascript
// Simple state management
const AppState = {
    user: null,
    organization: null,
    currentRequest: null,
    
    init() {
        this.loadFromStorage();
        this.bindEvents();
    },
    
    loadFromStorage() {
        const savedState = localStorage.getItem('appState');
        if (savedState) {
            Object.assign(this, JSON.parse(savedState));
        }
    },
    
    save() {
        localStorage.setItem('appState', JSON.stringify({
            user: this.user,
            organization: this.organization
        }));
    },
    
    setUser(user) {
        this.user = user;
        this.save();
    },
    
    setOrganization(org) {
        this.organization = org;
        this.save();
    }
};
```

### 3. Event Handling

```javascript
// Event delegation for dynamic content
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    AppState.init();
    
    // Main submit button
    document.getElementById('submitBtn')?.addEventListener('click', analyzeRequest);
    
    // Enter key submission
    document.getElementById('userInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            analyzeRequest();
        }
    });
    
    // Dynamic content handlers
    document.addEventListener('click', (e) => {
        // Handle guardrail toggles
        if (e.target.matches('.guardrail-toggle')) {
            toggleGuardrail(e.target.dataset.guardrailId);
        }
        
        // Handle resolution buttons
        if (e.target.matches('.resolve-btn')) {
            handleResolution(e.target.dataset.strategy);
        }
    });
});
```

---

## Customization

### 1. Theme Customization

```css
/* Dark Theme */
[data-theme="dark"] {
    --bg-primary: #1f2937;
    --bg-secondary: #374151;
    --text-primary: #f9fafb;
    --text-secondary: #e5e7eb;
}

/* Apply theme */
.dark-theme {
    background-color: var(--bg-primary);
    color: var(--text-primary);
}
```

### 2. Component Extensions

```javascript
// Custom card component
class ComplianceCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: white;
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                }
            </style>
            <slot></slot>
        `;
    }
}

customElements.define('compliance-card', ComplianceCard);
```

### 3. Configuration Options

```javascript
// UI Configuration
const UIConfig = {
    // Animation settings
    animations: {
        enabled: true,
        duration: 300,
        easing: 'ease-out'
    },
    
    // Display settings
    display: {
        maxRecentItems: 10,
        dateFormat: 'MMM D, YYYY h:mm A',
        numberFormat: 'compact'
    },
    
    // Feature flags
    features: {
        darkMode: true,
        exportOptions: true,
        advancedFilters: true,
        realTimeUpdates: true
    }
};
```

---

## Best Practices

### 1. Performance Optimization

```javascript
// Debounce user input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
```

### 2. Accessibility

```html
<!-- ARIA labels and roles -->
<div role="alert" aria-live="polite" id="statusMessage">
    Decision status will appear here
</div>

<button 
    aria-label="Analyze compliance request"
    aria-describedby="submitHint"
    id="submitBtn">
    Analyze Request
</button>
<span id="submitHint" class="sr-only">
    This will process your request through our compliance system
</span>
```

### 3. Error Handling

```javascript
// Global error handler
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    showError('An unexpected error occurred. Please try again.');
});

// User-friendly error messages
function showError(message, details = null) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            ${details ? `<details><summary>Details</summary><pre>${details}</pre></details>` : ''}
        </div>
        <button onclick="this.parentElement.remove()" class="error-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(errorContainer);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => errorContainer.remove(), 10000);
}
```

### 4. Security Considerations

```javascript
// XSS Prevention
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// CSRF Token handling
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

// Secure API calls
async function secureApiCall(endpoint, options = {}) {
    const defaultOptions = {
        credentials: 'same-origin',
        headers: {
            'X-CSRF-Token': getCSRFToken(),
            ...options.headers
        }
    };
    
    return fetch(endpoint, { ...defaultOptions, ...options });
}
```

---

## UI Testing

### 1. Unit Tests

```javascript
// Example test for urgency calculation
describe('Urgency Calculation', () => {
    test('should return critical for multiple exclamation marks', () => {
        const result = calculateUrgency('Need this now!!!');
        expect(result.level).toBeGreaterThan(0.8);
        expect(result.label).toBe('Critical');
    });
    
    test('should detect urgency keywords', () => {
        const result = calculateUrgency('This is urgent and critical');
        expect(result.keywords).toContain('urgent');
        expect(result.keywords).toContain('critical');
    });
});
```

### 2. Integration Tests

```javascript
// Test complete workflow
describe('Complete Analysis Workflow', () => {
    test('should process request through all agents', async () => {
        // Mock API responses
        fetch.mockResponseSequence([
            // Context response
            { urgency: { level: 0.8 }, context: { type: 'client_presentation' } },
            // Policy response
            { decision: { status: 'approved' }, risk: { level: 'medium' } },
            // Negotiation response
            { conflicts: [], solution: { requirements: [] } }
        ]);
        
        // Trigger analysis
        await analyzeRequest('Test request');
        
        // Verify UI updates
        expect(document.getElementById('urgencyBar').style.width).toBe('80%');
        expect(document.getElementById('decisionStatus').textContent).toBe('APPROVED');
    });
});
```

---

## Deployment

### 1. Build Process

```bash
# Minify CSS
npx cssnano styles.css styles.min.css

# Minify JavaScript
npx terser script.js -o script.min.js

# Optimize images
npx imagemin logo-hummingbird.png --out-dir=dist/
```

### 2. Performance Monitoring

```javascript
// Performance tracking
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        // Track key metrics
        const metrics = {
            loadTime: perfData.loadEventEnd - perfData.loadEventStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            totalTime: perfData.loadEventEnd - perfData.fetchStart
        };
        
        // Send to analytics
        if (window.analytics) {
            window.analytics.track('Page Performance', metrics);
        }
    });
}
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills

```html
<!-- Polyfills for older browsers -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=fetch,Promise,Object.assign"></script>
```

---

## Resources

- [Design System Guidelines](./design-system.md)
- [Component Library](./components/)
- [Icon Reference](https://fontawesome.com/icons)
- [API Documentation](./API_DOCUMENTATION.md)

---

Last Updated: January 2024