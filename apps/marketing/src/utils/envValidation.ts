/**
 * Environment variable validation and security checks
 * Ensures production environment is properly configured
 */

export interface EnvironmentConfig {
  isDev: boolean;
  isProd: boolean;
  supabaseUrl: string;
  supabaseKey: string;
  projectId: string;
}

export class EnvironmentError extends Error {
  constructor(message: string, public variable?: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates required environment variables
 */
export function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];
  
  // Check for required Supabase variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must use HTTPS in production');
  }
  
  if (!supabaseKey) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY is required');
  }
  
  if (!projectId) {
    errors.push('VITE_SUPABASE_PROJECT_ID is required');
  }
  
  // Security checks for production
  const isProd = import.meta.env.PROD;
  const isDev = import.meta.env.DEV;
  
  // Always check for dangerous development flags regardless of environment
  const authBypass = import.meta.env.VITE_AUTH_BYPASS;
  const bypassRole = import.meta.env.VITE_BYPASS_ROLE;
  
  if (authBypass === 'true' || authBypass === true) {
    errors.push('CRITICAL: VITE_AUTH_BYPASS is enabled - this creates a security vulnerability');
  }
  
  if (bypassRole) {
    errors.push('CRITICAL: VITE_BYPASS_ROLE is set - this bypasses role validation');
  }
  
  if (isProd) {
    // Additional production-specific security checks
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      errors.push('HTTPS is required in production');
    }
    
    // Validate Supabase URL format for production
    if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
      console.warn('Supabase URL format appears non-standard for production');
    }
  }
  
  if (errors.length > 0) {
    throw new EnvironmentError(
      `Environment validation failed:\n${errors.map(e => `- ${e}`).join('\n')}`
    );
  }
  
  return {
    isDev,
    isProd,
    supabaseUrl,
    supabaseKey,
    projectId
  };
}

/**
 * Gets sanitized environment info for logging
 */
export function getEnvironmentInfo() {
  return {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    hasProjectId: !!import.meta.env.VITE_SUPABASE_PROJECT_ID,
    // Never log actual values for security
    authBypassEnabled: import.meta.env.VITE_AUTH_BYPASS === 'true'
  };
}

/**
 * Validates environment on app startup
 */
export function initializeEnvironment() {
  try {
    const config = validateEnvironment();
    console.log('Environment validated successfully', {
      mode: import.meta.env.MODE,
      isDev: config.isDev,
      isProd: config.isProd
    });
    return config;
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}