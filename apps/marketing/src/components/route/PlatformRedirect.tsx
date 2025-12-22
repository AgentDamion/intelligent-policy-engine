/**
 * PlatformRedirect Component
 * 
 * Renders a loading state while redirecting to the Platform App.
 * Used for routes that belong to the platform, not marketing.
 */

import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getPlatformOrigin, buildPlatformRedirectUrl } from '@/utils/platformRedirect'

interface PlatformRedirectProps {
  /** Optional custom message to show during redirect */
  message?: string
}

export function PlatformRedirect({ message }: PlatformRedirectProps) {
  const location = useLocation()
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const [showManualLink, setShowManualLink] = useState(false)

  useEffect(() => {
    const url = buildPlatformRedirectUrl(location.pathname)
    setRedirectUrl(url)

    if (url && import.meta.env.PROD) {
      // Perform redirect
      window.location.replace(url)
    } else if (url) {
      // In dev, show manual link after a delay
      const timer = setTimeout(() => setShowManualLink(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  const platformOrigin = getPlatformOrigin()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center max-w-md p-8">
        {/* Loading spinner */}
        <div className="mb-6">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>

        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          {message || 'Redirecting to Platform...'}
        </h2>
        
        <p className="text-slate-600 text-sm mb-4">
          This feature is available in the AICOMPLYR Platform.
        </p>

        {/* Show manual link in dev or if redirect fails */}
        {(showManualLink || !platformOrigin) && redirectUrl && (
          <a
            href={redirectUrl}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Platform
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {!platformOrigin && (
          <p className="text-amber-600 text-xs mt-4">
            Platform origin not configured. Set VITE_PLATFORM_ORIGIN in your environment.
          </p>
        )}
      </div>
    </div>
  )
}

export default PlatformRedirect

