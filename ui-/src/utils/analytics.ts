// Analytics wrapper for tracking events
// This provides a thin abstraction layer so you can swap analytics providers later

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

// Event names constants for consistency
export const ANALYTICS_EVENTS = {
  // Authentication events
  AUTH_SSO_CLICKED: 'auth.sso_clicked',
  AUTH_SIGNIN_SUBMITTED: 'auth.signin_submitted',
  AUTH_SIGNIN_SUCCESS: 'auth.signin_success',
  AUTH_SIGNIN_FAILED: 'auth.signin_failed',
  AUTH_MAGIC_LINK_REQUESTED: 'auth.magic_link_requested',
  AUTH_LOGOUT: 'auth.logout',
  
  // Organization events
  ORG_TYPE_SELECTED: 'org.type_selected',
  ORG_ROLE_SELECTED: 'org.role_selected',
  ORG_SSO_ENABLED: 'org.sso_enabled',
  ORG_CREATED: 'org.created',
  ORG_ACCESS_REQUESTED: 'org.access_requested',
  
  // UI interaction events
  UI_TAB_CHANGED: 'ui.tab_changed',
  UI_MODAL_OPENED: 'ui.modal_opened',
  UI_MODAL_CLOSED: 'ui.modal_closed',
  UI_FORM_ERROR: 'ui.form_error',
  
  // Security events
  SECURITY_MFA_REQUIRED: 'security.mfa_required',
  SECURITY_MFA_COMPLETED: 'security.mfa_completed',
  SECURITY_POSTURE_CHECK_VIEWED: 'security.posture_check_viewed',
  
  // Enterprise Governance Command Center events
  EGCC_VIEW: 'egcc.view',
  HEATMAP_CELL_CLICK: 'heatmap.cell_click',
  METALOOP_SEND_TO_REVIEW: 'metaloop.send_to_review',
  APPROVALS_BULK_ACTION: 'approvals.bulk_action',
  TIMELINE_OPEN_DRAWER: 'timeline.open_drawer',
  FILTERS_CHANGED: 'filters.changed',
} as const;

// Main tracking function
export const track = (name: string, properties?: Record<string, any>): void => {
  const event: AnalyticsEvent = {
    name,
    properties: {
      ...properties,
      // Add common properties
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    },
  };

  // Send to analytics provider
  try {
    // Option 1: PostMessage for parent frame integration
    window.parent?.postMessage({ type: 'analytics', event }, '*');
    
    // Option 2: Direct API call
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        // Fire and forget
        keepalive: true,
      }).catch(() => {
        // Silently fail analytics
      });
    }
    
    // Option 3: Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', name, properties);
    }
  } catch (error) {
    // Never let analytics errors break the app
    console.error('[Analytics Error]', error);
  }
};

// Convenience tracking functions
export const trackAuthEvent = (
  action: 'sso_click' | 'signin' | 'magic_link' | 'logout',
  properties?: Record<string, any>
) => {
  const eventMap = {
    sso_click: ANALYTICS_EVENTS.AUTH_SSO_CLICKED,
    signin: ANALYTICS_EVENTS.AUTH_SIGNIN_SUBMITTED,
    magic_link: ANALYTICS_EVENTS.AUTH_MAGIC_LINK_REQUESTED,
    logout: ANALYTICS_EVENTS.AUTH_LOGOUT,
  };
  
  track(eventMap[action], properties);
};

export const trackOrgEvent = (
  action: 'type_selected' | 'role_selected' | 'created' | 'access_requested',
  properties?: Record<string, any>
) => {
  const eventMap = {
    type_selected: ANALYTICS_EVENTS.ORG_TYPE_SELECTED,
    role_selected: ANALYTICS_EVENTS.ORG_ROLE_SELECTED,
    created: ANALYTICS_EVENTS.ORG_CREATED,
    access_requested: ANALYTICS_EVENTS.ORG_ACCESS_REQUESTED,
  };
  
  track(eventMap[action], properties);
};

// Page view tracking
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  track('page.viewed', {
    pageName,
    ...properties,
  });
};

// Error tracking
export const trackError = (error: Error | string, properties?: Record<string, any>) => {
  track('error.occurred', {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    ...properties,
  });
};

// Performance tracking
export const trackPerformance = (metric: string, value: number, properties?: Record<string, any>) => {
  track('performance.metric', {
    metric,
    value,
    ...properties,
  });
};

// User identification (for analytics providers that support it)
export const identify = (userId: string, traits?: Record<string, any>) => {
  try {
    window.parent?.postMessage({ 
      type: 'analytics.identify', 
      userId, 
      traits 
    }, '*');
  } catch (error) {
    console.error('[Analytics Identify Error]', error);
  }
};

// Group identification (for B2B analytics)
export const group = (groupId: string, traits?: Record<string, any>) => {
  try {
    window.parent?.postMessage({ 
      type: 'analytics.group', 
      groupId, 
      traits 
    }, '*');
  } catch (error) {
    console.error('[Analytics Group Error]', error);
  }
};

// Enterprise Governance Command Center tracking functions
export const trackEnterpriseEvent = (
  action: 'view' | 'heatmap_click' | 'metaloop_route' | 'bulk_action' | 'timeline_open' | 'filters_change',
  properties?: Record<string, any>
) => {
  const eventMap = {
    view: ANALYTICS_EVENTS.EGCC_VIEW,
    heatmap_click: ANALYTICS_EVENTS.HEATMAP_CELL_CLICK,
    metaloop_route: ANALYTICS_EVENTS.METALOOP_SEND_TO_REVIEW,
    bulk_action: ANALYTICS_EVENTS.APPROVALS_BULK_ACTION,
    timeline_open: ANALYTICS_EVENTS.TIMELINE_OPEN_DRAWER,
    filters_change: ANALYTICS_EVENTS.FILTERS_CHANGED,
  };
  
  track(eventMap[action], properties);
};

// Specific enterprise convenience functions for demo script
export const analytics = {
  // Page view
  viewEnterprise: () => trackEnterpriseEvent('view', { route: '/enterprise' }),
  
  // Heat map interactions
  heatmapCellClick: (partner: string, category: string, risk: string) => 
    trackEnterpriseEvent('heatmap_click', { partner, category, risk }),
  
  // Meta-Loop actions
  metaLoopSendToReview: (recId: string, confidence: number) => 
    trackEnterpriseEvent('metaloop_route', { rec_id: recId, confidence }),
  
  // Approval actions
  approvalsBulkAction: (action: string, count: number, ids: string[]) => 
    trackEnterpriseEvent('bulk_action', { action, count, ids }),
  
  // Timeline interactions
  timelineOpenDrawer: (eventId: string, type: string) => 
    trackEnterpriseEvent('timeline_open', { event_id: eventId, type }),
  
  // Filter interactions
  filtersChanged: (filters: Record<string, any>) =>
    trackEnterpriseEvent('filters_change', filters),
};
