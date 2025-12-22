/**
 * Platform Redirect Utility
 * 
 * Routes that belong to the Platform App (app.aicomplyr.io) should redirect
 * users there instead of rendering in the Marketing Site (www.aicomplyr.io).
 * 
 * This enforces the architecture boundary:
 * - Marketing: education, demos, lead capture
 * - Platform: authenticated governance (VERA+, Decisions, Inbox, etc.)
 */

/**
 * Get the canonical platform origin.
 * In production: app.aicomplyr.io
 * In development: uses VITE_PLATFORM_ORIGIN or same origin
 */
export function getPlatformOrigin(): string {
  const envOrigin = import.meta.env.VITE_PLATFORM_ORIGIN as string | undefined
  if (envOrigin && typeof envOrigin === 'string') {
    return envOrigin.replace(/\/+$/, '')
  }

  // Production fallback
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase()
    if (host === 'aicomplyr.io' || host === 'www.aicomplyr.io') {
      return 'https://app.aicomplyr.io'
    }
    // In dev, platform runs on a different port (typically 8081 or same origin)
    // Return empty to skip redirect in local dev
    return ''
  }

  return ''
}

/**
 * Routes that should redirect to the Platform App.
 * These are operational/authenticated routes that don't belong on marketing.
 */
export const PLATFORM_ONLY_ROUTES: string[] = [
  // Auth routes
  '/login',
  '/register',
  '/auth/callback',
  '/onboarding',
  
  // Enterprise operational routes
  '/enterprise/dashboard',
  '/enterprise/analytics',
  '/enterprise/policies',
  '/enterprise/policy-hierarchy',
  '/enterprise/workflows',
  '/enterprise/audit-trail',
  '/enterprise/sandbox',
  '/enterprise/partners',
  '/enterprise/platform-integrations',
  '/enterprise/import-policy',
  '/enterprise/marketplace-dashboard',
  '/enterprise/tool-intelligence',
  
  // Governance routes (Inbox/Decisions/etc.)
  '/governance/inbox',
  '/governance/policies',
  '/governance/audits',
  '/governance/tools',
  '/governance/analytics',
  
  // Vendor routes
  '/vendor/dashboard',
  '/vendor/tools',
  '/vendor/submissions',
  '/vendor/promotions',
  '/vendor/analytics',
  '/vendor/settings',
  
  // Marketplace admin
  '/marketplace/admin',
  
  // VERA+ (platform-only authenticated VERA)
  '/vera-plus',
  '/vera-settings',
]

/**
 * Check if a path should redirect to the platform.
 */
export function shouldRedirectToPlatform(path: string): boolean {
  const normalizedPath = path.split('?')[0].split('#')[0]
  
  return PLATFORM_ONLY_ROUTES.some(route => {
    // Exact match or prefix match for nested routes
    return normalizedPath === route || normalizedPath.startsWith(route + '/')
  })
}

/**
 * Build the redirect URL for a platform route.
 */
export function buildPlatformRedirectUrl(path: string): string | null {
  const platformOrigin = getPlatformOrigin()
  if (!platformOrigin) return null
  
  // Preserve query string and hash
  const fullPath = typeof window !== 'undefined' 
    ? `${path}${window.location.search}${window.location.hash}`
    : path
    
  return `${platformOrigin}${fullPath}`
}

/**
 * Perform the redirect if we're on a platform-only route.
 * Returns true if redirect was initiated.
 */
export function redirectToPlatformIfNeeded(path: string): boolean {
  if (!shouldRedirectToPlatform(path)) return false
  
  const redirectUrl = buildPlatformRedirectUrl(path)
  if (!redirectUrl) return false
  
  // In production, perform the redirect
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    window.location.replace(redirectUrl)
    return true
  }
  
  // In development, log but don't redirect (for easier testing)
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.info(
      `[Platform Redirect] Would redirect to: ${redirectUrl}\n` +
      `(Skipped in dev mode. Set VITE_PLATFORM_ORIGIN to enable.)`
    )
  }
  
  return false
}

