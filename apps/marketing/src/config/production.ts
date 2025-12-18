/**
 * Production deployment configuration and security settings
 */

export const PRODUCTION_CONFIG = {
  // Security settings
  security: {
    requireHttps: true,
    allowAuthBypass: false,
    enforceRoleValidation: true,
    enableAuditLogging: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    errorReportingEnabled: true,
    productionBuildOptimized: true
  },

  // API settings
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    rateLimitEnabled: true,
    maxRequestsPerMinute: 100,
    cachingEnabled: true,
    timeoutMs: 30000
  },

  // Monitoring settings
  monitoring: {
    enableErrorTracking: true,
    enablePerformanceMonitoring: true,
    sampleRate: 1.0, // 100% in production for critical app
    enableUserSessionRecording: false, // Privacy consideration
    healthChecks: true,
    realTimeUpdates: true,
    dashboardMetrics: true
  },

  // Features that should be enabled/disabled in production
  features: {
    debugMode: false,
    devTools: false,
    mockData: false,
    testModeEnabled: false,
    aiDecisionEngine: true,
    realtimeCollaboration: true,
    advancedAnalytics: true,
    crossClientIntelligence: true,
    predictiveSLA: true
  },

  // Performance settings
  performance: {
    enableLazyLoading: true,
    enableCompression: true,
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  },
} as const;

/**
 * Validates production configuration against current environment
 */
export function validateProductionConfig() {
  const issues: string[] = [];

  // Check security settings
  if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
    issues.push('Authentication bypass is enabled in production');
  }

  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    issues.push('Application is not using HTTPS');
  }

  // Check required environment variables
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PROJECT_ID'
  ];

  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      issues.push(`Missing required environment variable: ${varName}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    config: PRODUCTION_CONFIG
  };
}

/**
 * Gets current deployment environment info
 */
export function getDeploymentInfo() {
  return {
    mode: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    buildTime: new Date().toISOString(),
    domain: window.location.hostname,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent,
  };
}