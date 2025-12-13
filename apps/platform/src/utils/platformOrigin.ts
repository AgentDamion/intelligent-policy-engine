/**
 * Canonical origin for the platform app.
 *
 * This prevents Supabase auth callbacks (OTP/OAuth/confirm/reset) from landing on
 * the marketing domain when users start auth flows from there.
 */
export function getPlatformOrigin(): string {
  const envOrigin = (import.meta as any).env?.VITE_PLATFORM_ORIGIN as string | undefined
  if (envOrigin && typeof envOrigin === 'string') return envOrigin.replace(/\/+$/, '')

  // Sensible fallback for production if env isn't set.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase()
    if (host === 'aicomplyr.io' || host === 'www.aicomplyr.io') return 'https://app.aicomplyr.io'
    return window.location.origin
  }

  return ''
}

export function ensureOnPlatformOrigin() {
  const platformOrigin = getPlatformOrigin()
  if (!platformOrigin || typeof window === 'undefined') return

  if (window.location.origin !== platformOrigin) {
    const next = `${platformOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`
    window.location.replace(next)
  }
}

